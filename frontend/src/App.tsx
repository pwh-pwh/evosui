import { useEffect, useMemo, useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
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
    loading: "加载中…",
    loadFailed: "加载失败：",
    myCreatures: "我的 Creature",
    refreshList: "刷新列表",
    errorPrefix: "错误：",
    emptyCreatures: "暂无 Creature，先 Mint 一个。",
    clickAvatarHint: "点击头像查看对战详情",
    setA: "设为A",
    setB: "设为B",
    mint: "Mint",
    genomeHex: "Genome Hex",
    createCreature: "创建 Creature",
    mintHint: "交易完成后在钱包里找到新对象 ID，再填到 Creature ID。",
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
    loading: "Loading…",
    loadFailed: "Load failed: ",
    myCreatures: "My Creatures",
    refreshList: "Refresh List",
    errorPrefix: "Error: ",
    emptyCreatures: "No creatures yet. Mint one first.",
    clickAvatarHint: "Click avatar to view battle details",
    setA: "Set A",
    setB: "Set B",
    mint: "Mint",
    genomeHex: "Genome Hex",
    createCreature: "Create Creature",
    mintHint: "After the tx, find the new object ID in wallet and paste into Creature ID.",
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
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransactionBlock();

  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("evosui.lang");
    return saved === "en" || saved === "zh" ? saved : "zh";
  });
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

  useEffect(() => {
    localStorage.setItem("evosui.lang", lang);
  }, [lang]);

  const t = (key: keyof (typeof I18N)["zh"]) => I18N[lang][key];

  const canTransact = Boolean(account?.address && packageId);
  const selectedCreature = creatures.find((c) => c.id === creatureId);
  const selectedCreatureB = creatures.find((c) => c.id === creatureIdB);
  const nextStageRequiredExp =
    selectedCreature?.stage != null ? (selectedCreature.stage + 1) * 100 : undefined;
  const canEvolve =
    selectedCreature?.exp != null && nextStageRequiredExp != null
      ? selectedCreature.exp >= nextStageRequiredExp
      : false;
  const canBattle =
    Boolean(creatureId && creatureIdB) && creatureId !== creatureIdB;

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
        transactionBlock: tx,
      });
      setResult({ digest: res?.digest, raw: res });
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
    if (!arenaId || !account?.address) {
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
      const creaturesField = fields?.creatures as
        | string
        | { id?: string; id?: { id?: string } }
        | { id?: { id?: string } }
        | undefined;
      const tableId =
        typeof creaturesField === "string"
          ? creaturesField
          : typeof (creaturesField as { id?: string })?.id === "string"
          ? (creaturesField as { id?: string }).id
          : typeof (creaturesField as { id?: { id?: string } })?.id?.id === "string"
          ? (creaturesField as { id?: { id?: string } }).id!.id
          : undefined;
      if (!tableId) {
        setArenaCreatures([]);
        return;
      }
      const fieldsResp = await client.getDynamicFields({ parentId: tableId, limit: 50 });
      const creatureIds = fieldsResp.data
        .map((entry) => {
          const value = (entry.name as { value?: unknown })?.value;
          if (typeof value === "string") return value;
          const idValue = (value as { id?: string })?.id;
          if (typeof idValue === "string") return idValue;
          const direct = (entry.name as { id?: string })?.id;
          if (typeof direct === "string") return direct;
          return null;
        })
        .filter((id): id is string => Boolean(id));
      if (creatureIds.length === 0) {
        setArenaCreatures([]);
        return;
      }
      const creaturesResp = await client.multiGetObjects({
        ids: creatureIds,
        options: { showContent: true },
      });
      const items: ArenaCreatureItem[] = creaturesResp
        .map((obj) => {
          const id = obj.data?.objectId;
          const content = obj.data?.content as
            | { dataType: "moveObject"; fields?: Record<string, unknown> }
            | undefined;
          const fields = content?.dataType === "moveObject" ? content.fields : undefined;
          if (!id || !fields) return null;
          const owner = fields.owner as string | undefined;
          if (!owner || owner !== account.address) return null;
          const level = typeof fields.level === "string" ? Number(fields.level) : undefined;
          const exp = typeof fields.exp === "string" ? Number(fields.exp) : undefined;
          const stage = typeof fields.stage === "string" ? Number(fields.stage) : undefined;
          const genomeHex = extractGenomeHex(fields);
          return { id, level, exp, stage, genomeHex };
        })
        .filter((item): item is ArenaCreatureItem => Boolean(item));
      setArenaCreatures(items);
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
        transactionBlock: tx,
        options: { showEffects: true, showObjectChanges: true },
      });
      setResult({ digest: res?.digest, raw: res });
      const created = res?.objectChanges?.find(
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
      const res = await signAndExecute({ transactionBlock: tx });
      setResult({ digest: res?.digest, raw: res });
      await loadBattleEvents();
    } catch (e) {
      setResult({ error: (e as Error).message });
    } finally {
      setTimeout(() => setBattleAnimating(false), 1200);
    }
  }

  async function loadCreatures() {
    if (!account?.address || !packageId) return;
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
    } catch (e) {
      setCreatureError((e as Error).message);
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

  return (
    <div className="app">
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
          <ConnectButton />
        </div>
      </header>

      <section className="grid-layout">
        <div className="card">
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
            <div className="list compact">
              {arenas.map((arena) => (
                <div key={arena.id} className="list-item">
                  <div className="list-left">
                    <div className="mono">{arena.id}</div>
                  </div>
                  <div className="actions">
                    <button
                      className="ghost"
                      onClick={() => setArenaId(arena.id)}
                    >
                      {t("selectArena")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="ghost" onClick={loadCreature}>
            {t("readCreature")}
          </button>
        </div>

        <div className="card">
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
            <div className="list">
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
                      <CreatureAvatar
                        genomeHex={item.genomeHex ?? "0x"}
                        seedHex={item.id}
                        level={item.level ?? 1}
                        stage={item.stage ?? 0}
                        size={64}
                        label={`${t("levelShort")} ${item.level ?? "-"}`}
                      />
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
          )}
        </div>

        <div className="card">
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
            onClick={() =>
              exec(() => buildMintTx(packageId, genomeHex, account!.address))
            }
          >
            {t("createCreature")}
          </button>
          <p className="hint">{t("mintHint")}</p>
        </div>

        <div className="card">
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
          <h2>{t("battle")}</h2>
          <p className="hint">{t("battleHint")}</p>
          {arenaId ? <p className="hint">{t("arenaHint")}</p> : null}
          <div className={`battle-stage ${battleAnimating ? "is-animating" : ""}`}>
            <div className="battle-orb a">
              {selectedCreature ? (
                <CreatureAvatar
                  genomeHex={selectedCreature.genomeHex ?? "0x"}
                  seedHex={selectedCreature.id}
                  level={selectedCreature.level ?? 1}
                  stage={selectedCreature.stage ?? 0}
                  size={40}
                />
              ) : null}
            </div>
            <div className="battle-orb b">
              {selectedCreatureB ? (
                <CreatureAvatar
                  genomeHex={selectedCreatureB.genomeHex ?? "0x"}
                  seedHex={selectedCreatureB.id}
                  level={selectedCreatureB.level ?? 1}
                  stage={selectedCreatureB.stage ?? 0}
                  size={40}
                />
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
                  {arenaCreatures.map((item) => (
                    <div key={item.id} className="list-item">
                      <div className="list-left">
                        <CreatureAvatar
                          genomeHex={item.genomeHex ?? "0x"}
                          seedHex={item.id}
                          level={item.level ?? 1}
                          stage={item.stage ?? 0}
                          size={40}
                        />
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
                        <button className="ghost" onClick={() => setCreatureId(item.id)}>
                          {t("setA")}
                        </button>
                        <button className="ghost" onClick={() => setCreatureIdB(item.id)}>
                          {t("setB")}
                        </button>
                      </div>
                    </div>
                  ))}
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
              {battleHistory
                .filter((h) => h.a === activeHistoryId || h.b === activeHistoryId)
                .slice(0, 20)
                .map((h) => {
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
              {battleHistory.filter((h) => h.a === activeHistoryId || h.b === activeHistoryId)
                .length === 0 ? <p className="hint">{t("noBattleHistory")}</p> : null}
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
                  <CreatureAvatar
                    genomeHex={selectedCreature.genomeHex ?? "0x"}
                    seedHex={selectedCreature.id}
                    level={selectedCreature.level ?? 1}
                    stage={selectedCreature.stage ?? 0}
                    size={56}
                  />
                ) : null}
              </div>
              <div className="battle-orb b">
                {selectedCreatureB ? (
                  <CreatureAvatar
                    genomeHex={selectedCreatureB.genomeHex ?? "0x"}
                    seedHex={selectedCreatureB.id}
                    level={selectedCreatureB.level ?? 1}
                    stage={selectedCreatureB.stage ?? 0}
                    size={56}
                  />
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
