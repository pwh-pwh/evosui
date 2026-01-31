# EvoSui

基于 Sui 的去中心化生物进化游戏原型。核心特性包括链上基因算法、对象嵌套器官/技能、可组合的战斗与进化，以及前端动态头像渲染与战斗记录展示。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pwh-pwh/evosui&root-directory=frontend)

## 目录结构
- `evosui/`：Sui Move 合约
- `frontend/`：前端游戏 UI（Vite + React + Tailwind + dApp Kit）

## 合约功能概览
- `Creature` 链上生物对象（基因、等级、阶段、器官、技能、统计）
- 基因变异、喂养、进化、繁殖
- 器官/技能动态字段嵌套
- 战力计算与对战
- 链上事件 `BattleEvent`（用于对战历史）

合约入口主要在：
- `evosui/sources/evosui.move`
- `evosui/sources/creature_stats.move`

## 前端功能概览
- 钱包连接与网络切换（默认 testnet）
- 生物列表自动加载（钱包内 Creature）
- 基因头像动态渲染
- 对战动画（含胜负揭示、爆炸粒子）
- 对战历史（来自链上事件）

## 本地开发

### 前端
```
cd frontend
npm install
npm run dev
```
访问：`http://localhost:5173/`

### 合约
```
cd evosui
sui move build
sui move test
```

## 发布记录（Testnet）
当前前端默认 Package ID 已更新为最新 testnet 包：
```
0xe0bf7ca833eea10f2d9f277fa50421fa33b4c0dce4c424a674644602a6c530b3
```
该值定义在：`frontend/src/config.ts`

如需重新发布：
```
cd evosui
sui client publish --gas-budget 100000000
```
发布后请更新 `frontend/src/config.ts` 中的 Package ID。

## 使用说明（最小流程）
1. 连接钱包（建议使用 testnet）
2. Mint Creature（自定义 genome hex）
3. 在“我的 Creature”中选择 A/B
4. 添加器官/技能提升战力
5. 对战查看结果与历史记录

## 注意事项
- `evolve` 需要经验达到阈值：`(stage+1) * 100`
- 对战需要同一钱包同时拥有 A/B 生物
- 链上对战历史依赖 `BattleEvent` 事件（仅新发布包支持）
