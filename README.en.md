# EvoSui

A decentralized creature evolution game prototype on Sui. Core features include on-chain gene logic, nested organs/skills, composable battles & evolution, and a dynamic frontend with avatars and battle history.

![EvoSui banner](assets/evosui-banner.svg)

![Sui](https://img.shields.io/badge/Sui-Move-6fbcf0)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)
![Style](https://img.shields.io/badge/UI-Tailwind-38bdf8)
![Wallet](https://img.shields.io/badge/Wallet-dApp%20Kit-0ea5e9)

**Language / 语言**: [English](README.en.md) | [中文](README.md)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pwh-pwh/evosui&root-directory=frontend)

## Quick Index
- [✨ Highlights](#-highlights)
- [📦 Structure](#-structure)
- [🧩 Features](#-features)
- [🔗 Contract Entry](#-contract-entry)
- [🚀 Quick Start](#-quick-start)
- [🧪 Testnet Publish Info](#-testnet-publish-info)
- [🎮 Minimal Flow](#-minimal-flow)
- [⚔️ Arena Flow](#-arena-flow)
- [📌 Rules](#-rules)
- [❓ FAQ](#-faq)

## ✨ Highlights
- 🧬 On-chain creatures: genes, level, stage, organs, skills are all on-chain
- 🔁 Dynamic genetics: mutation / evolution / breeding gives life-like progression
- ⚡ Atomic battles: winner, EXP, and events in one transaction
- 🏟️ Shared arena: cross-wallet battles via Arena
- 🎨 Live frontend: auto loading, dynamic avatars, battle animation & history
- 🌍 Multi-language: Chinese / English

## 📦 Structure
- 📁 `evosui/`: Sui Move contracts
- 💻 `frontend/`: Frontend UI (Vite + React + Tailwind + dApp Kit)

## 🧩 Features

| Module | Features |
| --- | --- |
| Contract | Creature object, mutation, feeding, evolution, breeding, battle power, BattleEvent, Arena, ArenaCreatedEvent |
| Frontend | Wallet connect, list loading, dynamic avatars, battle animation, on-chain history, arena list & unclaimed list |

## 🔗 Contract Entry
- `evosui/sources/evosui.move`
- `evosui/sources/creature_stats.move`

## 🚀 Quick Start

### 🖥️ Frontend
```bash
cd frontend
npm install
npm run dev
```
Open: `http://localhost:5173/`

Key deps:
- `@mysten/sui` ^2.1.0
- `@mysten/dapp-kit` ^1.0.1

### 🧱 Contract
```bash
cd evosui
sui move build
sui move test
```

## 🧪 Testnet Publish Info
Default Package ID (already in frontend):
```
0xe1f05acadf66d4fa4708f3bcef31fe6ad98596f0900267e1c97853d1608b4dff
```
Location: `frontend/src/config.ts`

Republish:
```bash
cd evosui
sui client publish --gas-budget 300000000
```
Update `frontend/src/config.ts` after publish.

## 🎮 Minimal Flow
1. Connect wallet (testnet)
2. Mint a Creature (custom genome hex)
3. Choose A/B in “My Creatures”
4. Add organs/skills to boost power
5. Battle and view results/history

## ⚔️ Arena Flow
1. Create Arena (Arena ID auto-filled)
2. A/B players deposit their creatures
3. Either side starts a battle
4. Withdraw creatures after settlement

## 📌 Rules
- 📈 Evolution: `exp >= (stage+1) * 100`
- 🤝 Battle: same wallet for direct battle; cross-wallet via Arena
- 🧾 Battle history source: on-chain `BattleEvent`
- 📜 Arena list source: on-chain `ArenaCreatedEvent`

## ❓ FAQ

**Q: Will the avatar change?**  
A: Yes. Genes + level + stage affect shape and color.

**Q: Why is battle history empty?**  
A: Use the latest package with `BattleEvent` and set the correct Package ID in the frontend.
