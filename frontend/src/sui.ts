import { TransactionBlock } from "@mysten/sui/transactions";

export function hexToBytes(hex: string): number[] {
  const clean = hex.trim().replace(/^0x/, "");
  if (clean.length === 0) return [];
  if (clean.length % 2 !== 0) {
    throw new Error("Hex length must be even");
  }
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    out.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return out;
}

export function buildMintTx(
  packageId: string,
  genomeHex: string,
  recipient: string
) {
  const tx = new TransactionBlock();
  const genome = hexToBytes(genomeHex);
  const creature = tx.moveCall({
    target: `${packageId}::evosui::mint_creature`,
    arguments: [tx.pure(genome)],
  });
  tx.transferObjects([creature], tx.pure(recipient));
  return tx;
}

export function buildAddOrganTx(
  packageId: string,
  creatureId: string,
  kind: number,
  rarity: number,
  power: number
) {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${packageId}::evosui::add_organ`,
    arguments: [
      tx.object(creatureId),
      tx.pure(kind),
      tx.pure(rarity),
      tx.pure(power),
    ],
  });
  return tx;
}

export function buildAddSkillTx(
  packageId: string,
  creatureId: string,
  element: number,
  power: number,
  cooldown: number
) {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${packageId}::evosui::add_skill`,
    arguments: [
      tx.object(creatureId),
      tx.pure(element),
      tx.pure(power),
      tx.pure(cooldown),
    ],
  });
  return tx;
}

export function buildFeedTx(
  packageId: string,
  creatureId: string,
  foodExp: number
) {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${packageId}::evosui::feed`,
    arguments: [tx.object(creatureId), tx.pure(foodExp)],
  });
  return tx;
}

export function buildEvolveTx(packageId: string, creatureId: string) {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${packageId}::evosui::evolve`,
    arguments: [tx.object(creatureId)],
  });
  return tx;
}

export function buildMutateTx(
  packageId: string,
  creatureId: string,
  seed: number
) {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${packageId}::evosui::mutate`,
    arguments: [tx.object(creatureId), tx.pure(seed)],
  });
  return tx;
}

export function buildBattleTx(
  packageId: string,
  creatureA: string,
  creatureB: string
) {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${packageId}::evosui::battle`,
    arguments: [tx.object(creatureA), tx.object(creatureB)],
  });
  return tx;
}

export function buildSnapshotTx(packageId: string, creatureId: string) {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${packageId}::creature_stats::snapshot`,
    arguments: [tx.object(creatureId)],
  });
  return tx;
}
