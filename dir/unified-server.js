"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const cors = __importStar(require("cors"));
const telegraf_1 = require("telegraf");
const filters_1 = require("telegraf/filters");
const sideshift_api_1 = require("./sideshift-api");
const dotenv = __importStar(require("dotenv"));
const nodegraph_1 = __importDefault(require("./nodegraph"));
const messages_1 = require("@langchain/core/messages");
const net = __importStar(require("net"));
// Load environment variables
dotenv.config();
console.log("🔧 UNIFIED SERVER - Loading environment variables");
// Function to check if port is available
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
            server.once('close', () => resolve(true));
            server.close();
        });
        server.on('error', () => resolve(false));
    });
}
// Function to find next available port starting from 3000
async function findAvailablePort(startPort = 3000) {
    let port = startPort;
    while (port < startPort + 100) { // Check up to 100 ports
        if (await isPortAvailable(port)) {
            console.log(`✅ UNIFIED SERVER - Found available port: ${port}`);
            return port;
        }
        console.log(`❌ UNIFIED SERVER - Port ${port} is busy, trying next...`);
        port++;
    }
    throw new Error(`No available ports found starting from ${startPort}`);
}
// Initialize Express app
const app = express.default();
// Initialize SideShift API
console.log("🔑 UNIFIED SERVER - Initializing SideShift API with secret:", process.env.SIDESHIFT_SECRET ? "Present" : "Missing");
const sideShiftAPI = (0, sideshift_api_1.createSideShiftAPI)(process.env.SIDESHIFT_SECRET || '');
// Initialize Telegram Bot with AI capabilities
console.log("🤖 UNIFIED SERVER - Initializing advanced AI Telegram bot with token:", process.env.TELEGRAM_BOT_TOKEN ? "Present" : "Missing");
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
// Middleware
console.log("⚙️ UNIFIED SERVER - Setting up middleware");
app.use(cors.default());
app.use(express.default.json());
app.use(express.default.static('public'));
bot.use((0, telegraf_1.session)());
// Store active swaps (in production, use a database)
const activeSwaps = new Map();
console.log("💾 UNIFIED SERVER - Active swaps storage initialized");
// Initialize session for Telegram bot
bot.use((ctx, next) => {
    console.log("🔧 SESSION_INIT - Initializing session for user:", ctx.from?.username || ctx.from?.id);
    ctx.session ?? (ctx.session = {
        messages: [],
        swapContext: null
    });
    return next();
});
// Advanced AI Telegram Bot Commands
bot.command('start', (ctx) => {
    console.log("🚀 TELEGRAM AI - Start command received from user:", ctx.from?.id);
    ctx.reply('🚀 Welcome to LazySwap AI! \n\n' +
        '🤖 I\'m your intelligent crypto swap assistant powered by advanced AI.\n\n' +
        '✨ What I can do:\n' +
        '• Smart conversational crypto swaps\n' +
        '• Support 200+ cryptocurrencies\n' +
        '• Cross-chain swaps (ETH, BSC, Polygon, etc.)\n' +
        '• Real-time market rates\n' +
        '• Secure transactions via SideShift\n\n' +
        '💬 Just chat with me naturally:\n' +
        '• "I want to swap 0.1 ETH for USDC"\n' +
        '• "Convert 100 USDT to Bitcoin"\n' +
        '• "What\'s the rate for BTC to ETH?"\n\n' +
        '🔄 Use /refresh to clear our conversation\n' +
        '❓ Use /help for more information', telegraf_1.Markup.keyboard([
        ['🔄 Refresh', 'ℹ️ Help']
    ]).resize());
});
bot.command('refresh', async (ctx) => {
    console.log("🔄 TELEGRAM AI - Refresh command received from user:", ctx.from?.id);
    if (ctx.session) {
        ctx.session.messages = [];
        ctx.session.swapContext = null;
    }
    ctx.reply('🔄 Conversation refreshed! \n\n' +
        '✨ I\'m ready to help you with crypto swaps. What would you like to do?', telegraf_1.Markup.keyboard([
        ['🔄 Refresh', 'ℹ️ Help']
    ]).resize());
});
bot.hears("🔄 Refresh", async (ctx) => {
    console.log("🔄 TELEGRAM AI - Refresh button pressed by user:", ctx.from?.id);
    if (ctx.session) {
        ctx.session.messages = [];
        ctx.session.swapContext = null;
    }
    ctx.reply('🔄 Conversation refreshed! Ready for new swaps.');
});
bot.hears("ℹ️ Help", async (ctx) => {
    console.log("❓ TELEGRAM AI - Help button pressed by user:", ctx.from?.id);
    ctx.reply('🤖 LazySwap AI Help\n\n' +
        '💡 Tips for better swaps:\n' +
        '• Be specific about amounts and coins\n' +
        '• I support 200+ cryptocurrencies\n' +
        '• I can handle cross-chain swaps\n' +
        '• Ask me about rates anytime\n\n' +
        '🔧 Commands:\n' +
        '• /start - Welcome message\n' +
        '• /refresh - Clear conversation\n' +
        '• /help - This help message\n\n' +
        '💬 Just chat naturally - I understand context!');
});
// Advanced AI message handling
bot.on((0, filters_1.message)('text'), async (ctx) => {
    const userMessage = ctx.message.text;
    const userId = ctx.from?.id;
    console.log("💬 TELEGRAM AI - Processing message from user:", userId, "Message:", userMessage);
    try {
        // Show typing indicator
        await ctx.sendChatAction('typing');
        // Initialize nodegraph
        const graph = (0, nodegraph_1.default)();
        // Create initial state with user message
        const initialState = {
            messages: [new messages_1.HumanMessage(userMessage)],
            swapValues: {},
            quoteId: null,
            quoteResponse: null,
            depositAddress: null,
            swapId: null
        };
        // Process message through nodegraph AI
        const response = await graph.invoke(initialState);
        // Get the last AI message from the response
        const lastMessage = response.messages?.[response.messages.length - 1];
        const responseText = lastMessage?.content || "I'm sorry, I couldn't process that request. Please try again.";
        // Update session with new messages
        if (ctx.session) {
            ctx.session.messages = response.messages || [];
        }
        // Send AI response
        await ctx.reply(responseText);
        console.log("✅ TELEGRAM AI - Response sent successfully to user:", userId);
    }
    catch (error) {
        console.error("❌ TELEGRAM AI - Error processing message:", error);
        await ctx.reply("🚨 I encountered an error processing your request. Please try again or use /refresh to start over.");
    }
});
// Express API Routes (from original server.ts)
app.get('/api/coins', async (req, res) => {
    console.log("🪙 API - Coins endpoint called");
    try {
        const coins = await sideShiftAPI.getCoins();
        res.json(coins);
    }
    catch (error) {
        console.error("❌ API - Error fetching coins:", error);
        res.status(500).json({ error: 'Failed to fetch coins' });
    }
});
app.post('/api/swap', async (req, res) => {
    console.log("🔄 API - Swap endpoint called with body:", req.body);
    try {
        const swapRequest = req.body;
        const quote = await sideShiftAPI.createVariableSwap(swapRequest);
        // Store the swap for tracking
        activeSwaps.set(quote.id, {
            ...quote,
            createdAt: new Date(),
            status: 'pending'
        });
        console.log("✅ API - Swap created successfully:", quote.id);
        res.json(quote);
    }
    catch (error) {
        console.error("❌ API - Error creating swap:", error);
        res.status(500).json({ error: 'Failed to create swap' });
    }
});
app.post('/api/checkout', async (req, res) => {
    console.log("💳 API - Checkout endpoint called with body:", req.body);
    try {
        const checkoutRequest = req.body;
        const result = await sideShiftAPI.createCheckout(checkoutRequest);
        console.log("✅ API - Checkout created successfully");
        res.json(result);
    }
    catch (error) {
        console.error("❌ API - Error creating checkout:", error);
        res.status(500).json({ error: 'Failed to create checkout' });
    }
});
app.get('/api/permissions', async (req, res) => {
    console.log("🔐 API - Permissions endpoint called");
    try {
        const permissions = await sideShiftAPI.checkPermissions();
        res.json(permissions);
    }
    catch (error) {
        console.error("❌ API - Error fetching permissions:", error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});
app.get('/api/swap/:id', async (req, res) => {
    console.log("🔍 API - Swap status endpoint called for ID:", req.params.id);
    try {
        const swapId = req.params.id;
        const swap = activeSwaps.get(swapId);
        res.json(swap || { error: 'Swap not found' });
    }
    catch (error) {
        console.error("❌ API - Error fetching swap status:", error);
        res.status(500).json({ error: 'Failed to fetch swap status' });
    }
});
app.get('/health', (req, res) => {
    console.log("❤️ API - Health check endpoint called");
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            api: 'running',
            telegram: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'missing_token',
            sideshift: process.env.SIDESHIFT_SECRET ? 'configured' : 'missing_secret'
        }
    });
});
// Webhook for SideShift updates
app.post('/webhook/sideshift', (req, res) => {
    console.log("🔔 WEBHOOK - SideShift webhook received:", req.body);
    const { orderId, status } = req.body;
    if (activeSwaps.has(orderId)) {
        const swap = activeSwaps.get(orderId);
        swap.status = status;
        swap.updatedAt = new Date();
        activeSwaps.set(orderId, swap);
        console.log("✅ WEBHOOK - Swap status updated:", orderId, status);
    }
    res.json({ received: true });
});
// Start unified server
async function startUnifiedServer() {
    try {
        // Find available port
        const port = await findAvailablePort(3000);
        // Start Express server
        const server = app.listen(port, () => {
            console.log(`🚀 UNIFIED SERVER - Express API running on http://localhost:${port}`);
            console.log(`📊 UNIFIED SERVER - Health check: http://localhost:${port}/health`);
            console.log(`🪙 UNIFIED SERVER - Coins API: http://localhost:${port}/api/coins`);
        });
        // Start Telegram bot
        if (process.env.TELEGRAM_BOT_TOKEN) {
            console.log("🤖 UNIFIED SERVER - Starting advanced AI Telegram bot...");
            await bot.launch();
            console.log("✅ UNIFIED SERVER - Advanced AI Telegram bot is running!");
            // Graceful shutdown
            process.once('SIGINT', () => {
                console.log("🛑 UNIFIED SERVER - Received SIGINT, shutting down gracefully...");
                bot.stop('SIGINT');
                server.close();
            });
            process.once('SIGTERM', () => {
                console.log("🛑 UNIFIED SERVER - Received SIGTERM, shutting down gracefully...");
                bot.stop('SIGTERM');
                server.close();
            });
        }
        else {
            console.log("⚠️ UNIFIED SERVER - Telegram bot token not found, running API only");
        }
        console.log("🎉 UNIFIED SERVER - All services started successfully!");
        console.log(`📍 UNIFIED SERVER - Running on port ${port} with advanced AI capabilities`);
    }
    catch (error) {
        console.error("❌ UNIFIED SERVER - Failed to start:", error);
        process.exit(1);
    }
}
// Start the unified server
startUnifiedServer();
exports.default = app;
