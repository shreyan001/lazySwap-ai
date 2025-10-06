"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const telegraf_1 = require("telegraf");
const sideshift_api_1 = require("./sideshift-api");
const qrcode_1 = __importDefault(require("qrcode"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
console.log("🔧 SERVER - Loading environment variables");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
console.log("🌐 SERVER - Server port configured:", PORT);
// Initialize SideShift API
console.log("🔑 SERVER - Initializing SideShift API with secret:", process.env.SIDESHIFT_SECRET ? "Present" : "Missing");
const sideShiftAPI = new sideshift_api_1.SideShiftAPI(process.env.SIDESHIFT_SECRET || '', true); // Enable demo mode
// Initialize Telegram Bot
console.log("🤖 SERVER - Initializing Telegram bot with token:", process.env.TELEGRAM_BOT_TOKEN ? "Present" : "Missing");
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
// Middleware
console.log("⚙️ SERVER - Setting up middleware");
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Store active swaps (in production, use a database)
const activeSwaps = new Map();
console.log("💾 SERVER - Active swaps storage initialized");
// Telegram Bot Commands
bot.start((ctx) => {
    console.log("🚀 TELEGRAM - Start command received from user:", ctx.from?.id);
    ctx.reply('🚀 Welcome to LazySwap! \n\n' +
        'I can help you swap crypto across chains with simple text commands.\n\n' +
        'Examples:\n' +
        '• "Swap 0.1 ETH to USDC"\n' +
        '• "Exchange 100 USDT for BTC"\n' +
        '• "Convert 1 BTC to ETH"\n\n' +
        'Just tell me what you want to swap!');
});
bot.help((ctx) => {
    console.log("❓ TELEGRAM - Help command received from user:", ctx.from?.id);
    ctx.reply('🔄 LazySwap Commands:\n\n' +
        '• Just type your swap request in natural language\n' +
        '• Example: "Swap 0.5 ETH to USDC"\n' +
        '• I\'ll handle the rest and provide you with payment details\n\n' +
        '💡 Features:\n' +
        '• Cross-chain swaps\n' +
        '• Instant quotes\n' +
        '• QR code payments\n' +
        '• Real-time notifications');
});
// Natural language processing for swap requests (simplified)
function parseSwapRequest(text) {
    console.log("🔍 PARSER - Parsing swap request:", text);
    const swapPatterns = [
        /swap\s+(\d+\.?\d*)\s+(\w+)\s+to\s+(\w+)/i,
        /exchange\s+(\d+\.?\d*)\s+(\w+)\s+for\s+(\w+)/i,
        /convert\s+(\d+\.?\d*)\s+(\w+)\s+to\s+(\w+)/i,
    ];
    for (const pattern of swapPatterns) {
        const match = text.match(pattern);
        if (match) {
            const result = {
                amount: match[1],
                fromCoin: match[2].toUpperCase(),
                toCoin: match[3].toUpperCase(),
            };
            console.log("✅ PARSER - Successfully parsed swap request:", result);
            return result;
        }
    }
    console.log("❌ PARSER - Failed to parse swap request");
    return null;
}
// Handle text messages for swap requests
bot.on('text', async (ctx) => {
    const text = ctx.message?.text || '';
    const userId = ctx.from?.id.toString() || '';
    console.log("💬 TELEGRAM - Text message received from user:", userId, "Message:", text);
    const swapRequest = parseSwapRequest(text);
    if (!swapRequest) {
        console.log("❌ TELEGRAM - Invalid swap request format");
        ctx.reply('🤔 I didn\'t understand that swap request.\n\n' +
            'Try something like:\n' +
            '• "Swap 0.1 ETH to USDC"\n' +
            '• "Exchange 100 USDT for BTC"');
        return;
    }
    try {
        console.log("🔄 TELEGRAM - Processing swap request for user:", userId);
        ctx.reply('🔍 Processing your swap request...');
        // Get available coins to validate
        console.log("💰 TELEGRAM - Fetching available coins for validation");
        const coins = await sideShiftAPI.getCoins();
        const fromCoinExists = coins.some(coin => coin.coin === swapRequest.fromCoin);
        const toCoinExists = coins.some(coin => coin.coin === swapRequest.toCoin);
        console.log("🔍 TELEGRAM - Coin validation:", {
            fromCoin: swapRequest.fromCoin,
            fromCoinExists,
            toCoin: swapRequest.toCoin,
            toCoinExists
        });
        if (!fromCoinExists || !toCoinExists) {
            console.log("❌ TELEGRAM - Unsupported coin pair");
            ctx.reply(`❌ Sorry, I don't support swapping ${swapRequest.fromCoin} to ${swapRequest.toCoin}.\n\n` +
                'Please check the supported coins and try again.');
            return;
        }
        // For now, we'll ask for the settle address
        // In a full implementation, this would be handled through a conversation flow
        console.log("✅ TELEGRAM - Valid swap request, asking for address");
        ctx.reply(`✅ Great! I can help you swap ${swapRequest.amount} ${swapRequest.fromCoin} to ${swapRequest.toCoin}.\n\n` +
            `Please provide your ${swapRequest.toCoin} wallet address where you want to receive the tokens.`);
        // Store the pending swap request
        console.log("💾 TELEGRAM - Storing pending swap request for user:", userId);
        activeSwaps.set(userId, {
            ...swapRequest,
            step: 'waiting_for_address',
            chatId: ctx.chat?.id,
        });
    }
    catch (error) {
        console.error('❌ TELEGRAM - Error processing swap request:', error);
        ctx.reply('❌ Sorry, there was an error processing your request. Please try again.');
    }
});
// API Routes
// Get available coins
app.get('/api/coins', async (req, res) => {
    console.log("📡 API - GET /api/coins request received");
    try {
        const coins = await sideShiftAPI.getCoins();
        console.log("✅ API - Coins fetched successfully, count:", coins.length);
        res.json(coins);
    }
    catch (error) {
        console.error('❌ API - Error fetching coins:', error);
        res.status(500).json({ error: 'Failed to fetch coins' });
    }
});
// Create a swap
app.post('/api/swap', async (req, res) => {
    console.log("📡 API - POST /api/swap request received:", req.body);
    try {
        const { fromCoin, toCoin, amount, toAddress } = req.body;
        // Get user IP from various sources, fallback to a public IP for testing
        let userIP = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '8.8.8.8'; // Fallback to a public IP for testing
        // Clean up the IP (remove port if present, handle IPv6 mapped IPv4)
        if (userIP.includes(',')) {
            userIP = userIP.split(',')[0].trim();
        }
        if (userIP.startsWith('::ffff:')) {
            userIP = userIP.substring(7);
        }
        if (userIP === '127.0.0.1' || userIP === '::1') {
            userIP = '8.8.8.8'; // Use a public IP for local testing
        }
        console.log("🌐 API - User IP for swap:", userIP);
        // Map the request to SideShift API format
        const swapData = {
            depositCoin: fromCoin,
            settleCoin: toCoin,
            settleAddress: toAddress,
            affiliateId: process.env.AFFILIATE_ID || ''
        };
        console.log("🔄 API - Mapped swap data:", swapData);
        const swap = await sideShiftAPI.createVariableSwap(swapData, userIP);
        console.log("✅ API - Variable swap created:", swap.id);
        // Generate QR code for the deposit address
        console.log("📱 API - Generating QR code for deposit address");
        const qrCodeDataURL = await qrcode_1.default.toDataURL(swap.depositAddress);
        const response = {
            ...swap,
            qrCode: qrCodeDataURL,
            paymentUrl: `/payment/${swap.id}`,
        };
        console.log("✅ API - Swap response prepared with QR code and payment URL");
        res.json(response);
    }
    catch (error) {
        console.error('❌ API - Error creating swap:', error);
        res.status(400).json({ error: error.message });
    }
});
// Create a checkout
app.post('/api/checkout', async (req, res) => {
    console.log("📡 API - POST /api/checkout request received:", req.body);
    try {
        const checkoutData = req.body;
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
        console.log("🌐 API - User IP for checkout:", userIP);
        const checkout = await sideShiftAPI.createCheckout(checkoutData, userIP);
        const paymentUrl = sideShiftAPI.generatePaymentURL(checkout.id);
        console.log("✅ API - Checkout created with payment URL:", paymentUrl);
        res.json({
            ...checkout,
            paymentUrl,
        });
    }
    catch (error) {
        console.error('❌ API - Error creating checkout:', error);
        res.status(400).json({ error: error.message });
    }
});
// Check permissions
app.get('/api/permissions', async (req, res) => {
    console.log("📡 API - GET /api/permissions request received");
    try {
        // Extract user IP
        const userIP = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '8.8.8.8'; // Fallback for testing
        console.log("🌐 API - User IP for permissions check:", userIP);
        const permissions = await sideShiftAPI.checkPermissions(userIP);
        console.log("✅ API - Permissions checked:", permissions);
        res.json(permissions);
    }
    catch (error) {
        console.error('❌ API - Error checking permissions:', error);
        res.status(400).json({ error: error.message });
    }
});
// Get swap status
app.get('/api/swap/:id', async (req, res) => {
    const swapId = req.params.id;
    console.log("📡 API - GET /api/swap/:id request received for swap:", swapId);
    try {
        const swap = await sideShiftAPI.getSwapStatus(swapId);
        console.log("✅ API - Swap status fetched:", swap.status);
        res.json(swap);
    }
    catch (error) {
        console.error('❌ API - Error fetching swap status:', error);
        res.status(404).json({ error: error.message });
    }
});
// Payment page route
app.get('/payment/:swapId', async (req, res) => {
    const swapId = req.params.swapId;
    console.log("📡 WEB - GET /payment/:swapId request received for swap:", swapId);
    try {
        const swap = await sideShiftAPI.getSwapStatus(swapId);
        console.log("✅ WEB - Swap details fetched for payment page");
        // Generate QR code
        console.log("📱 WEB - Generating QR code for payment page");
        const qrCodeDataURL = await qrcode_1.default.toDataURL(swap.depositAddress);
        // Serve a simple HTML page with payment details
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LazySwap Payment - ${swap.id}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { text-align: center; }
        .qr-code { margin: 20px 0; }
        .address { background: #f5f5f5; padding: 15px; border-radius: 8px; word-break: break-all; margin: 20px 0; }
        .details { text-align: left; background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .copy-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
        .copy-btn:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 LazySwap Payment</h1>
        <h2>Send ${swap.depositCoin} to receive ${swap.settleCoin}</h2>
        
        <div class="qr-code">
          <img src="${qrCodeDataURL}" alt="Payment QR Code" style="max-width: 300px;">
        </div>
        
        <div class="address">
          <strong>Payment Address:</strong><br>
          <span id="address">${swap.depositAddress}</span>
          <br><br>
          <button class="copy-btn" onclick="copyAddress()">Copy Address</button>
        </div>
        
        <div class="details">
          <h3>Swap Details:</h3>
          <p><strong>Swap ID:</strong> ${swap.id}</p>
          <p><strong>From:</strong> ${swap.depositCoin} (${swap.depositNetwork})</p>
          <p><strong>To:</strong> ${swap.settleCoin} (${swap.settleNetwork})</p>
          <p><strong>Min Amount:</strong> ${swap.depositMin}</p>
          <p><strong>Max Amount:</strong> ${swap.depositMax}</p>
          <p><strong>Status:</strong> ${swap.status}</p>
          <p><strong>Expires:</strong> ${new Date(swap.expiresAt).toLocaleString()}</p>
        </div>
        
        <p><em>Send the exact amount to the address above. Your ${swap.settleCoin} will be sent to: ${swap.settleAddress}</em></p>
      </div>
      
      <script>
        function copyAddress() {
          const address = document.getElementById('address').textContent;
          navigator.clipboard.writeText(address).then(() => {
            alert('Address copied to clipboard!');
          });
        }
        
        // Auto-refresh status every 30 seconds
        setInterval(() => {
          fetch('/api/swap/${swap.id}')
            .then(response => response.json())
            .then(data => {
              if (data.status !== '${swap.status}') {
                location.reload();
              }
            });
        }, 30000);
      </script>
    </body>
    </html>
    `;
        console.log("✅ WEB - Payment page HTML generated and sent");
        res.send(html);
    }
    catch (error) {
        console.error('❌ WEB - Error loading payment page:', error);
        res.status(404).send('Swap not found');
    }
});
// Webhook endpoint for SideShift notifications
app.post('/webhook/sideshift', (req, res) => {
    console.log("🪝 WEBHOOK - SideShift webhook received");
    console.log("📦 WEBHOOK - Payload:", JSON.stringify(req.body, null, 2));
    try {
        const payload = req.body;
        // Process the webhook payload
        // In a full implementation, you would:
        // 1. Validate the webhook signature
        // 2. Update the swap status in your database
        // 3. Notify users via Telegram
        console.log("✅ WEBHOOK - Webhook processed successfully");
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('❌ WEBHOOK - Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    console.log("🏥 HEALTH - Health check requested");
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Function to start server with port fallback
function startServer(port, fallbackPorts = [4000, 5000, 6000, 7000]) {
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 SERVER - LazySwap server running on port ${port}`);
        console.log(`📱 SERVER - Telegram bot: ${process.env.TELEGRAM_BOT_TOKEN ? 'Connected' : 'Not configured'}`);
        console.log(`🔑 SERVER - SideShift API: ${process.env.SIDESHIFT_SECRET ? 'Configured' : 'Not configured'}`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ SERVER - Port ${port} is already in use`);
            if (fallbackPorts.length > 0) {
                const nextPort = fallbackPorts.shift();
                console.log(`🔄 SERVER - Trying port ${nextPort}...`);
                startServer(nextPort, fallbackPorts);
            }
            else {
                console.error('❌ SERVER - All fallback ports are in use. Please free up a port or specify a different one.');
                process.exit(1);
            }
        }
        else {
            console.error('❌ SERVER - Failed to start server:', err);
            process.exit(1);
        }
    });
    return server;
}
// Start the server with fallback ports
startServer(Number(PORT));
// Start the Telegram bot
if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log("🤖 SERVER - Starting Telegram bot...");
    bot.launch();
    console.log('✅ SERVER - Telegram bot started successfully');
    // Enable graceful stop
    process.once('SIGINT', () => {
        console.log("🛑 SERVER - Received SIGINT, stopping bot...");
        bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
        console.log("🛑 SERVER - Received SIGTERM, stopping bot...");
        bot.stop('SIGTERM');
    });
}
else {
    console.log('⚠️ SERVER - Telegram bot token not provided, bot will not start');
}
exports.default = app;
