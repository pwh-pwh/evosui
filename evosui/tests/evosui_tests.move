#[test_only]
module evosui::evosui_tests {
    use sui::test_scenario;
    use evosui::evosui;
    use evosui::creature_stats;

    const ADDR1: address = @0x1;
    const ADDR2: address = @0x2;

    #[test]
    fun test_stats_and_synergy() {
        let mut scenario = test_scenario::begin(ADDR1);
        let mut creature = evosui::mint_creature(vector::empty<u8>(), test_scenario::ctx(&mut scenario));
        evosui::add_organ(&mut creature, 2, 2, 100, test_scenario::ctx(&mut scenario));
        evosui::add_skill(&mut creature, 1, 30, 0, test_scenario::ctx(&mut scenario));
        evosui::add_skill(&mut creature, 1, 20, 0, test_scenario::ctx(&mut scenario));

        assert!(evosui::organ_count(&creature) == 1, 0);
        assert!(evosui::skill_count(&creature) == 2, 1);
        assert!(evosui::organ_power_total(&creature) == 100, 2);
        assert!(evosui::skill_power_total(&creature) == 50, 3);
        assert!(evosui::organ_weighted_total(&creature) == 140, 4);
        assert!(evosui::element_synergy_bonus(&creature) == 5, 5);
        assert!(creature_stats::battle_power(&creature) == evosui::battle_power(&creature), 6);

        sui::transfer::public_transfer(creature, ADDR1);
        test_scenario::next_tx(&mut scenario, ADDR1);
        let taken = test_scenario::take_from_sender<evosui::Creature>(&scenario);
        sui::transfer::public_transfer(taken, ADDR1);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_battle_and_exp() {
        let mut scenario = test_scenario::begin(ADDR1);
        let mut a = evosui::mint_creature(vector::empty<u8>(), test_scenario::ctx(&mut scenario));
        let mut b = evosui::mint_creature(vector::empty<u8>(), test_scenario::ctx(&mut scenario));
        evosui::add_organ(&mut a, 1, 3, 120, test_scenario::ctx(&mut scenario));
        evosui::add_skill(&mut a, 2, 40, 0, test_scenario::ctx(&mut scenario));
        evosui::add_skill(&mut b, 2, 10, 0, test_scenario::ctx(&mut scenario));

        let before_a = evosui::exp(&a);
        let before_b = evosui::exp(&b);
        let power_a = evosui::battle_power(&a);
        let power_b = evosui::battle_power(&b);
        evosui::battle(&mut a, &mut b, test_scenario::ctx(&mut scenario));
        assert!(power_a > power_b, 10);
        assert!(evosui::exp(&a) == before_a + 20, 11);
        assert!(evosui::exp(&b) == before_b + 5, 12);

        sui::transfer::public_transfer(a, ADDR1);
        sui::transfer::public_transfer(b, ADDR1);
        test_scenario::next_tx(&mut scenario, ADDR1);
        let taken_a = test_scenario::take_from_sender<evosui::Creature>(&scenario);
        let taken_b = test_scenario::take_from_sender<evosui::Creature>(&scenario);
        sui::transfer::public_transfer(taken_a, ADDR1);
        sui::transfer::public_transfer(taken_b, ADDR1);
        test_scenario::end(scenario);
    }

    #[test, expected_failure]
    fun test_owner_enforced() {
        let mut scenario = test_scenario::begin(ADDR1);
        let creature = evosui::mint_creature(vector::empty<u8>(), test_scenario::ctx(&mut scenario));
        sui::transfer::public_transfer(creature, ADDR2);
        test_scenario::next_tx(&mut scenario, ADDR2);
        let mut taken = test_scenario::take_from_sender<evosui::Creature>(&scenario);
        evosui::feed(&mut taken, 10, test_scenario::ctx(&mut scenario));
        sui::transfer::public_transfer(taken, ADDR2);
        test_scenario::end(scenario);
    }
}
