import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  buildAddOrganTx,
  buildAddSkillTx,
  buildArenaBattleTx,
  buildCreateArenaTx,
  buildDepositArenaTx,
  buildBattleTx,
  buildEvolveTx,
  buildFeedTx,
  buildMintTx,
  buildMutateTx,
  buildSnapshotTx,
  buildWithdrawArenaTx,
} from "./sui";
import { DEFAULT_PACKAGE_ID } from "./config";
import CreatureAvatar from "./CreatureAvatar";

type ExecResult = {
  digest?: string;
  error?: string;
  raw?: unknown;
};

type CreatureItem = {
  id: string;
  level?: number;
  exp?: number;
  stage?: number;
  genomeHex?: string;
};

type BattleRecord = {
  id: string;
  a: string;
  b: string;
  winner: "A" | "B" | "T" | "?";
  powerA?: number;
  powerB?: number;
  expA?: number;
  expB?: number;
  digest?: string;
  ts: number;
};

type ChainBattleEvent = {
  creature_a?: string;
  creature_b?: string;
  winner?: string | number;
  power_a?: string | number;
  power_b?: string | number;
  exp_gain_a?: string | number;
  exp_gain_b?: string | number;
  epoch?: string | number;
  sender?: string;
};

type ChainArenaEvent = {
  arena_id?: string;
  creator?: string;
  epoch?: string | number;
};

type ArenaItem = {
  id: string;
  initialSharedVersion?: string | number;
};

type ArenaCreatureItem = {
  id: string;
  owner?: string;
  key?: string;
  level?: number;
  exp?: number;
  stage?: number;
  genomeHex?: string;
};

const I18N = {
  zh: {
    tag: "EvoSui · On-chain Evolution",
    title: "生物进化的链上实验室",
    subtitle: "用可编程交易块驱动生命体的成长、变异与对战。输入 Package ID 与对象 ID 即可直接对接合约。",
    disconnected: "未连接",
    language: "EN",
    config: "配置",
    packageId: "Package ID",
    creatureId: "Creature ID",
    creatureIdB: "Creature B ID",
    readCreature: "读取 Creature 对象",
    arenaId: "Arena ID",
    createArena: "创建共享对战场",
    loadArenas: "加载 Arena 列表",
    noArenas: "暂无 Arena",
    selectArena: "选择",
    unclaimedCreatures: "未取回生物",
    refreshUnclaimed: "刷新未取回",
    noUnclaimed: "暂无未取回生物",
    owner: "Owner",
    mine: "我的",
    withdraw: "取回",
    loading: "加载中…",
    loadFailed: "加载失败：",
    landingTitle: "EvoSui 生命流",
    landingSubtitle: "每个生命体都由链上基因实时生成，在流动的 Sui 里进化。",
    landingStart: "进入世界",
    landingNote: "随机基因驱动的独特生物 · 链上成长与对战",
    myCreatures: "我的 Creature",
    refreshList: "刷新列表",
    listHint: "滚动查看更多",
    errorPrefix: "错误：",
    emptyCreatures: "暂无 Creature，先 Mint 一个。",
    clickAvatarHint: "点击头像查看对战详情",
    setA: "设为A",
    setB: "设为B",
    mint: "Mint",
    genomeHex: "Genome Hex",
    createCreature: "创建 Creature",
    mintHint: "交易完成后在钱包里找到新对象 ID，再填到 Creature ID。",
    mintReveal: "新生命体生成",
    mintRevealHint: "已在链上铸造，选择后可开始培养。",
    organsSkills: "器官 / 技能",
    kind: "Kind",
    rarity: "Rarity",
    power: "Power",
    addOrgan: "添加器官",
    element: "Element",
    skillPower: "Skill Power",
    cooldown: "Cooldown",
    addSkill: "添加技能",
    growth: "成长",
    foodExp: "Food EXP",
    feed: "喂养",
    nextExp: "下一阶段所需经验",
    evolve: "进化",
    evolveNeed: "经验不足，先喂养提升 EXP。",
    mutationSeed: "Mutation Seed",
    mutate: "变异",
    battle: "对战",
    battleHint: "同一钱包拥有两只 Creature 才可对战。",
    arenaHint: "跨钱包对战：填写 Arena ID，并由双方各自存入 Creature。",
    depositA: "A 入场",
    depositB: "B 入场",
    withdrawA: "A 取回",
    withdrawB: "B 取回",
    battleCheck: "对战准备状态",
    ready: "已就绪",
    missing: "未满足",
    unknown: "未知",
    walletReady: "钱包连接",
    packageReady: "Package 已填写",
    arenaReady: "Arena 已填写",
    aSelected: "已选择 A",
    bSelected: "已选择 B",
    aInArena: "A 已入场",
    bInArena: "B 已入场",
    battleReady: "可发起对战",
    arenaNote: "Arena 模式下，仅能确认当前钱包已入场的生物。",
    battleStart: "发起对战",
    battleHistoryHint: "对战记录来自链上事件（需合约已升级）。",
    snapshot: "只读快照",
    snapshotHint: "使用 devInspect 读取 snapshot 返回值。",
    getSnapshot: "获取 Snapshot",
    resultTitle: "执行结果 / 对象数据",
    txResult: "交易结果",
    creatureObject: "Creature 对象",
    noSnapshot: "暂无快照",
    noObjectData: "暂无对象数据",
    battleHistoryTitle: "对战历史",
    close: "关闭",
    noBattleHistory: "暂无对战记录",
    battleEngaged: "Battle Engaged",
    battleSettling: "链上对战结算中…",
    draw: "平局",
    aWin: "A 胜",
    bWin: "B 胜",
    recallHint: "对战已结算，可点击 A/B 取回",
    selectABFirst: "请先选择 A/B Creature。",
    sameCreature: "A/B Creature 不能相同。",
    connectWalletSetPackage: "请先连接钱包并填写 Package ID。",
    levelShort: "Lv",
    expShort: "EXP",
    stageShort: "Stage",
  },
  en: {
    tag: "EvoSui · On-chain Evolution",
    title: "On-chain Evolution Lab",
    subtitle: "Drive growth, mutation, and battles with programmable transactions. Fill Package ID and object ID to interact.",
    disconnected: "Disconnected",
    language: "中文",
    config: "Config",
    packageId: "Package ID",
    creatureId: "Creature ID",
    creatureIdB: "Creature B ID",
    readCreature: "Load Creature Object",
    arenaId: "Arena ID",
    createArena: "Create Shared Arena",
    loadArenas: "Load Arenas",
    noArenas: "No arenas yet",
    selectArena: "Select",
    unclaimedCreatures: "Unclaimed Creatures",
    refreshUnclaimed: "Refresh Unclaimed",
    noUnclaimed: "No unclaimed creatures",
    owner: "Owner",
    mine: "Mine",
    withdraw: "Withdraw",
    loading: "Loading…",
    loadFailed: "Load failed: ",
    landingTitle: "EvoSui Bioflow",
    landingSubtitle: "Every creature is generated from on-chain genes, evolving within Sui’s flow.",
    landingStart: "Enter World",
    landingNote: "Unique creatures · On-chain growth & battles",
    myCreatures: "My Creatures",
    refreshList: "Refresh List",
    listHint: "Scroll to view more",
    errorPrefix: "Error: ",
    emptyCreatures: "No creatures yet. Mint one first.",
    clickAvatarHint: "Click avatar to view battle details",
    setA: "Set A",
    setB: "Set B",
    mint: "Mint",
    genomeHex: "Genome Hex",
    createCreature: "Create Creature",
    mintHint: "After the tx, find the new object ID in wallet and paste into Creature ID.",
    mintReveal: "Creature Awakened",
    mintRevealHint: "Minted on-chain. Select it to start training.",
    organsSkills: "Organs / Skills",
    kind: "Kind",
    rarity: "Rarity",
    power: "Power",
    addOrgan: "Add Organ",
    element: "Element",
    skillPower: "Skill Power",
    cooldown: "Cooldown",
    addSkill: "Add Skill",
    growth: "Growth",
    foodExp: "Food EXP",
    feed: "Feed",
    nextExp: "Required EXP for next stage",
    evolve: "Evolve",
    evolveNeed: "Not enough EXP. Feed first.",
    mutationSeed: "Mutation Seed",
    mutate: "Mutate",
    battle: "Battle",
    battleHint: "Both creatures must be owned by the same wallet.",
    arenaHint: "Cross-wallet battle: set Arena ID and deposit creatures from each owner.",
    depositA: "Deposit A",
    depositB: "Deposit B",
    withdrawA: "Withdraw A",
    withdrawB: "Withdraw B",
    battleCheck: "Battle Readiness",
    ready: "Ready",
    missing: "Missing",
    unknown: "Unknown",
    walletReady: "Wallet connected",
    packageReady: "Package set",
    arenaReady: "Arena set",
    aSelected: "A selected",
    bSelected: "B selected",
    aInArena: "A deposited",
    bInArena: "B deposited",
    battleReady: "Ready to battle",
    arenaNote: "In Arena mode we only verify the current wallet deposits.",
    battleStart: "Start Battle",
    battleHistoryHint: "History is sourced from on-chain events (requires upgraded package).",
    snapshot: "Read-only Snapshot",
    snapshotHint: "Use devInspect to read snapshot return values.",
    getSnapshot: "Get Snapshot",
    resultTitle: "Execution Result / Object Data",
    txResult: "Transaction Result",
    creatureObject: "Creature Object",
    noSnapshot: "No snapshot",
    noObjectData: "No object data",
    battleHistoryTitle: "Battle History",
    close: "Close",
    noBattleHistory: "No battle history",
    battleEngaged: "Battle Engaged",
    battleSettling: "Resolving on-chain battle…",
    draw: "Draw",
    aWin: "A Wins",
    bWin: "B Wins",
    recallHint: "Battle settled. You can withdraw A/B now.",
    selectABFirst: "Select A/B creatures first.",
    sameCreature: "A/B creatures must be different.",
    connectWalletSetPackage: "Connect wallet and set Package ID first.",
    levelShort: "Lv",
    expShort: "EXP",
    stageShort: "Stage",
  },
} as const;

