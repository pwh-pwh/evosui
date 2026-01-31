/// Module: evosui
module evosui::evosui {
    const MAX_GENOME_LEN: u64 = 64;
    const BASE_EXP_PER_STAGE: u64 = 100;
    const MAX_ORGAN_KIND: u64 = 8;
    const MAX_ELEMENT: u64 = 8;
    const RARITY_WEIGHT_STEP: u64 = 20;
    const RARITY_WEIGHT_BASE: u64 = 100;
    const LEVEL_POWER_BONUS: u64 = 10;
    const BATTLE_EXP_WIN: u64 = 20;
    const BATTLE_EXP_LOSE: u64 = 5;
    const BATTLE_EXP_TIE: u64 = 8;

    const E_NOT_OWNER: u64 = 100;

    /// Core on-chain creature object.
    public struct Creature has key, store {
        id: sui::object::UID,
        owner: address,
        genome: vector<u8>,
        genes: vector<GeneSegment>,
        level: u64,
        exp: u64,
        stage: u64,
        born_epoch: u64,
        next_organ_id: u64,
        next_skill_id: u64,
        organ_count: u64,
        skill_count: u64,
        organ_power_total: u64,
        skill_power_total: u64,
        organ_weighted_total: u64,
        skill_weighted_total: u64,
        organ_kind_counts: vector<u64>,
        skill_element_counts: vector<u64>,
        skill_element_power_totals: vector<u64>,
    }

    /// Compact gene segment for structured traits.
    public struct GeneSegment has copy, drop, store {
        locus: u8,
        allele: u8,
        dominance: u8,
        mutation_rate: u8,
    }

    /// Organ object nested via dynamic fields.
    public struct Organ has key, store {
        id: sui::object::UID,
        kind: u8,
        rarity: u8,
        power: u64,
    }

    /// Skill object nested via dynamic fields.
    public struct Skill has key, store {
        id: sui::object::UID,
        element: u8,
        power: u64,
        cooldown: u64,
    }

    public struct OrganKey has copy, drop, store {
        id: u64,
    }

    public struct SkillKey has copy, drop, store {
        id: u64,
    }

    public struct BattleOutcome has drop, store {
        winner: u8,
        power_a: u64,
        power_b: u64,
        exp_gain_a: u64,
        exp_gain_b: u64,
    }

    /// Mint a new creature with a genome payload.
    public fun mint_creature(genome: vector<u8>, ctx: &mut sui::tx_context::TxContext): Creature {
        assert!(vector::length(&genome) <= MAX_GENOME_LEN, 0);
        let creature = Creature {
            id: sui::object::new(ctx),
            owner: sui::tx_context::sender(ctx),
            genome,
            genes: vector::empty<GeneSegment>(),
            level: 1,
            exp: 0,
            stage: 0,
            born_epoch: sui::tx_context::epoch(ctx),
            next_organ_id: 0,
            next_skill_id: 0,
            organ_count: 0,
            skill_count: 0,
            organ_power_total: 0,
            skill_power_total: 0,
            organ_weighted_total: 0,
            skill_weighted_total: 0,
            organ_kind_counts: zero_u64_vec(MAX_ORGAN_KIND),
            skill_element_counts: zero_u64_vec(MAX_ELEMENT),
            skill_element_power_totals: zero_u64_vec(MAX_ELEMENT),
        };
        creature
    }

    /// Feed a creature to gain experience.
    public fun feed(creature: &mut Creature, food_exp: u64, ctx: &mut sui::tx_context::TxContext) {
        assert_owner(creature, ctx);
        apply_exp(creature, food_exp);
    }

    /// Evolve a creature if it has enough experience for the next stage.
    public fun evolve(creature: &mut Creature, ctx: &mut sui::tx_context::TxContext) {
        assert_owner(creature, ctx);
        let required = required_exp(creature.stage + 1);
        assert!(creature.exp >= required, 1);
        creature.stage = creature.stage + 1;
    }

    /// Mutate a creature genome deterministically from a provided seed.
    public fun mutate(creature: &mut Creature, seed: u64, ctx: &mut sui::tx_context::TxContext) {
        assert_owner(creature, ctx);
        let len = vector::length(&creature.genome);
        if (len == 0) {
            return
        };
        let idx = seed % len;
        let gene_ref = vector::borrow_mut(&mut creature.genome, idx);
        *gene_ref = *gene_ref ^ 0x1;
    }

