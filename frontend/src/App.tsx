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
};

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
          return { id, level, exp, stage };
        })
        .filter((item): item is CreatureItem => Boolean(item));
      setCreatures(items);
    } catch (e) {
      setCreatureError((e as Error).message);
    }
  }

  useEffect(() => {
    loadCreatures();
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

      <section className="grid">
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
                  <div>
                    <div className="mono">{item.id}</div>
                    <div className="hint">
                      Lv {item.level ?? "-"} · EXP {item.exp ?? "-"} · Stage{" "}
                      {item.stage ?? "-"}
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
          <button onClick={() => exec(() => buildEvolveTx(packageId, creatureId))}>
            进化
          </button>
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
          <button
            onClick={() => exec(() => buildBattleTx(packageId, creatureId, creatureIdB))}
          >
            发起对战
          </button>
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
    </div>
  );
}
