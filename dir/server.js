"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Initialize SideShift API
const sideShiftAPI = new sideshift_api_1.SideShiftAPI(process.env.SIDESHIFT_SECRET || '');
// Initialize Telegram Bot
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Store active swaps (in production, use a database)
const activeSwaps = new Map();
// Telegram Bot Commands
bot.start((ctx) => {
    ctx.reply('🚀 Welcome to LazySwap! \n\n' +
        'I can help you swap crypto across chains with simple text commands.\n\n' +
        'Examples:\n' +
        '• "Swap 0.1 ETH to USDC"\n' +
        '• "Exchange 100 USDT for BTC"\n' +
        '• "Convert 1 BTC to ETH"\n\n' +
        'Just tell me what you want to swap!');
});
bot.help((ctx) => {
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
    const swapPatterns = [
        /swap\s+(\d+\.?\d*)\s+(\w+)\s+to\s+(\w+)/i,
        /exchange\s+(\d+\.?\d*)\s+(\w+)\s+for\s+(\w+)/i,
        /convert\s+(\d+\.?\d*)\s+(\w+)\s+to\s+(\w+)/i,
    ];
    for (const pattern of swapPatterns) {
        const match = text.match(pattern);
        if (match) {
            return {
                amount: match[1],
                fromCoin: match[2].toUpperCase(),
                toCoin: match[3].toUpperCase(),
            };
        }
    }
    return null;
}
// Handle text messages for swap requests
bot.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const text = ((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) || '';
    const swapRequest = parseSwapRequest(text);
    if (!swapRequest) {
        ctx.reply('🤔 I didn\'t understand that swap request.\n\n' +
            'Try something like:\n' +
            '• "Swap 0.1 ETH to USDC"\n' +
            '• "Exchange 100 USDT for BTC"');
        return;
    }
    try {
        ctx.reply('🔍 Processing your swap request...');
        // Get available coins to validate
        const coins = yield sideShiftAPI.getCoins();
        const fromCoinExists = coins.some(coin => coin.coin === swapRequest.fromCoin);
        const toCoinExists = coins.some(coin => coin.coin === swapRequest.toCoin);
        if (!fromCoinExists || !toCoinExists) {
            ctx.reply(`❌ Sorry, I don't support swapping ${swapRequest.fromCoin} to ${swapRequest.toCoin}.\n\n` +
                'Please check the supported coins and try again.');
            return;
        }
        // For now, we'll ask for the settle address
        // In a full implementation, this would be handled through a conversation flow
        ctx.reply(`✅ Great! I can help you swap ${swapRequest.amount} ${swapRequest.fromCoin} to ${swapRequest.toCoin}.\n\n` +
            `Please provide your ${swapRequest.toCoin} wallet address where you want to receive the tokens.`);
        // Store the pending swap request
        const userId = ((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id.toString()) || '';
        activeSwaps.set(userId, Object.assign(Object.assign({}, swapRequest), { step: 'waiting_for_address', chatId: (_c = ctx.chat) === null || _c === void 0 ? void 0 : _c.id }));
    }
    catch (error) {
        console.error('Error processing swap request:', error);
        ctx.reply('❌ Sorry, there was an error processing your request. Please try again.');
    }
}));
// API Routes
// Get available coins
app.get('/api/coins', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const coins = yield sideShiftAPI.getCoins();
        res.json(coins);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch coins' });
    }
}));
// Create a swap
app.post('/api/swap', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const swapData = req.body;
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
        const swap = yield sideShiftAPI.createVariableSwap(swapData, userIP);
        // Generate QR code for the deposit address
        const qrCodeDataURL = yield qrcode_1.default.toDataURL(swap.depositAddress);
        res.json(Object.assign(Object.assign({}, swap), { qrCode: qrCodeDataURL, paymentUrl: `/payment/${swap.id}` }));
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Create a checkout
app.post('/api/checkout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const checkoutData = req.body;
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
        const checkout = yield sideShiftAPI.createCheckout(checkoutData, userIP);
        const paymentUrl = sideShiftAPI.generatePaymentURL(checkout.id);
        res.json(Object.assign(Object.assign({}, checkout), { paymentUrl }));
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get swap status
app.get('/api/swap/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const swapId = req.params.id;
        const swap = yield sideShiftAPI.getSwapStatus(swapId);
        res.json(swap);
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
}));
// Payment page route
app.get('/payment/:swapId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const swapId = req.params.swapId;
        const swap = yield sideShiftAPI.getSwapStatus(swapId);
        // Generate QR code
        const qrCodeDataURL = yield qrcode_1.default.toDataURL(swap.depositAddress);
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
        res.send(html);
    }
    catch (error) {
        res.status(404).send('Swap not found');
    }
}));
// Webhook endpoint for SideShift notifications
app.post('/webhook/sideshift', (req, res) => {
    try {
        const payload = req.body;
        console.log('Received SideShift webhook:', payload);
        // Process the webhook payload
        // In a full implementation, you would:
        // 1. Validate the webhook signature
        // 2. Update the swap status in your database
        // 3. Notify users via Telegram
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Start the server
app.listen(PORT, () => {
    console.log(`🚀 LazySwap server running on port ${PORT}`);
    console.log(`📱 Telegram bot: ${process.env.TELEGRAM_BOT_TOKEN ? 'Connected' : 'Not configured'}`);
    console.log(`🔑 SideShift API: ${process.env.SIDESHIFT_SECRET ? 'Configured' : 'Not configured'}`);
});
// Start the Telegram bot
if (process.env.TELEGRAM_BOT_TOKEN) {
    bot.launch();
    console.log('🤖 Telegram bot started');
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
else {
    console.log('⚠️  Telegram bot token not provided');
}
exports.default = app;
