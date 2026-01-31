import { Transaction } from "@mysten/sui/transactions";

type SharedObjectRef = {
  objectId: string;
  initialSharedVersion: string | number;
  mutable: boolean;
};

function arenaArg(tx: Transaction, arena: string | SharedObjectRef) {
  if (typeof arena === "string") {
    return tx.object(arena);
  }
  return tx.sharedObjectRef({
    objectId: arena.objectId,
    initialSharedVersion: arena.initialSharedVersion,
    mutable: arena.mutable,
  });
}

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
  const tx = new Transaction();
  const genome = hexToBytes(genomeHex);
  const creature = tx.moveCall({
    target: `${packageId}::evosui::mint_creature`,
    arguments: [tx.pure.vector("u8", genome)],
  });
  tx.transferObjects([creature], tx.pure.address(recipient));
  return tx;
}

export function buildAddOrganTx(
  packageId: string,
  creatureId: string,
  kind: number,
  rarity: number,
  power: number
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::add_organ`,
    arguments: [
      tx.object(creatureId),
      tx.pure.u8(kind),
      tx.pure.u8(rarity),
      tx.pure.u64(power),
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
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::add_skill`,
    arguments: [
      tx.object(creatureId),
      tx.pure.u8(element),
      tx.pure.u64(power),
      tx.pure.u64(cooldown),
    ],
  });
  return tx;
}

export function buildFeedTx(
  packageId: string,
  creatureId: string,
  foodExp: number
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::feed`,
    arguments: [tx.object(creatureId), tx.pure.u64(foodExp)],
  });
  return tx;
}

export function buildEvolveTx(packageId: string, creatureId: string) {
  const tx = new Transaction();
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
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::mutate`,
    arguments: [tx.object(creatureId), tx.pure.u64(seed)],
  });
  return tx;
}

export function buildBattleTx(
  packageId: string,
  creatureA: string,
  creatureB: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::battle`,
    arguments: [tx.object(creatureA), tx.object(creatureB)],
  });
  return tx;
}

export function buildCreateArenaTx(packageId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::create_arena`,
    arguments: [],
  });
  return tx;
}

export function buildDepositArenaTx(
  packageId: string,
  arenaId: string | SharedObjectRef,
  creatureId: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::deposit_arena`,
    arguments: [arenaArg(tx, arenaId), tx.object(creatureId)],
  });
  return tx;
}

export function buildWithdrawArenaTx(
  packageId: string,
  arenaId: string | SharedObjectRef,
  creatureId: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::withdraw_arena`,
    arguments: [arenaArg(tx, arenaId), tx.object(creatureId)],
  });
  return tx;
}

export function buildArenaBattleTx(
  packageId: string,
  arenaId: string | SharedObjectRef,
  creatureA: string,
  creatureB: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::battle_in_arena`,
    arguments: [arenaArg(tx, arenaId), tx.object(creatureA), tx.object(creatureB)],
  });
  return tx;
}

export function buildBattlePowerTx(packageId: string, creatureId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::evosui::battle_power`,
    arguments: [tx.object(creatureId)],
  });
  return tx;
}

export function buildSnapshotTx(packageId: string, creatureId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::creature_stats::snapshot`,
    arguments: [tx.object(creatureId)],
  });
  return tx;
}
