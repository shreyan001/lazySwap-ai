import { Telegraf, session, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { ChatCloudflareWorkersAI } from '@langchain/cloudflare';
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { MessageGraph } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { END } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import type { BaseMessage } from "@langchain/core/messages";
import { START } from "@langchain/langgraph";
import nodegraph from './nodegraph';
import { SideShiftAPI, createSideShiftAPI, Coin } from './sideshift-api';
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as QRCode from 'qrcode';
import * as dotenv from 'dotenv';
import * as net from 'net';

import { config } from 'dotenv';
config();
  // Initialize Cloudflare Workers AI model
  const model = new ChatCloudflareWorkersAI({
    model: "@hf/thebloke/neural-chat-7b-v3-1-awq",
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
  });
  const sideShiftAPI = createSideShiftAPI(process.env.SIDESHIFT_SECRET || '');

  // Define session data interface
  interface SessionData {
    chain: any;
    graph: any;
    messages: BaseMessage[];
  }

  // Define context type
  interface MyContext extends Context {
    session?: SessionData;
  }

  const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN,);

  bot.use(session());


  // Initialize session
  bot.use((ctx, next) => {
    console.log("🔧 SESSION_INIT - Initializing session for user:", ctx.from?.username || ctx.from?.id);
    
    ctx.session ??= { 
      chain: new ConversationChain({ llm: model, memory: new BufferMemory() }),
      graph: nodegraph(),
      messages: []
    };
    
    console.log("✅ SESSION_INIT - Session ready, messages count:", ctx.session.messages.length);
    return next();
  });


// Refresh command
bot.command('refresh', async (ctx) => {
  console.log("🔄 REFRESH_CMD - User requested session refresh:", ctx.from?.username || ctx.from?.id);
  
  if (ctx.session) {
    ctx.session.messages = [];
    ctx.session.graph = nodegraph();
    console.log("✅ REFRESH_CMD - Session refreshed successfully");
    await ctx.reply('Your session has been refreshed. You can start a new conversation now.');
  } else {
    console.error("❌ REFRESH_CMD - No session found");
    await ctx.reply('Unable to refresh session. Please try again later.');
  }
});



// Define the permanent keyboard




  bot.command('start', (ctx) => {
    const username = ctx.message.from.username || 'there';
    console.log("🚀 START_CMD - User started bot:", username, "ID:", ctx.from?.id);
    const welcomeMessage = `
  Hey ${username}! 👋 Welcome to LazySwap! 🚀

  We're here to make cross-chain crypto swaps as easy as chatting with a friend! 💬✨

  🔄 LazySwap uses the power of SideShift API to seamlessly swap your crypto assets across different blockchains. No complicated menus or confusing interfaces - just tell us what you want to do!

  Here's how it works:
  1️⃣ Tell us what you want to swap (e.g., "I want to swap 0.1 BTC to ETH")
  2️⃣ We'll guide you through the process with simple questions
  3️⃣ Confirm the details, and we'll handle the rest!

  🧠 Powered by AI, we understand natural language, so feel free to ask questions or request a swap in your own words.

  🔐 Security first! We'll always provide clear instructions and never ask for sensitive information.

  🌈 With LazySwap, you have access to a wide range of tokens and networks supported by SideShift. More options, more freedom!

  Ready to start swapping? Just tell me what you'd like to do, or ask any questions you have about our service. Let's make crypto swaps a breeze! 🌪️💰
    `;

    ctx.reply(welcomeMessage, 
      Markup.keyboard([
        ["🔄 Refresh", "ℹ️ Help"] // Row1 with 2 buttons
      ])
      );
  });

// Handle button presses
bot.hears("🔄 Refresh", async (ctx) => {
  console.log("🔄 REFRESH_BTN - User clicked refresh button:", ctx.from?.username || ctx.from?.id);
  
  if (ctx.session) {
    ctx.session.messages = [];
    console.log("✅ REFRESH_BTN - Session messages cleared");
    await ctx.reply('Your session has been refreshed. You can start a new conversation now.');
  } else {
    console.error("❌ REFRESH_BTN - No session found");
    await ctx.reply('Unable to refresh session. Please try again later.');
  }
});

bot.hears("ℹ️ Help", async (ctx) => {
  console.log("ℹ️ HELP_BTN - User requested help:", ctx.from?.username || ctx.from?.id);
  const helpMessage = `
Here are the available commands:

/start - Start or restart the bot
/refresh - Clear your current session and start fresh

To start a swap, simply send a message like:
"I want to swap 0.1 BTC to ETH"
  `;
  await ctx.reply(helpMessage);
});

  // Don't forget to launch your bot

  // Handle text messages
