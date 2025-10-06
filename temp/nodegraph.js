"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = nodegraph;
const sideshift_api_1 = require("./sideshift-api");
const dotenv = require("dotenv");
// Load environment variables
dotenv.config();
const langgraph_1 = require("@langchain/langgraph");
const langgraph_2 = require("@langchain/langgraph");
const messages_1 = require("@langchain/core/messages");
const langgraph_3 = require("@langchain/langgraph");
const groq_1 = require("@langchain/groq");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const sideShiftAPI = (0, sideshift_api_1.createSideShiftAPI)(process.env.SIDESHIFT_SECRET || '');
const model = new groq_1.ChatGroq({
    modelName: "llama-3.3-70b-versatile",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
});
const sideShiftValidation = async ({ sourceChain, sourceToken, destChain, destToken }) => {
    // Get available coins from SideShift API
    const coins = await sideShiftAPI.getCoins();
    // Find source and destination coins
    const sourceCoin = coins.find(coin => coin.coin.toLowerCase() === sourceToken.toLowerCase() ||
        coin.name.toLowerCase().includes(sourceToken.toLowerCase()));
    const destCoin = coins.find(coin => coin.coin.toLowerCase() === destToken.toLowerCase() ||
        coin.name.toLowerCase().includes(destToken.toLowerCase()));
    if (!sourceCoin) {
        return `Invalid source token. "${sourceToken}" not found in available coins.`;
    }
    if (!destCoin) {
        return `Invalid destination token. "${destToken}" not found in available coins.`;
    }
    // Check if coins support variable swaps
    if (sourceCoin.fixedOnly) {
        return `Source token "${sourceToken}" only supports fixed swaps.`;
    }
    if (destCoin.fixedOnly) {
        return `Destination token "${destToken}" only supports fixed swaps.`;
    }
    return "SUCCESS";
};
function nodegraph() {
    console.log("🚀 Initializing nodegraph...");
    const graph = new langgraph_1.StateGraph({
        channels: {
            messages: {
                value: (x, y) => x.concat(y),
            },
            swapValues: {
                value: null,
            },
            currentStep: {
                value: null,
            }
        }
    });
    // MAIN ROUTER NODE - Handles all incoming messages
    graph.addNode("router", async (state) => {
        console.log("🔀 ROUTER - Processing message:", {
            messagesCount: state.messages?.length || 0,
            currentStep: state.currentStep,
            swapValues: state.swapValues
        });
        // Get the last user message
        const userMessages = state.messages?.filter(msg => msg instanceof messages_1.HumanMessage) || [];
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
        const messageText = typeof lastUserMessage === 'string' ? lastUserMessage : String(lastUserMessage);
        console.log("📝 ROUTER - User message:", messageText);
        console.log("📊 ROUTER - Current step:", state.currentStep);
        // Route based on current step
        if (state.currentStep === "waiting_for_address") {
            console.log("➡️ ROUTER - Routing to address validation");
            return { currentStep: "validate_address" };
        }
        else if (messageText.toLowerCase().includes("swap") ||
            messageText.toLowerCase().includes("exchange") ||
            messageText.toLowerCase().includes("convert")) {
            console.log("➡️ ROUTER - Routing to swap extraction");
            return { currentStep: "extract_swap" };
        }
        else {
            console.log("➡️ ROUTER - Routing to conversation");
            return { currentStep: "conversation" };
        }
    });
    // CONVERSATION NODE - Handles greetings and general chat
    graph.addNode("conversation", async (state) => {
        console.log("💬 CONVERSATION - Handling general chat");
        const userMessages = state.messages?.filter(msg => msg instanceof messages_1.HumanMessage) || [];
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
        const messageText = typeof lastUserMessage === 'string' ? lastUserMessage : String(lastUserMessage);
        let response = "";
        if (messageText.toLowerCase().includes("hello") ||
            messageText.toLowerCase().includes("hi") ||
            messageText.toLowerCase().includes("hey") ||
            messageText === "/start") {
            response = `Hi there! Welcome to LazySwap! 👋

I'm your friendly crypto swap assistant. I can help you swap cryptocurrencies across different networks using simple commands.

🔄 **To make a swap, just tell me:**
• "Swap 0.1 ETH to USDC"
• "Exchange 100 USDT for BTC"
• "Convert 1 BTC to ETH"

What would you like to swap today? 🚀`;
        }
        else {
            response = `I'm LazySwap, your crypto swap assistant! 🚀

I can help you swap cryptocurrencies. Just tell me what you want to swap like:
• "Swap 0.1 ETH to USDC"
• "Exchange 100 USDT for BTC"

What would you like to swap? 💱`;
        }
        return {
            messages: [new messages_1.AIMessage(response)],
            currentStep: null
        };
    });
    // SWAP EXTRACTION NODE - Extracts swap details from user message
    graph.addNode("extract_swap", async (state) => {
        console.log("🔍 EXTRACT_SWAP - Processing swap request");
        const userMessages = state.messages?.filter(msg => msg instanceof messages_1.HumanMessage) || [];
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
        const messageText = typeof lastUserMessage === 'string' ? lastUserMessage : String(lastUserMessage);
        // Simple regex extraction for common patterns
        const swapPattern = /(?:swap|exchange|convert)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i;
        const match = messageText.match(swapPattern);
        if (match) {
            const [, amount, sourceToken, destToken] = match;
            console.log("✅ EXTRACT_SWAP - Found swap details:", { amount, sourceToken, destToken });
            // Validate tokens with SideShift
            const validation = await sideShiftValidation({
                sourceChain: null,
                sourceToken,
                destChain: null,
                destToken
            });
            if (validation === "SUCCESS") {
                const swapValues = {
                    sourceToken: sourceToken.toUpperCase(),
                    destToken: destToken.toUpperCase(),
                    amount: amount,
                    sourceChain: null,
                    destChain: null,
                    destAddress: null
                };
                const response = `Great! I can help you swap ${amount} ${sourceToken.toUpperCase()} to ${destToken.toUpperCase()}.

🔑 **To proceed, I need your ${destToken.toUpperCase()} destination address.**

Please provide the wallet address where you want to receive your ${destToken.toUpperCase()} tokens.

⚠️ **Important**: Make sure the address is correct and supports ${destToken.toUpperCase()} tokens.`;
                return {
                    messages: [new messages_1.AIMessage(response)],
                    swapValues: swapValues,
                    currentStep: "waiting_for_address"
                };
            }
            else {
                return {
                    messages: [new messages_1.AIMessage(`❌ ${validation}\n\nPlease try again with supported tokens.`)],
                    currentStep: null
                };
            }
        }
        else {
            const response = `🤔 I didn't understand that swap request.

Try something like:
• "Swap 0.1 ETH to USDC"
• "Exchange 100 USDT for BTC"`;
            return {
                messages: [new messages_1.AIMessage(response)],
                currentStep: null
            };
        }
    });
    // ADDRESS VALIDATION NODE - Validates and processes destination address
    graph.addNode("validate_address", async (state) => {
        console.log("📍 VALIDATE_ADDRESS - Processing address");
        const userMessages = state.messages?.filter(msg => msg instanceof messages_1.HumanMessage) || [];
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
        const messageText = typeof lastUserMessage === 'string' ? lastUserMessage : String(lastUserMessage);
        const address = messageText.trim();
        // Basic address validation
        const addressPattern = /^[a-zA-Z0-9]{25,}$/;
        if (addressPattern.test(address)) {
            console.log("✅ VALIDATE_ADDRESS - Valid address format");
            // Update swap values with address
            const updatedSwapValues = {
                ...state.swapValues,
                destAddress: address
            };
            const response = `✅ Perfect! Here's your swap summary:

🔄 **Swap Details:**
• From: ${state.swapValues?.amount} ${state.swapValues?.sourceToken}
• To: ${state.swapValues?.destToken}
• Destination: ${address.substring(0, 10)}...${address.substring(address.length - 6)}

🔍 Getting you a quote now...`;
            return {
                messages: [new messages_1.AIMessage(response)],
                swapValues: updatedSwapValues,
                currentStep: "get_quote"
            };
        }
        else {
            const response = `❌ That doesn't look like a valid address.

Please provide a valid ${state.swapValues?.destToken} wallet address (typically 25+ characters).

Example: 0x742d35Cc6634C0532925a3b8D4C9db96590e4265`;
            return {
                messages: [new messages_1.AIMessage(response)],
                currentStep: "waiting_for_address"
            };
        }
    });
    // QUOTE NODE - Gets quote from SideShift
    graph.addNode("get_quote", async (state) => {
        console.log("💰 GET_QUOTE - Generating quote");
        try {
            // Check permissions first
            const permissions = await sideShiftAPI.checkPermissions();
            if (!permissions.createShift) {
                return {
                    messages: [new messages_1.AIMessage("❌ Sorry, swap creation is currently disabled. Please try again later.")],
                    currentStep: null
                };
            }
            // Create quote request
            const quoteRequest = {
                depositCoin: state.swapValues?.sourceToken?.toLowerCase() || '',
                settleCoin: state.swapValues?.destToken?.toLowerCase() || '',
                depositAmount: state.swapValues?.amount || '',
                affiliateId: process.env.AFFILIATE_ID || ''
            };
            console.log("📊 GET_QUOTE - Quote request:", quoteRequest);
            const quote = await sideShiftAPI.requestQuote(quoteRequest);
            console.log("✅ GET_QUOTE - Quote received:", quote);
            const response = `💱 **Quote Ready!**

📊 **Details:**
• You send: ${quote.depositAmount} ${state.swapValues?.sourceToken}
• You receive: ~${quote.settleAmount} ${state.swapValues?.destToken}
• Rate: 1 ${state.swapValues?.sourceToken} = ${(parseFloat(quote.settleAmount) / parseFloat(quote.depositAmount)).toFixed(6)} ${state.swapValues?.destToken}
• Network fee: ${quote.depositCoin.toUpperCase()} network fees apply

⏰ **This quote expires in 10 minutes.**

🚀 Ready to proceed? I'll generate your deposit address next!`;
            return {
                messages: [new messages_1.AIMessage(response)],
                quoteResponse: quote,
                currentStep: "create_shift"
            };
        }
        catch (error) {
            console.error("❌ GET_QUOTE - Error:", error);
            return {
                messages: [new messages_1.AIMessage("❌ Sorry, I couldn't get a quote right now. Please try again later.")],
                currentStep: null
            };
        }
    });
    // CREATE SHIFT NODE - Creates the actual swap
    graph.addNode("create_shift", async (state) => {
        console.log("🔄 CREATE_SHIFT - Creating swap");
        try {
            if (!state.quoteResponse) {
                throw new Error("No quote available");
            }
            const swapRequest = {
                quoteId: state.quoteResponse.id,
                settleAddress: state.swapValues?.destAddress || '',
                affiliateId: process.env.AFFILIATE_ID || ''
            };
            console.log("🔄 CREATE_SHIFT - Swap request:", swapRequest);
            const swapResponse = await sideShiftAPI.createFixedShiftFromQuote(swapRequest);
            console.log("✅ CREATE_SHIFT - Swap created:", swapResponse);
            const response = `🎉 **Swap Created Successfully!**

📬 **Send your ${state.swapValues?.sourceToken} to:**
\`${swapResponse.depositAddress}\`

💰 **Amount to send:** ${state.quoteResponse.depositAmount} ${state.swapValues?.sourceToken}

🔍 **Swap ID:** ${swapResponse.id}

⚡ **What happens next:**
1. Send exactly ${state.quoteResponse.depositAmount} ${state.swapValues?.sourceToken} to the address above
2. Wait for network confirmations
3. Receive ~${state.quoteResponse.settleAmount} ${state.swapValues?.destToken} at your address

⏰ **Important:** Send within 10 minutes or the swap will expire!

Need help? Just ask! 🚀`;
            return {
                messages: [new messages_1.AIMessage(response)],
                depositAddress: swapResponse.depositAddress,
                swapId: swapResponse.id,
                currentStep: null
            };
        }
        catch (error) {
            console.error("❌ CREATE_SHIFT - Error:", error);
            return {
                messages: [new messages_1.AIMessage("❌ Sorry, I couldn't create the swap. Please try again.")],
                currentStep: null
            };
        }
    });
    // ROUTING LOGIC
    /* @ts-ignore */
    graph.addEdge(langgraph_3.START, "router");
    /* @ts-ignore */
    graph.addConditionalEdges("router", (state) => {
        const step = state.currentStep;
        console.log("🔀 ROUTER_CONDITIONAL - Routing to:", step);
        if (step === "conversation")
            return "conversation";
        if (step === "extract_swap")
            return "extract_swap";
        if (step === "validate_address")
            return "validate_address";
        if (step === "get_quote")
            return "get_quote";
        if (step === "create_shift")
            return "create_shift";
        return "conversation"; // Default fallback
    }, {
        conversation: "conversation",
        extract_swap: "extract_swap",
        validate_address: "validate_address",
        get_quote: "get_quote",
        create_shift: "create_shift"
    });
    // All nodes route back to router for next message
    /* @ts-ignore */
    graph.addConditionalEdges("conversation", (state) => {
        return state.currentStep ? "router" : langgraph_2.END;
    }, {
        router: "router",
        [langgraph_2.END]: langgraph_2.END
    });
    /* @ts-ignore */
    graph.addConditionalEdges("extract_swap", (state) => {
        return state.currentStep ? "router" : langgraph_2.END;
    }, {
        router: "router",
        [langgraph_2.END]: langgraph_2.END
    });
    /* @ts-ignore */
    graph.addConditionalEdges("validate_address", (state) => {
        return state.currentStep ? "router" : langgraph_2.END;
    }, {
        router: "router",
        [langgraph_2.END]: langgraph_2.END
    });
    /* @ts-ignore */
    graph.addConditionalEdges("get_quote", (state) => {
        return state.currentStep ? "router" : langgraph_2.END;
    }, {
        router: "router",
        [langgraph_2.END]: langgraph_2.END
    });
    /* @ts-ignore */
    graph.addEdge("create_shift", langgraph_2.END);
    const compiledGraph = graph.compile();
    console.log("✅ Nodegraph compilation complete!");
    return compiledGraph;
}
;
nodegraph();
