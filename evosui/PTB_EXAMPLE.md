# PTB Examples (Sui)

These are minimal PTB sketches for local testing. Replace `<PACKAGE>` with your published package ID.

## Mint + Initialize + Transfer
```
sui client ptb \
  --assign creature \
  --move-call <PACKAGE>::evosui::mint_creature \
  --args "vector<u8>:0x010203" \
  --move-call <PACKAGE>::evosui::add_organ \
  --args creature 2 2 100 \
  --move-call <PACKAGE>::evosui::add_skill \
  --args creature 1 30 0 \
  --transfer-objects [creature] @OWNER
```

## Update Owner on Transfer (same PTB)
```
sui client ptb \
  --assign creature \
  --move-call <PACKAGE>::evosui::mint_creature \
  --args "vector<u8>:0x01" \
  --move-call <PACKAGE>::evosui::set_owner \
  --args creature @NEW_OWNER \
  --transfer-objects [creature] @NEW_OWNER
```

## Battle (same owner for both creatures)
```
sui client ptb \
  --assign a \
  --assign b \
  --move-call <PACKAGE>::evosui::mint_creature \
  --args "vector<u8>:0x01" \
  --assign a \
  --move-call <PACKAGE>::evosui::mint_creature \
  --args "vector<u8>:0x02" \
  --assign b \
  --move-call <PACKAGE>::evosui::battle \
  --args a b
```

## TypeScript (pseudo-code)
```ts
import { Transaction } from "@mysten/sui/transactions";

const tx = new Transaction();
const creature = tx.moveCall({
  target: `${PACKAGE}::evosui::mint_creature`,
  arguments: [tx.pure("vector<u8>:0x01")],
});
tx.moveCall({
  target: `${PACKAGE}::evosui::add_skill`,
  arguments: [creature, tx.pure(1), tx.pure(30), tx.pure(0)],
});
tx.transferObjects([creature], tx.pure(OWNER));
```
