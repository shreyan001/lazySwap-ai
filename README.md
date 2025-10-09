
# LazySwap 🚀

LazySwap lets anyone swap crypto assets across chains by sending a simple text message in Telegram groups or DMs. Powered by AI, it understands everyday swap requests (e.g., "Swap 0.1 ETH to USDC"), gives instant quotes via SideShift API, and provides wallet addresses with a secure QR page for payment.

## Features ✨

- **Effortless swaps**: Just message your swap request in a Telegram group or DM—no app installs or browser extensions
- **AI-powered**: Chat in plain English, bot interprets intent, clarifies questions, and automates quoting/swapping
- **QR code payment**: Every swap comes with a secure QR page and wallet to pay; swapped tokens sent to your address
- **Group support**: Swap management and notifications in community chats (private/public)—ideal for DAOs, hackathons, and social groups
- **No custody, instant settlement**: Users control recipient wallets, and SideShift API handles asset delivery

## Technologies Used 🛠️

- **SideShift API**: Instant price quotes, pay-link/QR page generation, secure wallet payments
- **Telegram Bot + Groups**: Conversational interface, visible swap flows for communities
- **LangGraph.js + LLM**: AI-driven parsing for natural language swaps and group context
- **Node.js/Express**: Backend API and webhook integrations
- **Secure Webhook Flows**: Payment status notifications

## Quick Start 🚀

### Prerequisites

1. **SideShift.ai Account**: Get your Account ID and Private Key from [SideShift.ai](https://sideshift.ai/account)
2. **Telegram Bot Token**: Create a bot via [@BotFather](https://t.me/botfather)
3. **Node.js**: Version 16 or higher

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd lazyswap
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   SIDESHIFT_SECRET=your_sideshift_private_key_here
   AFFILIATE_ID=your_sideshift_account_id_here
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   PORT=3000
   ```

3. **Build and start the server**:
   ```bash
   npm run build
   npm start
   ```

   Or for development:
   ```bash
   npm run dev
   ```

## Vision

LazySwap revolutionizes cross-chain cryptocurrency swaps by combining artificial intelligence with SideShift's powerful API. Our vision is to make complex blockchain operations as simple as sending a text message, accessible to users of all experience levels.

## How It Works

1. **Conversational Interface**: Users interact with LazySwap through natural language on Telegram.
2. **AI-Driven Understanding**: Advanced language models interpret user requests and guide the conversation.
3. **SideShift Integration**: Real-time quotes and secure, non-custodial swaps are facilitated using the SideShift API.
4. **Step-by-Step Guidance**: LazySwap provides clear instructions throughout the entire swap process.

## Technology Stack

- **LangGraph.js**: Manages AI-driven interactions and ensures context-aware communication.
- **SideShift API**: Enables native cross-chain swaps with low slippage across a wide range of tokens and networks.
- **Telegraf.js**: Powers the Telegram bot interface for seamless user interactions.
- **Broker APIs' RPC Drop-Ins**: Ensures efficient connectivity with various blockchain networks.
- **ChatGroq LLM**: Processes natural language inputs and generates appropriate responses.

## Links

- [Try LazySwap](https://t.me/LazySwap_Bot)
- [GitHub Repository](https://github.com/shreyan001/lazyswap)


LazySwap represents the future of cross-chain interactions, bridging the gap between complex blockchain operations and user-friendly experiences. By leveraging AI and SideShift's API, we're not just participating in the Cross Chain Hack; we're paving the way for more accessible blockchain interactions.