    /// Breed two parents to create a new child creature for the sender.
    public fun breed(
        parent_a: &Creature,
        parent_b: &Creature,
        ctx: &mut sui::tx_context::TxContext,
    ): Creature {
        assert_owner(parent_a, ctx);
        assert_owner(parent_b, ctx);
        let child_genome = combine_genomes(&parent_a.genome, &parent_b.genome);
        let creature = Creature {
            id: sui::object::new(ctx),
            owner: sui::tx_context::sender(ctx),
            genome: child_genome,
            genes: vector::empty<GeneSegment>(),
            level: 1,
            exp: 0,
            stage: 0,
            born_epoch: sui::tx_context::epoch(ctx),
            next_organ_id: 0,
            next_skill_id: 0,
            organ_count: 0,
            skill_count: 0,
            organ_power_total: 0,
            skill_power_total: 0,
            organ_weighted_total: 0,
            skill_weighted_total: 0,
            organ_kind_counts: zero_u64_vec(MAX_ORGAN_KIND),
            skill_element_counts: zero_u64_vec(MAX_ELEMENT),
            skill_element_power_totals: zero_u64_vec(MAX_ELEMENT),
        };
        creature
    }

    /// Append a structured gene segment.
    public fun add_gene_segment(
        creature: &mut Creature,
        locus: u8,
        allele: u8,
        dominance: u8,
        mutation_rate: u8,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_owner(creature, ctx);
        let segment = GeneSegment { locus, allele, dominance, mutation_rate };
        vector::push_back(&mut creature.genes, segment);
    }

    /// Attach an organ as a dynamic field child object.
    public fun add_organ(
        creature: &mut Creature,
        kind: u8,
        rarity: u8,
        power: u64,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_owner(creature, ctx);
        let kind_idx = kind as u64;
        assert!(kind_idx < MAX_ORGAN_KIND, 6);
        let organ = Organ { id: sui::object::new(ctx), kind, rarity, power };
        let key = OrganKey { id: creature.next_organ_id };
        creature.next_organ_id = creature.next_organ_id + 1;
        creature.organ_count = creature.organ_count + 1;
        creature.organ_power_total = creature.organ_power_total + power;
        creature.organ_weighted_total = creature.organ_weighted_total + apply_rarity_weight(power, rarity);
        let count_ref = vector::borrow_mut(&mut creature.organ_kind_counts, kind_idx);
        *count_ref = *count_ref + 1;
        sui::dynamic_field::add(&mut creature.id, key, organ);
    }

    /// Attach a skill as a dynamic field child object.
    public fun add_skill(
        creature: &mut Creature,
        element: u8,
        power: u64,
        cooldown: u64,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_owner(creature, ctx);
        let element_idx = element as u64;
        assert!(element_idx < MAX_ELEMENT, 7);
        let skill = Skill { id: sui::object::new(ctx), element, power, cooldown };
        let key = SkillKey { id: creature.next_skill_id };
        creature.next_skill_id = creature.next_skill_id + 1;
        creature.skill_count = creature.skill_count + 1;
        creature.skill_power_total = creature.skill_power_total + power;
        creature.skill_weighted_total = creature.skill_weighted_total + power;
        let count_ref = vector::borrow_mut(&mut creature.skill_element_counts, element_idx);
        *count_ref = *count_ref + 1;
        let power_ref = vector::borrow_mut(&mut creature.skill_element_power_totals, element_idx);
        *power_ref = *power_ref + power;
        sui::dynamic_field::add(&mut creature.id, key, skill);
    }

    /// Detach an organ by key id and return it to the caller.
    public fun remove_organ(
        creature: &mut Creature,
        key_id: u64,
        ctx: &mut sui::tx_context::TxContext,
    ): Organ {
        assert_owner(creature, ctx);
        let key = OrganKey { id: key_id };
        let organ: Organ = sui::dynamic_field::remove(&mut creature.id, key);
        assert!(creature.organ_count > 0, 2);
        assert!(creature.organ_power_total >= organ.power, 3);
        creature.organ_count = creature.organ_count - 1;
        creature.organ_power_total = creature.organ_power_total - organ.power;
        creature.organ_weighted_total = creature.organ_weighted_total - apply_rarity_weight(organ.power, organ.rarity);
        let kind_idx = organ.kind as u64;
        assert!(kind_idx < MAX_ORGAN_KIND, 8);
        let count_ref = vector::borrow_mut(&mut creature.organ_kind_counts, kind_idx);
        assert!(*count_ref > 0, 9);
        *count_ref = *count_ref - 1;
        organ
    }