type Lang = keyof typeof I18N;

function bytesToHex(bytes: number[]) {
  return `0x${bytes.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function extractGenomeHex(fields?: Record<string, unknown>) {
  const raw = fields?.genome;
  if (!raw) return undefined;
  if (typeof raw === "string") {
    return raw.startsWith("0x") ? raw : undefined;
  }
  if (Array.isArray(raw)) {
    const bytes = raw.map((v) => Number(v)).filter((v) => Number.isFinite(v));
    return bytes.length ? bytesToHex(bytes) : undefined;
  }
  if (typeof raw === "object") {
    const maybeVec = (raw as { vec?: unknown }).vec;
    if (Array.isArray(maybeVec)) {
      const bytes = maybeVec.map((v) => Number(v)).filter((v) => Number.isFinite(v));
      return bytes.length ? bytesToHex(bytes) : undefined;
    }
  }
  return undefined;
}

function num(v?: string | number): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function App() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("evosui.lang");
    return saved === "en" || saved === "zh" ? saved : "zh";
  });
  const [showLanding, setShowLanding] = useState(true);
  const [packageId, setPackageId] = useState(DEFAULT_PACKAGE_ID);
  const [arenaId, setArenaId] = useState("");
  const [genomeHex, setGenomeHex] = useState("0x010203");
  const [creatureId, setCreatureId] = useState("");
  const [creatureIdB, setCreatureIdB] = useState("");
  const [creatures, setCreatures] = useState<CreatureItem[]>([]);
  const [arenaCreatures, setArenaCreatures] = useState<ArenaCreatureItem[]>([]);
  const [arenas, setArenas] = useState<ArenaItem[]>([]);
  const [arenasLoading, setArenasLoading] = useState(false);
  const [arenasError, setArenasError] = useState("");
  const [creatureError, setCreatureError] = useState("");
  const [battleHistory, setBattleHistory] = useState<BattleRecord[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [battleAnimating, setBattleAnimating] = useState(false);
  const [battleOutcome, setBattleOutcome] = useState<"A" | "B" | "T" | null>(null);
  const [showRecallHint, setShowRecallHint] = useState(false);
  const [kind, setKind] = useState(2);
  const [rarity, setRarity] = useState(2);
  const [power, setPower] = useState(100);
  const [element, setElement] = useState(1);
  const [cooldown, setCooldown] = useState(0);
  const [foodExp, setFoodExp] = useState(10);
  const [seed, setSeed] = useState(42);
  const [result, setResult] = useState<ExecResult>({});
  const [snapshot, setSnapshot] = useState<string>("");
  const [creatureJson, setCreatureJson] = useState<string>("");
  const [mintedCreature, setMintedCreature] = useState<CreatureItem | null>(null);
  const [showMintFx, setShowMintFx] = useState(false);

  useEffect(() => {
    localStorage.setItem("evosui.lang", lang);
  }, [lang]);

  const t = (key: keyof (typeof I18N)["zh"]) => I18N[lang][key];

  const landingCreatures = useMemo(() => {
    const randomHex = (len: number) =>
      `0x${Array.from({ length: len })
        .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, "0"))
        .join("")}`;
    return Array.from({ length: 4 }).map((_, idx) => ({
      genomeHex: randomHex(6 + idx),
      seedHex: randomHex(8),
      level: 1 + (idx % 3),
      stage: idx % 2,
    }));
  }, []);

  const canTransact = Boolean(account?.address && packageId);
  const selectedCreature =
    creatures.find((c) => c.id === creatureId) ||
    arenaCreatures.find((c) => c.id === creatureId || c.key === creatureId);
  const selectedCreatureB =
    creatures.find((c) => c.id === creatureIdB) ||
    arenaCreatures.find((c) => c.id === creatureIdB || c.key === creatureIdB);
  const nextStageRequiredExp =
    selectedCreature?.stage != null ? (selectedCreature.stage + 1) * 100 : undefined;
  const canEvolve =
    selectedCreature?.exp != null && nextStageRequiredExp != null
      ? selectedCreature.exp >= nextStageRequiredExp
      : false;
  const canBattle =
    Boolean(creatureId && creatureIdB) && creatureId !== creatureIdB;
  const arenaCreatureKeys = useMemo(() => {
    const keys = arenaCreatures.map((c) => c.key ?? c.id);
    return new Set(keys);
  }, [arenaCreatures]);
  const arenaMode = Boolean(arenaId);
  const aSelected = Boolean(creatureId);
  const bSelected = Boolean(creatureIdB);
  const aInArena = arenaMode && aSelected ? arenaCreatureKeys.has(creatureId) : false;
  const bInArena = arenaMode && bSelected ? arenaCreatureKeys.has(creatureIdB) : false;
  const battleReady = canBattle && (!arenaMode || (aInArena && bInArena));


  const headerStatus = useMemo(() => {
    if (!account?.address) return t("disconnected");
    return `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
  }, [account?.address, lang]);

  async function exec(txBuilder: () => any) {
    if (!canTransact) {
      setResult({ error: t("connectWalletSetPackage") });
      return;
    }
    try {
      const tx = await txBuilder();
      const res = await signAndExecute({
        transaction: tx,
      });
      setResult({ digest: res?.digest, raw: res });
    } catch (e) {
      setResult({ error: (e as Error).message });
    }
  }

  async function mintCreatureWithFx() {
    if (!canTransact || !account?.address) {
      setResult({ error: t("connectWalletSetPackage") });
      return;
    }
    try {
      const tx = buildMintTx(packageId, genomeHex, account.address);
      const res = await signAndExecute({ transaction: tx });
      setResult({ digest: res?.digest, raw: res });
      const digest =
        res?.digest ||
        (res as { transactionDigest?: string })?.transactionDigest ||
        (res as { effects?: { transactionDigest?: string } })?.effects?.transactionDigest;
      let createdId: string | undefined;
      if (digest) {
        const txBlock = await client.getTransactionBlock({
          digest,
          options: { showObjectChanges: true },
        });
        const created = txBlock.objectChanges?.find(
          (change) =>
            change.type === "created" &&
            "objectType" in change &&
            typeof change.objectType === "string" &&
            change.objectType.includes("::evosui::Creature")
        );
        if (created && "objectId" in created) {
          createdId = String(created.objectId);
        }
      }
      const items = await loadCreatures();
      const fallback =
        items.find((c) => c.genomeHex?.toLowerCase() === genomeHex.toLowerCase()) ||
        items[0];
      const item: CreatureItem = {
        id: createdId ?? fallback?.id ?? "pending",
        level: fallback?.level ?? 1,
        exp: fallback?.exp ?? 0,
        stage: fallback?.stage ?? 0,
        genomeHex: fallback?.genomeHex ?? genomeHex,
      };
      setMintedCreature(item);
      setShowMintFx(true);
      if (createdId) setCreatureId(createdId);
      setTimeout(() => setShowMintFx(false), 2600);
    } catch (e) {
      setResult({ error: (e as Error).message });
    }
  }

  async function loadCreature() {
    if (!creatureId) return;
    try {
      const obj = await client.getObject({
        id: creatureId,
        options: { showContent: true },
      });
      setCreatureJson(JSON.stringify(obj, null, 2));
    } catch (e) {
      setCreatureJson((e as Error).message);
    }
  }

  async function getArenaSharedRef() {
    if (!arenaId) {
      throw new Error("Arena ID is required");
    }
    const obj = await client.getObject({
      id: arenaId,
      options: { showOwner: true },
    });
    const shared = (obj.data?.owner as { Shared?: { initial_shared_version?: string | number } })
      ?.Shared;
    if (!shared?.initial_shared_version) {
      throw new Error("Arena must be a shared object");
    }
    return {
      objectId: arenaId,
      initialSharedVersion: shared.initial_shared_version,
      mutable: true,
    };
  }

  async function devInspectSnapshot() {
    if (!account?.address || !packageId || !creatureId) return;
    try {
      const tx = buildSnapshotTx(packageId, creatureId);
      const resp = await client.devInspectTransactionBlock({
        sender: account.address,
        transactionBlock: tx,
      });
      setSnapshot(JSON.stringify(resp, null, 2));
    } catch (e) {
      setSnapshot((e as Error).message);
    }
  }

  async function loadArenas() {
    if (!packageId) return;
    setArenasLoading(true);
    setArenasError("");
    try {
      const resp = await client.queryEvents({
        query: { MoveEventType: `${packageId}::evosui::ArenaCreatedEvent` },
        limit: 30,
        order: "descending",
      });
      const items: ArenaItem[] = resp.data
        .map((ev) => {
          const parsed = ev.parsedJson as ChainArenaEvent | null;
          const id = parsed?.arena_id ? String(parsed.arena_id) : undefined;
          if (!id) return null;
          return { id };
        })
        .filter((item): item is ArenaItem => Boolean(item));
      const unique = Array.from(new Map(items.map((item) => [item.id, item])).values());
      setArenas(unique);
    } catch (e) {
      setArenas([]);
      setArenasError((e as Error).message);
    } finally {
      setArenasLoading(false);
    }
  }

  async function loadArenaCreatures() {
    if (!arenaId) {
      setArenaCreatures([]);
      return;
    }
    try {
      const arenaObj = await client.getObject({
        id: arenaId,
        options: { showContent: true, showOwner: true },
      });
      const fields = (arenaObj.data?.content as
        | { dataType: "moveObject"; fields?: Record<string, unknown> }
        | undefined)?.fields;
      const creaturesField = fields?.creatures as Record<string, unknown> | string | undefined;
      const tableCandidates = [
        creaturesField,
        (creaturesField as { id?: unknown })?.id,
        (creaturesField as { fields?: { id?: unknown } })?.fields?.id,
        (creaturesField as { fields?: { id?: { id?: unknown } } })?.fields?.id?.id,
        (creaturesField as { id?: { id?: unknown } })?.id?.id,
      ];
      const tableId = tableCandidates.find((cand) => typeof cand === "string") as
        | string
        | undefined;
      if (!tableId) {
        setArenaCreatures([]);
        return;
      }
      const parents = [tableId];
      if (tableId !== arenaId) parents.push(arenaId);
      const dynamicPages = await Promise.all(
        parents.map((parentId) => client.getDynamicFields({ parentId, limit: 50 }))
      );
      const entries = dynamicPages
        .flatMap((page) => page.data)
        .map((entry) => {
          const name = entry.name as {
            value?: unknown;
            id?: unknown;
          };
          const value = typeof name === "string" ? name : name?.value;
          const key =
            typeof value === "string"
              ? value
              : typeof (value as { id?: string })?.id === "string"
              ? (value as { id?: string }).id
              : typeof name?.id === "string"
              ? name.id
              : typeof (name?.id as { id?: string })?.id === "string"
              ? (name.id as { id?: string }).id
              : null;
          if (!key) return null;
          return {
            key,
            objectId: entry.objectId,
            type: entry.type,
            objectType: (entry as { objectType?: string }).objectType,
          };
        })
        .filter(
          (entry): entry is { key: string; objectId: string; type: string; objectType?: string } =>
            Boolean(entry?.key && entry.objectId)
        );
      if (entries.length === 0) {
        setArenaCreatures([]);
        return;
      }
      const keyByObjectId = new Map(entries.map((entry) => [entry.objectId, entry.key]));
      const dynamicObjs = await client.multiGetObjects({
        ids: entries.map((entry) => entry.objectId),
        options: { showContent: true },
      });
      const items: ArenaCreatureItem[] = dynamicObjs
        .map((obj) => {
          const content = obj.data?.content as
            | { dataType: "moveObject"; fields?: Record<string, unknown>; type?: string }
            | undefined;
          const fields = content?.dataType === "moveObject" ? content.fields : undefined;
          if (!fields) return null;
          let creatureFields: Record<string, unknown> | undefined;
          let creatureId: string | undefined;
          if (content?.type?.startsWith("0x2::dynamic_field::Field")) {
            const value = fields.value as { fields?: Record<string, unknown> } | undefined;
            creatureFields = value?.fields;
            const nestedId = (creatureFields?.id as { id?: string } | undefined)?.id;
            creatureId =
              typeof nestedId === "string"
                ? nestedId
                : typeof fields.name === "string"
                ? (fields.name as string)
                : undefined;
          } else {
            creatureFields = fields as Record<string, unknown>;
            creatureId = obj.data?.objectId;
          }
          if (!creatureFields || !creatureId) return null;
          const owner =
            typeof creatureFields.owner === "string" ? creatureFields.owner : undefined;
          const level =
            typeof creatureFields.level === "string" ? Number(creatureFields.level) : undefined;
          const exp =
            typeof creatureFields.exp === "string" ? Number(creatureFields.exp) : undefined;
          const stage =
            typeof creatureFields.stage === "string" ? Number(creatureFields.stage) : undefined;
          const genomeHex = extractGenomeHex(creatureFields);
          return {
            id: creatureId,
            owner,
            key: keyByObjectId.get(obj.data?.objectId ?? "") ?? creatureId,
            level,
            exp,
            stage,
            genomeHex,
          };
        })
        .filter((item): item is ArenaCreatureItem => Boolean(item));
      const mine = account?.address
        ? items.filter((item) => item.owner === account.address)
        : [];
      setArenaCreatures(mine);
    } catch {
      setArenaCreatures([]);
    }
  }

  async function createArenaAndSetId() {
    if (!canTransact) {
      setResult({ error: t("connectWalletSetPackage") });
      return;
    }
    try {
      const tx = buildCreateArenaTx(packageId);
      const res = await signAndExecute({
        transaction: tx,
      });
      setResult({ digest: res?.digest, raw: res });
      if (res?.digest) {
        const txBlock = await client.getTransactionBlock({
          digest: res.digest,
          options: { showObjectChanges: true },
        });
        const created = txBlock.objectChanges?.find(
          (change) =>
            change.type === "created" &&
            "objectType" in change &&
            typeof change.objectType === "string" &&
            change.objectType.includes("::evosui::Arena")
        );
        if (created && "objectId" in created) {
          setArenaId(String(created.objectId));
          loadArenas();
        }
      }
    } catch (e) {
      setResult({ error: (e as Error).message });
    }
  }

  async function loadBattleEvents() {
    if (!packageId) return;
    try {
      const resp = await client.queryEvents({
        query: { MoveEventType: `${packageId}::evosui::BattleEvent` },
        limit: 50,
        order: "descending",
      });
      const records: BattleRecord[] = resp.data
        .map((ev) => {
          const parsed = ev.parsedJson as ChainBattleEvent | null;
          if (!parsed?.creature_a || !parsed?.creature_b) return null;
          const winnerRaw = parsed.winner;
          const winner =
            winnerRaw === 0 || winnerRaw === "0"
              ? "A"
              : winnerRaw === 1 || winnerRaw === "1"
              ? "B"
              : winnerRaw === 2 || winnerRaw === "2"
              ? "T"
              : "?";
          const id = ev.id?.txDigest ?? `${parsed.creature_a}-${parsed.creature_b}-${ev.timestampMs ?? 0}`;
          const ts = typeof ev.timestampMs === "string" ? Number(ev.timestampMs) : ev.timestampMs;
          return {
            id,
            a: String(parsed.creature_a),
            b: String(parsed.creature_b),
            winner,
            powerA: num(parsed.power_a),
            powerB: num(parsed.power_b),
            expA: num(parsed.exp_gain_a),
            expB: num(parsed.exp_gain_b),
            digest: ev.id?.txDigest,
            ts: Number.isFinite(ts ?? NaN) ? (ts as number) : Date.now(),
          };
        })
        .filter((r): r is BattleRecord => Boolean(r));
      setBattleHistory(records);
      if (creatureId && creatureIdB) {
        const match = records.find(
          (h) => h.a === creatureId && h.b === creatureIdB
        );
        if (match) {
          setBattleOutcome(match.winner);
          setShowRecallHint(Boolean(arenaId));
        }
      }
    } catch {
      setBattleHistory([]);
    }
  }

  async function battleWithHistory() {
    if (!canTransact || !creatureId || !creatureIdB) {
      setResult({ error: t("selectABFirst") });
      return;
    }
    if (creatureId === creatureIdB) {
      setResult({ error: t("sameCreature") });
      return;
    }
    setBattleAnimating(true);
    setBattleOutcome(null);
    setShowRecallHint(false);
    try {
      const tx = arenaId
        ? buildArenaBattleTx(
            packageId,
            await getArenaSharedRef(),
            creatureId,
            creatureIdB
          )
        : buildBattleTx(packageId, creatureId, creatureIdB);
      const res = await signAndExecute({ transaction: tx });
      setResult({ digest: res?.digest, raw: res });
      await loadBattleEvents();
    } catch (e) {
      setResult({ error: (e as Error).message });
    } finally {
      setTimeout(() => setBattleAnimating(false), 1200);
    }
  }

  async function loadCreatures() {
    if (!account?.address || !packageId) return [];
    try {
      setCreatureError("");
      const resp = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${packageId}::evosui::Creature`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });
      const items: CreatureItem[] = resp.data
        .map((obj) => {
          const id = obj.data?.objectId;
          if (!id) return null;
          const content = obj.data?.content as
            | { dataType: "moveObject"; fields?: Record<string, unknown> }
            | undefined;
          const fields = content?.dataType === "moveObject" ? content.fields : undefined;
          const level = typeof fields?.level === "string" ? Number(fields.level) : undefined;
          const exp = typeof fields?.exp === "string" ? Number(fields.exp) : undefined;
          const stage = typeof fields?.stage === "string" ? Number(fields.stage) : undefined;
          const genomeHex = extractGenomeHex(fields);
          return { id, level, exp, stage, genomeHex };
        })
        .filter((item): item is CreatureItem => Boolean(item));
      setCreatures(items);
      return items;
    } catch (e) {
      setCreatureError((e as Error).message);
      return [];
    }
  }

  useEffect(() => {
    loadCreatures();
    loadBattleEvents();
    loadArenas();
    loadArenaCreatures();
  }, [account?.address, packageId]);

  useEffect(() => {
    loadArenaCreatures();
  }, [arenaId, account?.address]);

  useEffect(() => {
    if (!arenaId || arenaCreatures.length === 0) return;
    const ids = new Set(arenaCreatures.map((c) => c.id));
    if (!creatureId || !ids.has(creatureId)) {
      setCreatureId(arenaCreatures[0].id);
    }
    if (!creatureIdB || !ids.has(creatureIdB)) {
      const fallback = arenaCreatures.find((c) => c.id !== arenaCreatures[0].id);
      if (fallback) setCreatureIdB(fallback.id);
    }
  }, [arenaId, arenaCreatures]);

  return (
    <div className="app">
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob blob-a" />
        <div className="ambient-blob blob-b" />
        <div className="ambient-blob blob-c" />
        <div className="ambient-particles" />
        <div className="meteor-field">
          <span className="meteor meteor-1" />
          <span className="meteor meteor-2" />
          <span className="meteor meteor-3" />
          <span className="meteor meteor-4" />
        </div>
      </div>
      <AnimatePresence>
        {showLanding ? (
          <motion.div
            className="launch-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="launch-bg">
              <motion.div
                className="launch-orb orb-a"
                animate={{ y: [0, 18, 0], x: [0, -8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="launch-orb orb-b"
                animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="launch-orb orb-c"
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="launch-flow" />
              <div className="launch-flow flow-2" />
            </div>
            <div className="launch-content">
              <motion.div
                className="launch-text"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="launch-tag">{t("tag")}</div>
                <h1>{t("landingTitle")}</h1>
                <p>{t("landingSubtitle")}</p>
                <div className="launch-note">{t("landingNote")}</div>
                <motion.button
                  className="launch-cta"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLanding(false)}
                >
                  {t("landingStart")}
                </motion.button>
              </motion.div>
              <div className="launch-pets">
                {landingCreatures.map((pet, idx) => (
                  <motion.div
                    key={`${pet.seedHex}-${idx}`}
                    className="launch-pet"
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 * idx, duration: 0.7 }}
                  >
                    <div className="glow-avatar">
                      <CreatureAvatar
                        genomeHex={pet.genomeHex}
                        seedHex={pet.seedHex}
                        level={pet.level}
                        stage={pet.stage}
                        size={110}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showMintFx && mintedCreature ? (
          <motion.div
            className="mint-fx"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mint-fx-card"
              initial={{ y: 120, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
            >
              <div className="mint-fx-title">{t("mintReveal")}</div>
              <div className="glow-avatar">
                <CreatureAvatar
                  genomeHex={mintedCreature.genomeHex ?? "0x"}
                  seedHex={mintedCreature.id}
                  level={mintedCreature.level ?? 1}
                  stage={mintedCreature.stage ?? 0}
                  size={140}
                />
              </div>
              <div className="mint-fx-id">{mintedCreature.id}</div>
              <div className="hint">{t("mintRevealHint")}</div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <header className="hero">
        <div>
          <div className="tag">{t("tag")}</div>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <div className="wallet">
          <div className="status">{headerStatus}</div>
          <button
            className="ghost"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          >
            {t("language")}
          </button>
          <div className="connect-shell">
            <ConnectButton />
          </div>
        </div>
      </header>

      <section className="grid-layout">
        <div className="card">
          <div className="card-glyph glyph-orbit" aria-hidden="true" />
          <h2>{t("config")}</h2>
          <label>
            {t("packageId")}
            <input
              value={packageId}
              onChange={(e) => setPackageId(e.target.value.trim())}
              placeholder="0x..."
            />
          </label>
          <label>
            {t("creatureId")}
            <input
              value={creatureId}
              onChange={(e) => setCreatureId(e.target.value.trim())}
              placeholder="0x..."
            />
          </label>
          <label>
            {t("creatureIdB")}
            <input
              value={creatureIdB}
              onChange={(e) => setCreatureIdB(e.target.value.trim())}
              placeholder="0x..."
            />
          </label>
          <label>
            {t("arenaId")}
            <input
              value={arenaId}
              onChange={(e) => setArenaId(e.target.value.trim())}
              placeholder="0x..."
            />
          </label>
          <button className="ghost" onClick={createArenaAndSetId}>
            {t("createArena")}
          </button>
          <button className="ghost" onClick={loadArenas}>
            {t("loadArenas")}
          </button>
          {arenasLoading ? <p className="hint">{t("loading")}</p> : null}
          {arenasError ? (
            <p className="hint">
              {t("loadFailed")}
              {arenasError}
            </p>
          ) : null}
          {arenas.length === 0 ? (
            <p className="hint">{t("noArenas")}</p>
          ) : (
            <label>
              {t("selectArena")}
              <select
                value={arenaId}
                onChange={(e) => setArenaId(e.target.value)}
              >
                <option value="">{t("noArenas")}</option>
                {arenas.map((arena) => (
                  <option key={arena.id} value={arena.id}>
                    {arena.id}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="card">
          <div className="card-glyph glyph-grid" aria-hidden="true" />
          <h2>{t("battleCheck")}</h2>
          <div className="stat-row">
            <span>{t("walletReady")}</span>
            <span>{account?.address ? t("ready") : t("missing")}</span>
          </div>
          <div className="stat-row">
            <span>{t("packageReady")}</span>
            <span>{packageId ? t("ready") : t("missing")}</span>
          </div>
          <div className="stat-row">
            <span>{t("aSelected")}</span>
            <span>{aSelected ? t("ready") : t("missing")}</span>
          </div>
          <div className="stat-row">
            <span>{t("bSelected")}</span>
            <span>{bSelected ? t("ready") : t("missing")}</span>
          </div>
          {arenaMode ? (
            <>
              <div className="stat-row">
                <span>{t("arenaReady")}</span>
                <span>{arenaId ? t("ready") : t("missing")}</span>
              </div>
              <div className="stat-row">
                <span>{t("aInArena")}</span>
                <span>{aSelected ? (aInArena ? t("ready") : t("missing")) : t("missing")}</span>
              </div>
              <div className="stat-row">
                <span>{t("bInArena")}</span>
                <span>{bSelected ? (bInArena ? t("ready") : t("unknown")) : t("missing")}</span>
              </div>
              <p className="hint">{t("arenaNote")}</p>
            </>
          ) : null}
          <div className="stat-row">
            <span>{t("battleReady")}</span>
            <span>{battleReady ? t("ready") : t("missing")}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-glyph glyph-waves" aria-hidden="true" />
          <h2>{t("myCreatures")}</h2>
          <button className="ghost" onClick={loadCreatures}>
            {t("refreshList")}
          </button>
          {creatureError ? (
            <p className="hint">
              {t("errorPrefix")}
              {creatureError}
            </p>
          ) : creatures.length === 0 ? (
            <p className="hint">{t("emptyCreatures")}</p>
          ) : (
            <>
              <div className="list scroll-list">
                {creatures.map((item) => (
                  <div key={item.id} className="list-item">
                    <div className="list-left">
                      <button
                      className="avatar-button"
                      onClick={() =>
                        setActiveHistoryId((prev) => (prev === item.id ? null : item.id))
                      }
                      title={t("clickAvatarHint")}
                    >
                      <div className="glow-avatar">
                        <CreatureAvatar
                          genomeHex={item.genomeHex ?? "0x"}
                          seedHex={item.id}
                          level={item.level ?? 1}
                          stage={item.stage ?? 0}
                          size={64}
                          label={`${t("levelShort")} ${item.level ?? "-"}`}
                        />
                      </div>
                    </button>
                    <div className="meta">
                      <div className="mono">{item.id}</div>
                      <div className="stat-row">
                        <span>
                          {t("levelShort")} {item.level ?? "-"}
                        </span>
                        <span>
                          {t("expShort")} {item.exp ?? "-"}
                        </span>
                        <span>
                          {t("stageShort")} {item.stage ?? "-"}
                        </span>
                      </div>
                      <div className="history-hint">{t("clickAvatarHint")}</div>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="ghost"
                      onClick={() => setCreatureId(item.id)}
                    >
                      {t("setA")}
                    </button>
                    <button
                      className="ghost"
                      onClick={() => setCreatureIdB(item.id)}
                    >
                      {t("setB")}
                    </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="hint">{t("listHint")}</p>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-glyph glyph-spiral" aria-hidden="true" />
          <h2>{t("mint")}</h2>
          <label>
            {t("genomeHex")}
            <input
              value={genomeHex}
              onChange={(e) => setGenomeHex(e.target.value)}
              placeholder="0x0102"
            />
          </label>
          <button
            onClick={mintCreatureWithFx}
          >
            {t("createCreature")}
          </button>
          <p className="hint">{t("mintHint")}</p>
        </div>

        <div className="card">
          <div className="card-glyph glyph-pulse" aria-hidden="true" />
          <h2>{t("organsSkills")}</h2>
          <div className="row">
            <label>
              {t("kind")}
              <input
                type="number"
                value={kind}
                onChange={(e) => setKind(Number(e.target.value))}
              />
            </label>
            <label>
              {t("rarity")}
              <input
                type="number"
                value={rarity}
                onChange={(e) => setRarity(Number(e.target.value))}
              />
            </label>
            <label>
              {t("power")}
              <input
                type="number"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            onClick={() =>
              exec(() =>
                buildAddOrganTx(packageId, creatureId, kind, rarity, power)
              )
            }
          >
            {t("addOrgan")}
          </button>
          <div className="row">
            <label>
              {t("element")}
              <input
                type="number"
                value={element}
                onChange={(e) => setElement(Number(e.target.value))}
              />
            </label>
            <label>
              {t("skillPower")}
              <input
                type="number"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
              />
            </label>
            <label>
              {t("cooldown")}
              <input
                type="number"
                value={cooldown}
                onChange={(e) => setCooldown(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            onClick={() =>
              exec(() =>
                buildAddSkillTx(packageId, creatureId, element, power, cooldown)
              )
            }
          >
            {t("addSkill")}
          </button>
        </div>

        <div className="card">
          <div className="card-glyph glyph-hex" aria-hidden="true" />
          <h2>{t("growth")}</h2>
          <label>
            {t("foodExp")}
            <input
              type="number"
              value={foodExp}
              onChange={(e) => setFoodExp(Number(e.target.value))}
            />
          </label>
          <button onClick={() => exec(() => buildFeedTx(packageId, creatureId, foodExp))}>
            {t("feed")}
          </button>
          <div className="hint">
            {t("nextExp")}：{" "}
            {nextStageRequiredExp != null ? nextStageRequiredExp : "-"}
          </div>
          <button
            disabled={!canEvolve}
            onClick={() => exec(() => buildEvolveTx(packageId, creatureId))}
          >
            {t("evolve")}
          </button>
          {!canEvolve && creatureId ? (
            <div className="hint">{t("evolveNeed")}</div>
          ) : null}
          <label>
            {t("mutationSeed")}
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
          </label>
          <button onClick={() => exec(() => buildMutateTx(packageId, creatureId, seed))}>
            {t("mutate")}
          </button>
        </div>

        <div className="card">
          <div className="card-glyph glyph-comet" aria-hidden="true" />
          <h2>{t("battle")}</h2>
          <p className="hint">{t("battleHint")}</p>
          {arenaId ? <p className="hint">{t("arenaHint")}</p> : null}
          <div className={`battle-stage ${battleAnimating ? "is-animating" : ""}`}>
            <div className="battle-orb a">
              {selectedCreature ? (
                <div className="glow-avatar">
                  <CreatureAvatar
                    genomeHex={selectedCreature.genomeHex ?? "0x"}
                    seedHex={selectedCreature.id}
                    level={selectedCreature.level ?? 1}
                    stage={selectedCreature.stage ?? 0}
                    size={40}
                  />
                </div>
              ) : null}
            </div>
            <div className="battle-orb b">
              {selectedCreatureB ? (
                <div className="glow-avatar">
                  <CreatureAvatar
                    genomeHex={selectedCreatureB.genomeHex ?? "0x"}
                    seedHex={selectedCreatureB.id}
                    level={selectedCreatureB.level ?? 1}
                    stage={selectedCreatureB.stage ?? 0}
                    size={40}
                  />
                </div>
              ) : null}
            </div>
            <div className="battle-spark" />
          </div>
          <div className="actions">
            <button
              className="ghost"
              disabled={!arenaId || !creatureId}
              onClick={() =>
                exec(async () =>
                  buildDepositArenaTx(
                    packageId,
                    await getArenaSharedRef(),
                    creatureId
                  )
                )
              }
            >
              {t("depositA")}
            </button>
            <button
              className="ghost"
              disabled={!arenaId || !creatureIdB}
              onClick={() =>
                exec(async () =>
                  buildDepositArenaTx(
                    packageId,
                    await getArenaSharedRef(),
                    creatureIdB
                  )
                )
              }
            >
              {t("depositB")}
            </button>
            <button
              className="ghost"
              disabled={!arenaId || !creatureId}
              onClick={() =>
                exec(async () =>
                  buildWithdrawArenaTx(
                    packageId,
                    await getArenaSharedRef(),
                    creatureId
                  )
                )
              }
            >
              {t("withdrawA")}
            </button>
            <button
              className="ghost"
              disabled={!arenaId || !creatureIdB}
              onClick={() =>
                exec(async () =>
                  buildWithdrawArenaTx(
                    packageId,
                    await getArenaSharedRef(),
                    creatureIdB
                  )
                )
              }
            >
              {t("withdrawB")}
            </button>
          </div>
          {showRecallHint && arenaId ? (
            <div className="hint">{t("recallHint")}</div>
          ) : null}
          {arenaId ? (
            <div className="arena-list">
              <div className="label">{t("unclaimedCreatures")}</div>
              <button className="ghost" onClick={loadArenaCreatures}>
                {t("refreshUnclaimed")}
              </button>
              {arenaCreatures.length === 0 ? (
                <p className="hint">{t("noUnclaimed")}</p>
              ) : (
                <div className="list compact">
                  {arenaCreatures.map((item) => {
                    return (
                      <div key={item.id} className="list-item">
                      <div className="list-left">
                        <div className="glow-avatar">
                          <CreatureAvatar
                            genomeHex={item.genomeHex ?? "0x"}
                            seedHex={item.id}
                            level={item.level ?? 1}
                            stage={item.stage ?? 0}
                            size={40}
                          />
                        </div>
                        <div className="meta">
                          <div className="mono">{item.id}</div>
                          <div className="stat-row">
                            <span>
                              {t("levelShort")} {item.level ?? "-"}
                            </span>
                            <span>
                              {t("expShort")} {item.exp ?? "-"}
                            </span>
                            <span>
                              {t("stageShort")} {item.stage ?? "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="actions">
                        <button
                          className="ghost"
                          disabled={!arenaId || !item.key}
                          onClick={() =>
                            exec(async () =>
                              buildWithdrawArenaTx(
                                packageId,
                                await getArenaSharedRef(),
                                item.key ?? item.id
                              )
                            )
                          }
                        >
                          {t("withdraw")}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
          <button disabled={!canBattle} onClick={battleWithHistory}>
            {t("battleStart")}
          </button>
          <p className="hint">{t("battleHistoryHint")}</p>
        </div>

        <div className="card">
          <div className="card-glyph glyph-sig" aria-hidden="true" />
          <h2>{t("snapshot")}</h2>
          <p className="hint">{t("snapshotHint")}</p>
          <button className="ghost" onClick={devInspectSnapshot}>
            {t("getSnapshot")}
          </button>
          <pre className="code">{snapshot || t("noSnapshot")}</pre>
        </div>

        <div className="card full">
          <h2>{t("resultTitle")}</h2>
          <div className="split">
            <div>
              <div className="label">{t("txResult")}</div>
              <pre className="code">
                {result.error
                  ? `${t("errorPrefix")}${result.error}`
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
            <div>
              <div className="label">{t("creatureObject")}</div>
              <pre className="code">{creatureJson || t("noObjectData")}</pre>
            </div>
          </div>
        </div>
      </section>

      {activeHistoryId ? (
        <div className="modal-mask" onClick={() => setActiveHistoryId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="mono">{t("battleHistoryTitle")}</div>
              <button className="ghost" onClick={() => setActiveHistoryId(null)}>
                {t("close")}
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                const creature =
                  creatures.find((c) => c.id === activeHistoryId) ||
                  arenaCreatures.find((c) => c.id === activeHistoryId);
                const history = battleHistory
                  .filter((h) => h.a === activeHistoryId || h.b === activeHistoryId)
                  .slice(0, 20);
                return (
                  <>
                    <motion.div
                      className="history-avatar"
                      initial={{ opacity: 0, scale: 0.4, rotate: 0 }}
                      animate={{ opacity: 1, scale: 1, rotate: 540 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <div className="glow-avatar">
                        <CreatureAvatar
                          genomeHex={creature?.genomeHex ?? "0x"}
                          seedHex={activeHistoryId}
                          level={creature?.level ?? 1}
                          stage={creature?.stage ?? 0}
                          size={120}
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      {history.map((h) => {
                        const role = h.a === activeHistoryId ? "A" : "B";
                        const result: string =
                          h.winner === "?"
                            ? "?"
                            : h.winner === "T"
                            ? t("draw")
                            : h.winner === role
                            ? t("aWin")
                            : t("bWin");
                        const timeLabel = new Date(h.ts).toLocaleString(
                          lang === "zh" ? "zh-CN" : "en-US"
                        );
                        return (
                          <div key={h.id} className="history-row">
                            <span className="badge">{result}</span>
                            <span className="hint">{timeLabel}</span>
                            <span className="mono">{role === "A" ? h.b : h.a}</span>
                            <span className="hint">
                              {t("power")} {role === "A" ? h.powerA ?? "-" : h.powerB ?? "-"} ↔{" "}
                              {role === "A" ? h.powerB ?? "-" : h.powerA ?? "-"}
                            </span>
                            <span className="hint">
                              {t("expShort")} +{role === "A" ? h.expA ?? "-" : h.expB ?? "-"}
                            </span>
                          </div>
                        );
                      })}
                      {history.length === 0 ? <p className="hint">{t("noBattleHistory")}</p> : null}
                    </motion.div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}

      {battleAnimating ? (
        <div className="battle-modal">
          <div className="battle-modal-card">
            <div className="battle-title">{t("battleEngaged")}</div>
            <div className="battle-stage is-animating battle-stage-modal">
              <div className="battle-orb a">
                {selectedCreature ? (
                  <div className="glow-avatar">
                    <CreatureAvatar
                      genomeHex={selectedCreature.genomeHex ?? "0x"}
                      seedHex={selectedCreature.id}
                      level={selectedCreature.level ?? 1}
                      stage={selectedCreature.stage ?? 0}
                      size={56}
                    />
                  </div>
                ) : null}
              </div>
              <div className="battle-orb b">
                {selectedCreatureB ? (
                  <div className="glow-avatar">
                    <CreatureAvatar
                      genomeHex={selectedCreatureB.genomeHex ?? "0x"}
                      seedHex={selectedCreatureB.id}
                      level={selectedCreatureB.level ?? 1}
                      stage={selectedCreatureB.stage ?? 0}
                      size={56}
                    />
                  </div>
                ) : null}
              </div>
              <div className="battle-spark" />
              <div className="battle-rings" />
              <div className="battle-explosion" />
            </div>
            {battleOutcome ? (
              <div className="battle-result">
                {battleOutcome === "T"
                  ? t("draw")
                  : battleOutcome === "A"
                  ? t("aWin")
                  : t("bWin")}
              </div>
            ) : null}
            <div className="hint">{t("battleSettling")}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