bot.on(message('text'), async (ctx) => {
  console.log("💬 MESSAGE_HANDLER - Received message from:", ctx.from?.username || ctx.from?.id);
  console.log("📝 MESSAGE_HANDLER - Message content:", ctx.message.text);

  const session = ctx.session;
  
  if (!session) {
    console.error("❌ MESSAGE_HANDLER - No session found");
    await ctx.reply('Session error. Please use /start to initialize.');
    return;
  }
  
  console.log("📊 MESSAGE_HANDLER - Current session state:", {
    messagesCount: session.messages.length,
    hasGraph: !!session.graph
  });
  
  try {
    // Send a loading message
    console.log("⏳ MESSAGE_HANDLER - Sending loading message...");
    const loadingMessage = await ctx.reply('Processing your request... 🔄');

    // Add user message to the session messages
    console.log("➕ MESSAGE_HANDLER - Adding user message to session");
    session.messages.push(new HumanMessage(ctx.message.text));
    
    const userMessages = new HumanMessage(ctx.message.text);
    
    console.log("🔄 MESSAGE_HANDLER - Starting graph stream with messages:", session.messages.length);
    
    // Use the graph to process the message
    const stream = await session.graph.stream({ messages: session.messages });

    let lastResponse = '';
    let nodeCount = 0;
    
    console.log("🌊 MESSAGE_HANDLER - Processing graph stream...");
    
    for await (const value of stream) {
      nodeCount++;
      const [nodeName, output] = Object.entries(value)[0];
      
      console.log(`🔗 GRAPH_STREAM - Node ${nodeCount}: ${nodeName}`);
      console.log(`📤 GRAPH_STREAM - Output preview:`, typeof output === 'object' && output && 'messages' in output && Array.isArray((output as any).messages) ? (output as any).messages[0]?.content?.toString().substring(0, 100) + "..." : "No messages");
      
      /* @ts-ignore */
      console.log(nodeName, output.messages[0].content);
      if (nodeName !== END) {
        /* @ts-ignore */
        lastResponse = output.messages[0].content;
        console.log(`✅ GRAPH_STREAM - Updated lastResponse from ${nodeName}`);
      }
    }

    console.log(`🏁 MESSAGE_HANDLER - Graph processing complete. Processed ${nodeCount} nodes`);
    console.log("📋 MESSAGE_HANDLER - Final response length:", lastResponse.length);

    // Delete the loading message
    console.log("🗑️ MESSAGE_HANDLER - Deleting loading message...");
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);

    // Send AI response to user
    console.log("📤 MESSAGE_HANDLER - Sending final response to user");
    await ctx.reply(lastResponse, { parse_mode: 'HTML' });
    
    // Check for deposit channel ID for QR code
    const channelIdRegex =  /(\d+)-\w+-\d+/;
    const match = lastResponse.match(channelIdRegex);
    if (match) {
      const depositChannelId = match[0];
      console.log("🔍 MESSAGE_HANDLER - Found deposit channel ID:", depositChannelId);
      
      // Check if the chat is a group or supergroup
      const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
      console.log("👥 MESSAGE_HANDLER - Chat type:", ctx.chat.type, "isGroup:", isGroup);
      
      if (!isGroup) {
        console.log("🎯 MESSAGE_HANDLER - Sending QR code button for private chat");
        await ctx.reply(
          'You can check your transaction status or scan QR code to complete the transaction',
          Markup.inlineKeyboard([
            Markup.button.webApp('Open Payment QR', `https://lazyswapbot.vercel.app/?id=${depositChannelId}`)
          ])
        );
      } else {
        console.log("🚫 MESSAGE_HANDLER - Skipping QR code button for group chat");
      }
    } else {
      console.log("🔍 MESSAGE_HANDLER - No deposit channel ID found in response");
    }

    console.log("✅ MESSAGE_HANDLER - Message processing completed successfully");

  } catch (error) {
    console.error('❌ MESSAGE_HANDLER - Error occurred:', error);
    console.error('❌ MESSAGE_HANDLER - Error stack:', error.stack);
    await ctx.reply('Sorry, I encountered an error.');
  }
});

