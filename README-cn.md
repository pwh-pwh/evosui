# EvoSui

基于 Sui 的去中心化生物进化游戏原型。核心特性包括链上基因算法、对象嵌套器官/技能、可组合的战斗与进化，以及前端动态头像渲染与对战记录展示。

![EvoSui banner](assets/evosui-banner.svg)

![Sui](https://img.shields.io/badge/Sui-Move-6fbcf0)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)
![Style](https://img.shields.io/badge/UI-Tailwind-38bdf8)
![Wallet](https://img.shields.io/badge/Wallet-dApp%20Kit-0ea5e9)

**语言 / Language**: [中文](README-cn.md) | [English](README.md)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pwh-pwh/evosui&root-directory=frontend)

## 快速索引
- [✨ 项目亮点](#-项目亮点)
- [📦 目录结构](#-目录结构)
- [🧩 功能清单](#-功能清单)
- [🔗 合约入口](#-合约入口)
- [🚀 快速开始](#-快速开始)
- [🧪 Testnet 发布信息](#-testnet-发布信息)
- [🎮 使用流程](#-使用流程最小)
- [⚔️ Arena 使用流程](#-使用流程共享对战场-arena)
- [📌 规则提示](#-规则提示)
- [❓ 常见问题](#-常见问题)

## ✨ 项目亮点
- 🧬 链上生物体：基因、等级、阶段、器官、技能全在链上
- 🔁 动态遗传：变异 / 进化 / 繁殖形成“生命感”
- ⚡ 原子化对战：胜负、经验、事件一次交易完成
- 🏟️ 共享对战场：跨钱包对战（Arena）
- 🎨 前端实时：自动加载生物列表、头像动态渲染、对战动画与记录
- 🌍 多语言：中英切换

## 📦 目录结构
- 📁 `evosui/`：Sui Move 合约
- 💻 `frontend/`：前端游戏 UI（Vite + React + Tailwind + dApp Kit）

## 🧩 功能清单

| 模块 | 功能 |
| --- | --- |
| 合约 | Creature 对象、基因变异、喂养、进化、繁殖、战力计算、BattleEvent、Arena 共享对战场、ArenaCreatedEvent |
| 前端 | 钱包连接、列表加载、动态头像、对战动画、链上历史、Arena 列表与未取回列表 |

## 🔗 合约入口
- `evosui/sources/evosui.move`
- `evosui/sources/creature_stats.move`

## 🚀 快速开始

### 🖥️ 前端
```bash
cd frontend
npm install
npm run dev
```
访问：`http://localhost:5173/`

依赖版本（关键）：
- `@mysten/sui` ^2.1.0
- `@mysten/dapp-kit` ^1.0.1

### 🧱 合约
```bash
cd evosui
sui move build
sui move test
```

## 🧪 Testnet 发布信息
当前默认 Package ID（前端已内置）：
```
0xe1f05acadf66d4fa4708f3bcef31fe6ad98596f0900267e1c97853d1608b4dff
```
对应位置：`frontend/src/config.ts`

重新发布：
```bash
cd evosui
sui client publish --gas-budget 300000000
```
发布后更新 `frontend/src/config.ts`。

## 🎮 使用流程（最小）
1. 连接钱包（testnet）
2. Mint Creature（自定义 genome hex）
3. 在“我的 Creature”中选择 A/B
4. 添加器官/技能提升战力
5. 对战查看结果与历史记录

## ⚔️ 使用流程（共享对战场 Arena）
1. 连接钱包并创建 Arena（会自动写入 Arena ID）
2. A/B 双方分别进入 Arena（点击“入场”）
3. 任意一方点击“发起对战”
4. 结束后各自“取回”生物

## 📌 规则提示
- 📈 进化条件：`exp >= (stage+1) * 100`
- 🤝 对战要求：同一钱包可直接对战；跨钱包需使用 Arena
- 🧾 对战历史来源：链上 `BattleEvent`
- 📜 Arena 列表来源：链上 `ArenaCreatedEvent`

## ❓ 常见问题

**Q: 头像是否会变化？**  
A: 会，基因 + 等级 + 阶段都会影响形态与颜色。

**Q: 对战历史为什么为空？**  
A: 需要使用带有 `BattleEvent` 的新发布包，并在前端填写正确 Package ID。
