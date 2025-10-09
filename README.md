# LazySwap 🚀

LazySwap is an AI-powered agent and group wallet system that transforms cross-chain DeFi collaboration for crypto communities, alpha groups, and airdrop hunters. Using SideShift’s API, Telegram group coordination, and powerful language models, LazySwap solves the complexity of pooled investments, trustless fund management, and fully flexible asset withdrawal across any supported chain.

---

## 🌟 Upgraded Vision

LazySwap began as a natural-language swap bot, but now it is built to be the **decentralized agent for coordinated crypto pooling, investing, and community DeFi operations** on Telegram. Most web3 investment groups today rely on one or two trusted leaders to move pooled funds — LazySwap replaces that friction with transparent, automated, and AI-orchestrated group wallets.

**Key upgrades and concepts:**

- **AI Agent for Groups:** Not just for individual swaps. Groups and cabals (alpha chats, DAO teams, hackathon squads) can propose, vote, and execute investments together with community-owned funds via Telegram.
- **Flexible Asset Management:** Members can contribute in any asset or chain supported by SideShift, and withdraw profits or funds to any chain/asset of their choice—no manual tracking needed.
- **Idle Capital Utility:** Even when offline, members can park funds securely in the group wallet, trusting the AI agent and voting system to deploy those funds in promising deals.
- **DeFi Crowd Management:** Lazyswap abstracts complex on-chain tasks—internal swaps, vesting schedules, voting, risk-sharing—so the group manages investments, liquidity pooling, and even airdrop farming seamlessly.
- **Direct Telegram Integration:** All proposals, votes, withdrawals, and reporting happen right inside Telegram, where crypto activity thrives.
- **Internal Wallet Segregation:** Members’ investments are tracked with virtual receipts, voting strata, and automated split/vesting for tokens as per the group’s rules.
- **No Single Point of Failure:** No single user manages pooled assets; all moves are AI-coordinated and multi-signature when needed.

---

## 🚀 Features (Expanded)

- Effortless text-based swaps for any supported asset (no browser extensions/apps)
- AI-powered intent parsing, group management, and automated quoting/swapping
- Secure QR code/pay-links for every swap, direct to Telegram
- Community pool control: voting, proposing, and distributing investments
- Flexible withdrawal: Members can receive payouts in ANY chain/asset supported by SideShift
- Idle asset parking & group deals: Park assets during offline periods, trust group automation
- Internal asset management: Automatic conversion to stablecoins, vesting splits, and timeline-based swaps
- Multi-chain support: Ethereum L2, Solana, Bitcoin, and all SideShift compatible networks
- Customizable group rules and mod hierarchy
- Automated reporting, performance tracking, and transparency for all group actions

---

## 🧠 Why LazySwap? (Crypto Group Problem Statement)

Crypto investment groups ("cabals", alpha chats) operate primarily via Telegram, managing pooled capital for investments, airdrops, DeFi rounds, and liquidity opportunities across chains. Today, most funds are handled by 1-2 trusted individuals—creating friction and trust gaps. 

- **Web3 users are multi-chain:** Assets parked across ETH L2, Solana, BTC, stablecoins for airdrop eligibility and DeFi deals.
- **No unified pooling:** Moving funds into group investments is messy. Withdrawals are slow and inflexible.
- **Risk and trust:** If a new opportunity emerges and only a few members are trusted, most lose out. New group members can’t easily participate in group deals.
- **Asset conversion pain:** Crypto groups want instant, trustless conversion of pooled assets, and flexible profit withdrawal.

LazySwap solves this by automating, decentralizing, and abstracting every step with its AI agent, SideShift API, and Telegram-native operations.

---

## 🛠 Technologies Used

- SideShift API: instant cross-chain swaps, pay-link/QR page generation, secure wallet payments
- Telegram Bot + Groups: conversational interface, group investment flows
- LangGraph.js + LLM: AI-driven parsing, group voting, management, context tracking
- Node.js/Express: Backend, webhook integrations, on-chain data feeds
- Secure Webhook: Payment & status notifications
- Broker APIs, RPC drop-ins: Multi-chain compatibility with leading blockchains
- Custom vesting splits, asset parking, and reporting modules

---

## 🔑 Benefits

- Withdraw any way you want: thanks to SideShift, users can withdraw profits or parked assets to any supported chain/asset (ETH, SOL, BTC, USDC, etc.)—no admin bottleneck.
- Partial group withdrawal: Park assets, retrieve anytime, or set group deals if friends/traders need to access or rotate funds.
- Asset vesting and timing: Automatically split received tokens based on group rules (e.g., vesting, unlock periods) and swap timelines to suit DeFi strategies.
- Airdrop hunter optimization: Distribute capital across chains, swap instantly for new airdrop opportunities, manage all group actions from Telegram.
- Community security: Voting, mod/admin layers, and no single point of custody.

---

## 🔽 Quick Start

### Prerequisites

1. SideShift.ai account - get your account ID and Private Key from [SideShift.ai](https://sideshift.ai/account)
2. Telegram Bot Token - create via [@BotFather](https://t.me/botfather)
3. Node.js v16 or higher

### Installation

Clone and install dependencies:
cd lazyswap
npm install

Configure environment variables:
cp .env.example .env

Edit .env with your credentials:
SIDESHIFT_SECRET=your_sideshift_private_key_here
AFFILIATE_ID=your_sideshift_account_id_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
PORT=3000

Build and start the server:
npm run build
npm start

Or for development:
npm run dev

---

## 🌍 How it Works (Expanded)

- **Group formation:** Telegram users create/join groups, link wallets/assets using the LazySwap agent
- **Proposal and voting:** Any member can propose investments, asset swaps, or DeFi strategies. Mods/admins set voting rules.
- **Multi-chain deposit & pooling:** Members fund the group wallet (in any asset/chain). LazySwap converts into chosen stablecoin or optimal asset, prepping for the group action.
- **AI agent execution:** Once approved, agent handles swap, investment, or distribution using SideShift.
- **Transparent tracking:** Virtual receipts, member history, group asset splits, and vesting managed inside Telegram
- **Flexible withdrawal:** At any time, members can withdraw to any asset/chain via SideShift, even if their original contribution was in a different asset.

---

## 🦾 Advanced Use Cases

- Park idle assets when busy or traveling; let group manage funds and deploy in deals
- Automated vesting, distribution, and swap scheduling based on group votes
- Internal asset rebalancing and DeFi yield/risk optimization
- Layered mod/admin access for trusted operations, but with transparent history and no hidden moves
- Crypto group expansion (new pools, airdrop cabals) with group agent as trusted non-human coordinator

---

## 🧬 Future Roadmap

- Custom multi-chain ballot SDKs for advanced group governance
- Integration with leading DeFi platforms for collective staking/yield
- Plug-and-play for Telegram alpha groups and DAOs
- Extended reporting, analytics, reward distribution, and automated compliance for institutional crypto teams

---

## 🌐 Links

Telegram Demo: https://t.me/LazySwap_Bot  
Github: https://github.com/shreyan001/lazyswap-ai

---

LazySwap is the agent, treasury, and automator for the next generation of decentralized crypto communities. Fully flexible, trustless, and cross-chain from day one.