    /// Detach a skill by key id and return it to the caller.
    public fun remove_skill(
        creature: &mut Creature,
        key_id: u64,
        ctx: &mut sui::tx_context::TxContext,
    ): Skill {
        assert_owner(creature, ctx);
        let key = SkillKey { id: key_id };
        let skill: Skill = sui::dynamic_field::remove(&mut creature.id, key);
        assert!(creature.skill_count > 0, 4);
        assert!(creature.skill_power_total >= skill.power, 5);
        creature.skill_count = creature.skill_count - 1;
        creature.skill_power_total = creature.skill_power_total - skill.power;
        creature.skill_weighted_total = creature.skill_weighted_total - skill.power;
        let element_idx = skill.element as u64;
        assert!(element_idx < MAX_ELEMENT, 10);
        let count_ref = vector::borrow_mut(&mut creature.skill_element_counts, element_idx);
        assert!(*count_ref > 0, 11);
        *count_ref = *count_ref - 1;
        let power_ref = vector::borrow_mut(&mut creature.skill_element_power_totals, element_idx);
        assert!(*power_ref >= skill.power, 12);
        *power_ref = *power_ref - skill.power;
        skill
    }

    /// Query helpers for counts and totals.
    public fun organ_count(creature: &Creature): u64 {
        creature.organ_count
    }

    public fun skill_count(creature: &Creature): u64 {
        creature.skill_count
    }

    public fun organ_power_total(creature: &Creature): u64 {
        creature.organ_power_total
    }

    public fun skill_power_total(creature: &Creature): u64 {
        creature.skill_power_total
    }

    public fun organ_weighted_total(creature: &Creature): u64 {
        creature.organ_weighted_total
    }

    public fun skill_weighted_total(creature: &Creature): u64 {
        creature.skill_weighted_total
    }

    public fun organ_kind_count(creature: &Creature, kind: u8): u64 {
        let idx = kind as u64;
        assert!(idx < MAX_ORGAN_KIND, 13);
        *vector::borrow(&creature.organ_kind_counts, idx)
    }

    public fun skill_element_count(creature: &Creature, element: u8): u64 {
        let idx = element as u64;
        assert!(idx < MAX_ELEMENT, 14);
        *vector::borrow(&creature.skill_element_counts, idx)
    }

    public fun skill_element_power_total(creature: &Creature, element: u8): u64 {
        let idx = element as u64;
        assert!(idx < MAX_ELEMENT, 15);
        *vector::borrow(&creature.skill_element_power_totals, idx)
    }

    public fun organ_kind_counts(creature: &Creature): vector<u64> {
        copy_u64_vec(&creature.organ_kind_counts)
    }

    public fun skill_element_counts(creature: &Creature): vector<u64> {
        copy_u64_vec(&creature.skill_element_counts)
    }

    public fun skill_element_power_totals(creature: &Creature): vector<u64> {
        copy_u64_vec(&creature.skill_element_power_totals)
    }

    /// Existence checks for dynamic field children.
    public fun organ_exists(creature: &Creature, key_id: u64): bool {
        let key = OrganKey { id: key_id };
        sui::dynamic_field::exists_(&creature.id, key)
    }

    public fun skill_exists(creature: &Creature, key_id: u64): bool {
        let key = SkillKey { id: key_id };
        sui::dynamic_field::exists_(&creature.id, key)
    }

    /// Borrow child objects for read-only inspection.
    public fun borrow_organ(creature: &Creature, key_id: u64): &Organ {
        let key = OrganKey { id: key_id };
        sui::dynamic_field::borrow(&creature.id, key)
    }

    public fun borrow_skill(creature: &Creature, key_id: u64): &Skill {
        let key = SkillKey { id: key_id };
        sui::dynamic_field::borrow(&creature.id, key)
    }

    public fun owner(creature: &Creature): address {
        creature.owner
    }

