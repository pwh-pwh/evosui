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
  buildBattleTx,
  buildEvolveTx,
  buildFeedTx,
  buildMintTx,
  buildMutateTx,
  buildSnapshotTx,
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

  const [packageId, setPackageId] = useState(DEFAULT_PACKAGE_ID);
  const [genomeHex, setGenomeHex] = useState("0x010203");
  const [creatureId, setCreatureId] = useState("");
  const [creatureIdB, setCreatureIdB] = useState("");
  const [creatures, setCreatures] = useState<CreatureItem[]>([]);
  const [creatureError, setCreatureError] = useState("");
  const [battleHistory, setBattleHistory] = useState<BattleRecord[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [battleAnimating, setBattleAnimating] = useState(false);
  const [battleOutcome, setBattleOutcome] = useState<"A" | "B" | "T" | null>(null);
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

  const canTransact = Boolean(account?.address && packageId);
  const selectedCreature = creatures.find((c) => c.id === creatureId);
  const selectedCreatureB = creatures.find((c) => c.id === creatureIdB);
  const nextStageRequiredExp =
    selectedCreature?.stage != null ? (selectedCreature.stage + 1) * 100 : undefined;
  const canEvolve =
    selectedCreature?.exp != null && nextStageRequiredExp != null
      ? selectedCreature.exp >= nextStageRequiredExp
      : false;

  const headerStatus = useMemo(() => {
    if (!account?.address) return "Disconnected";
    return `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
  }, [account?.address]);

  async function exec(txBuilder: () => any) {
    if (!canTransact) {
      setResult({ error: "Connect wallet and set Package ID first." });
      return;
    }
    try {
      const tx = txBuilder();
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

  async function getBattlePower(id: string): Promise<number | undefined> {
    if (!account?.address || !packageId || !id) return undefined;
    try {
      const tx = buildBattlePowerTx(packageId, id);
      const resp = await client.devInspectTransactionBlock({
        sender: account.address,
        transactionBlock: tx,
      });
      return parseU64(resp);
    } catch {
      return undefined;
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
        if (match) setBattleOutcome(match.winner);
      }
    } catch {
      setBattleHistory([]);
    }
  }

  async function battleWithHistory() {
    if (!canTransact || !creatureId || !creatureIdB) {
      setResult({ error: "请先选择 A/B Creature。" });
      return;
    }
    setBattleAnimating(true);
    setBattleOutcome(null);
    try {
      const tx = buildBattleTx(packageId, creatureId, creatureIdB);
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
  }, [account?.address, packageId]);

  return (
    <div className="app">
      <header className="hero">
        <div>
          <div className="tag">EvoSui · On-chain Evolution</div>
          <h1>生物进化的链上实验室</h1>
          <p>
            用可编程交易块驱动生命体的成长、变异与对战。输入 Package ID
            与对象 ID 即可直接对接合约。
          </p>
        </div>
        <div className="wallet">
          <div className="status">{headerStatus}</div>
          <ConnectButton />
        </div>
      </header>

      <section className="grid-layout">
        <div className="card">
          <h2>配置</h2>
          <label>
            Package ID
            <input
              value={packageId}
              onChange={(e) => setPackageId(e.target.value.trim())}
              placeholder="0x..."
            />
          </label>
          <label>
            Creature ID
            <input
              value={creatureId}
              onChange={(e) => setCreatureId(e.target.value.trim())}
              placeholder="0x..."
            />
          </label>
          <label>
            Creature B ID
            <input
              value={creatureIdB}
              onChange={(e) => setCreatureIdB(e.target.value.trim())}
              placeholder="0x..."
            />
          </label>
          <button className="ghost" onClick={loadCreature}>
            读取 Creature 对象
          </button>
        </div>

        <div className="card">
          <h2>我的 Creature</h2>
          <button className="ghost" onClick={loadCreatures}>
            刷新列表
          </button>
          {creatureError ? (
            <p className="hint">错误：{creatureError}</p>
          ) : creatures.length === 0 ? (
            <p className="hint">暂无 Creature，先 Mint 一个。</p>
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
                      title="点击查看对战详情"
                    >
                      <CreatureAvatar
                        genomeHex={item.genomeHex ?? "0x"}
                        seedHex={item.id}
                        level={item.level ?? 1}
                        stage={item.stage ?? 0}
                        size={64}
                        label={`Lv ${item.level ?? "-"}`}
                      />
                    </button>
                    <div className="meta">
                      <div className="mono">{item.id}</div>
                      <div className="stat-row">
                        <span>Lv {item.level ?? "-"}</span>
                        <span>EXP {item.exp ?? "-"}</span>
                        <span>Stage {item.stage ?? "-"}</span>
                      </div>
                      <div className="history-hint">点击头像查看对战详情</div>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="ghost"
                      onClick={() => setCreatureId(item.id)}
                    >
                      设为A
                    </button>
                    <button
                      className="ghost"
                      onClick={() => setCreatureIdB(item.id)}
                    >
                      设为B
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Mint</h2>
          <label>
            Genome Hex
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
            创建 Creature
          </button>
          <p className="hint">
            交易完成后在钱包里找到新对象 ID，再填到 Creature ID。
          </p>
        </div>

        <div className="card">
          <h2>器官 / 技能</h2>
          <div className="row">
            <label>
              Kind
              <input
                type="number"
                value={kind}
                onChange={(e) => setKind(Number(e.target.value))}
              />
            </label>
            <label>
              Rarity
              <input
                type="number"
                value={rarity}
                onChange={(e) => setRarity(Number(e.target.value))}
              />
            </label>
            <label>
              Power
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
            添加器官
          </button>
          <div className="row">
            <label>
              Element
              <input
                type="number"
                value={element}
                onChange={(e) => setElement(Number(e.target.value))}
              />
            </label>
            <label>
              Skill Power
              <input
                type="number"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
              />
            </label>
            <label>
              Cooldown
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
            添加技能
          </button>
        </div>

        <div className="card">
          <h2>成长</h2>
          <label>
            Food EXP
            <input
              type="number"
              value={foodExp}
              onChange={(e) => setFoodExp(Number(e.target.value))}
            />
          </label>
          <button onClick={() => exec(() => buildFeedTx(packageId, creatureId, foodExp))}>
            喂养
          </button>
          <div className="hint">
            下一阶段所需经验：{" "}
            {nextStageRequiredExp != null ? nextStageRequiredExp : "-"}
          </div>
          <button
            disabled={!canEvolve}
            onClick={() => exec(() => buildEvolveTx(packageId, creatureId))}
          >
            进化
          </button>
          {!canEvolve && creatureId ? (
            <div className="hint">经验不足，先喂养提升 EXP。</div>
          ) : null}
          <label>
            Mutation Seed
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
          </label>
          <button onClick={() => exec(() => buildMutateTx(packageId, creatureId, seed))}>
            变异
          </button>
        </div>

        <div className="card">
          <h2>对战</h2>
          <p className="hint">同一钱包拥有两只 Creature 才可对战。</p>
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
          <button onClick={battleWithHistory}>发起对战</button>
          <p className="hint">对战记录来自链上事件（需合约已升级）。</p>
        </div>

        <div className="card">
          <h2>只读快照</h2>
          <p className="hint">使用 devInspect 读取 snapshot 返回值。</p>
          <button className="ghost" onClick={devInspectSnapshot}>
            获取 Snapshot
          </button>
          <pre className="code">{snapshot || "暂无快照"}</pre>
        </div>

        <div className="card full">
          <h2>执行结果 / 对象数据</h2>
          <div className="split">
            <div>
              <div className="label">交易结果</div>
              <pre className="code">
                {result.error
                  ? `Error: ${result.error}`
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
            <div>
              <div className="label">Creature 对象</div>
              <pre className="code">{creatureJson || "暂无对象数据"}</pre>
            </div>
          </div>
        </div>
      </section>

      {activeHistoryId ? (
        <div className="modal-mask" onClick={() => setActiveHistoryId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="mono">对战历史</div>
              <button className="ghost" onClick={() => setActiveHistoryId(null)}>
                关闭
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
                      ? "平局"
                      : h.winner === role
                      ? "胜"
                      : "负";
                  const timeLabel = new Date(h.ts).toLocaleString();
                  return (
                    <div key={h.id} className="history-row">
                      <span className="badge">{result}</span>
                      <span className="hint">{timeLabel}</span>
                      <span className="mono">{role === "A" ? h.b : h.a}</span>
                      <span className="hint">
                        P {role === "A" ? h.powerA ?? "-" : h.powerB ?? "-"} ↔{" "}
                        {role === "A" ? h.powerB ?? "-" : h.powerA ?? "-"}
                      </span>
                      <span className="hint">
                        EXP +{role === "A" ? h.expA ?? "-" : h.expB ?? "-"}
                      </span>
                    </div>
                  );
                })}
              {battleHistory.filter((h) => h.a === activeHistoryId || h.b === activeHistoryId)
                .length === 0 ? <p className="hint">暂无对战记录</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {battleAnimating ? (
        <div className="battle-modal">
          <div className="battle-modal-card">
            <div className="battle-title">Battle Engaged</div>
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
                  ? "平局"
                  : battleOutcome === "A"
                  ? "A 胜"
                  : "B 胜"}
              </div>
            ) : null}
            <div className="hint">链上对战结算中…</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
