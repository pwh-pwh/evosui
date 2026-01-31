/// Module: creature_stats
module evosui::creature_stats {
    use evosui::evosui::{Creature, Organ, Skill};

    public struct Snapshot has store, drop {
        owner: address,
        level: u64,
        exp: u64,
        stage: u64,
        organ_count: u64,
        skill_count: u64,
        organ_power_total: u64,
        skill_power_total: u64,
        organ_weighted_total: u64,
        skill_weighted_total: u64,
        element_synergy_bonus: u64,
        battle_power: u64,
        organ_kind_counts: vector<u64>,
        skill_element_counts: vector<u64>,
        skill_element_power_totals: vector<u64>,
    }

    /// Counts.
    public fun organ_count(creature: &Creature): u64 {
        evosui::evosui::organ_count(creature)
    }

    public fun skill_count(creature: &Creature): u64 {
        evosui::evosui::skill_count(creature)
    }

    /// Totals.
    public fun organ_power_total(creature: &Creature): u64 {
        evosui::evosui::organ_power_total(creature)
    }

    public fun skill_power_total(creature: &Creature): u64 {
        evosui::evosui::skill_power_total(creature)
    }

    public fun organ_weighted_total(creature: &Creature): u64 {
        evosui::evosui::organ_weighted_total(creature)
    }

    public fun skill_weighted_total(creature: &Creature): u64 {
        evosui::evosui::skill_weighted_total(creature)
    }

    public fun battle_power(creature: &Creature): u64 {
        evosui::evosui::battle_power(creature)
    }

    public fun element_synergy_bonus(creature: &Creature): u64 {
        evosui::evosui::element_synergy_bonus(creature)
    }

    /// Existence checks.
    public fun organ_exists(creature: &Creature, key_id: u64): bool {
        evosui::evosui::organ_exists(creature, key_id)
    }

    public fun skill_exists(creature: &Creature, key_id: u64): bool {
        evosui::evosui::skill_exists(creature, key_id)
    }

    /// Borrow helpers.
    public fun borrow_organ(creature: &Creature, key_id: u64): &Organ {
        evosui::evosui::borrow_organ(creature, key_id)
    }

    public fun borrow_skill(creature: &Creature, key_id: u64): &Skill {
        evosui::evosui::borrow_skill(creature, key_id)
    }

    public fun snapshot(creature: &Creature): Snapshot {
        let organ_kind_counts = evosui::evosui::organ_kind_counts(creature);
        let skill_element_counts = evosui::evosui::skill_element_counts(creature);
        let skill_element_power_totals = evosui::evosui::skill_element_power_totals(creature);
        Snapshot {
            owner: evosui::evosui::owner(creature),
            level: evosui::evosui::level(creature),
            exp: evosui::evosui::exp(creature),
            stage: evosui::evosui::stage(creature),
            organ_count: evosui::evosui::organ_count(creature),
            skill_count: evosui::evosui::skill_count(creature),
            organ_power_total: evosui::evosui::organ_power_total(creature),
            skill_power_total: evosui::evosui::skill_power_total(creature),
            organ_weighted_total: evosui::evosui::organ_weighted_total(creature),
            skill_weighted_total: evosui::evosui::skill_weighted_total(creature),
            element_synergy_bonus: evosui::evosui::element_synergy_bonus(creature),
            battle_power: evosui::evosui::battle_power(creature),
            organ_kind_counts,
            skill_element_counts,
            skill_element_power_totals,
        }
    }
}