// Port availability checker
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Find available port starting from 3000
async function findAvailablePort(startPort: number = 3000): Promise<number> {
  console.log(`🔍 PORT_FINDER - Searching for available port starting from ${startPort}`);
  
  for (let port = startPort; port <= startPort + 100; port++) {
    const available = await isPortAvailable(port);
    if (available) {
      console.log(`✅ PORT_FINDER - Found available port: ${port}`);
      return port;
    } else {
      console.log(`❌ PORT_FINDER - Port ${port} is busy, trying next...`);
    }
  }
  
  throw new Error('No available ports found in range');
}

// Initialize Express app
console.log("🏭 INDEX_SERVER - Initializing Express application");
const app = express();

// Initialize SideShift API
console.log("🔑 INDEX_SERVER - Initializing SideShift API with secret:", process.env.SIDESHIFT_SECRET ? 'Present' : 'Missing');
const apiClient = createSideShiftAPI(process.env.SIDESHIFT_SECRET || '');

//// Middleware
console.log("⚙️ INDEX_SERVER - Setting up middleware");
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Active swaps storage
console.log("💾 INDEX_SERVER - Active swaps storage initialized");
const activeSwaps = new Map();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      telegram: 'configured',
      sideshift: 'configured'
    }
  });
});

// Get available coins
app.get('/api/coins', async (req: Request, res: Response) => {
  try {
    const coins = await apiClient.getCoins();
    res.json(coins);
  } catch (error) {
    console.error('Error fetching coins:', error);
    res.status(500).json({ error: 'Failed to fetch coins' });
  }
});

// Get permissions
app.get('/api/permissions', async (req: Request, res: Response) => {
  try {
    const permissions = await apiClient.checkPermissions();
    res.json(permissions);
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({ error: 'Failed to check permissions' });
  }
});

// Create variable swap
app.post('/api/swap/variable', async (req: Request, res: Response) => {
  try {
    const swapRequest = req.body;
    const swap = await apiClient.createVariableSwap(swapRequest);
    activeSwaps.set(swap.id, swap);
    res.json(swap);
  } catch (error) {
    console.error('Error creating variable swap:', error);
    res.status(500).json({ error: 'Failed to create variable swap' });
  }
});

// Create fixed swap
app.post('/api/swap/fixed', async (req: Request, res: Response) => {
  try {
    const swapRequest = req.body;
    const swap = await apiClient.createFixedSwap(swapRequest);
    activeSwaps.set(swap.id, swap);
    res.json(swap);
  } catch (error) {
    console.error('Error creating fixed swap:', error);
    res.status(500).json({ error: 'Failed to create fixed swap' });
  }
});

// Get swap status
app.get('/api/swap/:id', async (req: Request, res: Response) => {
  try {
    const swapId = req.params.id;
    const status = await apiClient.getSwapStatus(swapId);
    res.json(status);
  } catch (error) {
    console.error('Error getting swap status:', error);
    res.status(500).json({ error: 'Failed to get swap status' });
  }
});

// Get quote
app.post('/api/quote', async (req: Request, res: Response) => {
  try {
    const { fromCoin, toCoin, amount, fromNetwork, toNetwork } = req.body;
    const quote = await apiClient.getQuote(fromCoin, toCoin, amount, fromNetwork, toNetwork);
    res.json(quote);
  } catch (error) {
    console.error('Error getting quote:', error);
    res.status(500).json({ error: 'Failed to get quote' });
  }
});

// Generate QR code
app.get('/api/qr/:address', async (req: Request, res: Response) => {
  try {
    const address = req.params.address;
    const qrCode = await QRCode.toDataURL(address);
    res.json({ qrCode, address });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Start Express server
async function startServer() {
  try {
    const port = await findAvailablePort(3000);
    
    app.listen(port, () => {
      console.log(`🚀 INDEX_SERVER - Express API running on http://localhost:${port}`);
      console.log(`📊 INDEX_SERVER - Health check: http://localhost:${port}/health`);
      console.log(`🪙 INDEX_SERVER - Coins API: http://localhost:${port}/api/coins`);
      console.log(`🔄 INDEX_SERVER - Swap API: http://localhost:${port}/api/swap`);
      console.log(`💱 INDEX_SERVER - Quote API: http://localhost:${port}/api/quote`);
    });
  } catch (error) {
    console.error('❌ INDEX_SERVER - Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Start the bot
console.log("🤖 INDEX_SERVER - Starting advanced AI Telegram bot...");
  bot.launch();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));