    public fun level(creature: &Creature): u64 {
        creature.level
    }

    public fun exp(creature: &Creature): u64 {
        creature.exp
    }

    public fun stage(creature: &Creature): u64 {
        creature.stage
    }

    public fun set_owner(
        creature: &mut Creature,
        new_owner: address,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_owner(creature, ctx);
        creature.owner = new_owner;
    }

    public fun element_synergy_bonus(creature: &Creature): u64 {
        element_synergy_bonus_from_vectors(
            &creature.skill_element_counts,
            &creature.skill_element_power_totals,
        )
    }

    public fun battle_power(creature: &Creature): u64 {
        let base = creature.organ_weighted_total + creature.skill_weighted_total;
        let synergy = element_synergy_bonus(creature);
        base + synergy + (creature.level * LEVEL_POWER_BONUS)
    }

    public fun battle(
        creature_a: &mut Creature,
        creature_b: &mut Creature,
        ctx: &mut sui::tx_context::TxContext,
    ): BattleOutcome {
        assert_owner(creature_a, ctx);
        assert_owner(creature_b, ctx);
        let power_a = battle_power(creature_a);
        let power_b = battle_power(creature_b);
        let mut winner = 2;
        let mut exp_a = BATTLE_EXP_TIE;
        let mut exp_b = BATTLE_EXP_TIE;
        if (power_a > power_b) {
            winner = 0;
            exp_a = BATTLE_EXP_WIN;
            exp_b = BATTLE_EXP_LOSE;
        } else if (power_b > power_a) {
            winner = 1;
            exp_a = BATTLE_EXP_LOSE;
            exp_b = BATTLE_EXP_WIN;
        };
        apply_exp(creature_a, exp_a);
        apply_exp(creature_b, exp_b);
        BattleOutcome {
            winner,
            power_a,
            power_b,
            exp_gain_a: exp_a,
            exp_gain_b: exp_b,
        }
    }

    fun apply_rarity_weight(power: u64, rarity: u8): u64 {
        let weight = RARITY_WEIGHT_BASE + (rarity as u64) * RARITY_WEIGHT_STEP;
        (power * weight) / RARITY_WEIGHT_BASE
    }

    fun zero_u64_vec(len: u64): vector<u64> {
        let mut out = vector::empty<u64>();
        let mut i = 0;
        while (i < len) {
            vector::push_back(&mut out, 0);
            i = i + 1;
        };
        out
    }

    fun copy_u64_vec(src: &vector<u64>): vector<u64> {
        let mut out = vector::empty<u64>();
        let len = vector::length(src);
        let mut i = 0;
        while (i < len) {
            vector::push_back(&mut out, *vector::borrow(src, i));
            i = i + 1;
        };
        out
    }

    fun element_synergy_bonus_from_vectors(counts: &vector<u64>, totals: &vector<u64>): u64 {
        let len = vector::length(counts);
        let mut i = 0;
        let mut bonus = 0;
        while (i < len) {
            let count = *vector::borrow(counts, i);
            if (count >= 2) {
                let power = *vector::borrow(totals, i);
                bonus = bonus + (power / 10);
            };
            i = i + 1;
        };
        bonus
    }

    fun assert_owner(creature: &Creature, ctx: &sui::tx_context::TxContext) {
        assert!(creature.owner == sui::tx_context::sender(ctx), E_NOT_OWNER);
    }

    fun apply_exp(creature: &mut Creature, gain: u64) {
        creature.exp = creature.exp + gain;
        creature.level = 1 + (creature.exp / BASE_EXP_PER_STAGE);
    }

    fun required_exp(stage: u64): u64 {
        stage * BASE_EXP_PER_STAGE
    }

    fun combine_genomes(a: &vector<u8>, b: &vector<u8>): vector<u8> {
        let len_a = vector::length(a);
        let len_b = vector::length(b);
        let min_len = if (len_a < len_b) { len_a } else { len_b };
        let mut out = vector::empty<u8>();
        let mut i = 0;
        while (i < min_len && i < MAX_GENOME_LEN) {
            let gene = if (i % 2 == 0) { *vector::borrow(a, i) } else { *vector::borrow(b, i) };
            vector::push_back(&mut out, gene);
            i = i + 1;
        };
        out
    }
}
