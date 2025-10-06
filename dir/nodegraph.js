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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = nodegraph;
const sideshift_api_1 = require("./sideshift-api");
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
const prompts_1 = require("@langchain/core/prompts");
const langgraph_1 = require("@langchain/langgraph");
const langgraph_2 = require("@langchain/langgraph");
const prompts_2 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
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
            }
        }
    });
    graph.addNode("initial_node", async (state) => {
        console.log("📝 INITIAL_NODE - Received state:", {
            messagesCount: state.messages?.length || 0,
            lastMessage: state.messages?.[state.messages.length - 1]?.content?.substring(0, 100) + "...",
            swapValues: state.swapValues
        });
        const SYSTEM_TEMPLATE = `You are LazySwap, an AI-powered Telegram bot facilitating cross-chain cryptocurrency swaps powered by SideShift API.

🚀 **Welcome Message**: Always start your first response with a friendly greeting like "Hi there! Welcome to LazySwap! 👋" or "Hello! I'm LazySwap, your friendly crypto swap assistant! 🚀"

Be warm, conversational, and helpful in all your responses. Use emojis appropriately to make interactions more engaging.

Your main functions are:
1. 🔄 Assist users in performing cross-chain swaps using simple, conversational interactions
2. 📋 Provide information about available tokens and networks supported by the SideShift API
3. 🎯 Guide users through the swap process step-by-step with clear instructions
4. ❓ Answer questions about LazySwap and cross-chain swaps in a friendly manner

**Supported Assets**: SideShift supports a wide variety of cryptocurrencies and networks including:
- Bitcoin (BTC) on Bitcoin network
- Ethereum (ETH) on Ethereum network  
- USDT on multiple networks (Ethereum, Tron, etc.)
- USDC on multiple networks (Ethereum, Polygon, etc.)
- And many other popular cryptocurrencies

**Swap Process**: When a user wants to perform a swap, gather the following information conversationally:
- The token symbol they want to swap from (source token)
- The network of the source token (if applicable)
- The token symbol they want to swap to (destination token)  
- The network of the destination token (if applicable)
- The amount they want to swap
- The destination address where they want to receive the swapped tokens

**Validation Requirements**:
- Only accept token symbols that are supported by SideShift (we validate this automatically)
- The minimum swap amount varies by token - we'll validate this through the API
- Users must provide a valid destination address for the token they're receiving

Always ensure you have all required fields (source token, destination token, amount, destination address) before proceeding.

If any token is invalid or not supported, inform the user politely and ask for clarification with suggestions.

**Confirmation Format**: Once you have all the required information, display it to the user in this format:
'Great! Let me confirm your swap details:

🔄 **Swap Summary**:
* From: [amount] [source token]
* To: [destination token]  
* Destination Address: [destination address]

Does this look correct? If yes, I'll proceed with getting you a quote!'

If any information is missing, ask the user conversationally for clarification (e.g., "Could you please specify which network you want to use for your USDT? 🤔").

**Tone**: Always be friendly, helpful, and encouraging. Use phrases like "I'd be happy to help!", "Great choice!", "Let's get that swap set up for you!", etc.
        `;
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ["system", SYSTEM_TEMPLATE],
            new prompts_2.MessagesPlaceholder("messages"),
        ]);
        const response = await prompt.pipe(model).invoke({ messages: state.messages });
        console.log("📤 INITIAL_NODE - Generated response:", typeof response.content === 'string' ? response.content.substring(0, 200) + "..." : response.content.toString().substring(0, 200) + "...");
        return {
            messages: [response]
        };
    });
    /* @ts-ignore */
    graph.addEdge(langgraph_3.START, "initial_node");
    /* @ts-ignore */
    graph.addConditionalEdges("initial_node", async (state) => {
        console.log("🔀 CONDITIONAL_EDGE - Analyzing state for routing:", {
            messagesCount: state.messages?.length || 0,
            lastMessage: state.messages?.[state.messages.length - 1]?.content?.substring(0, 100) + "..."
        });
        // Get the user's message (not the bot's response)
        const userMessages = state.messages?.filter(msg => msg instanceof messages_1.HumanMessage) || [];
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
        console.log("🔍 CONDITIONAL_EDGE - User message being analyzed:", lastUserMessage);
        const SYSTEM_TEMPLATE = `You are a routing system for LazySwap bot. Analyze user messages to determine if they contain a COMPLETE swap request.

A COMPLETE swap request must have ALL of these elements clearly stated:
1. Source token (what they want to swap FROM)
2. Destination token (what they want to swap TO) 
3. Amount (how much they want to swap)

Examples of COMPLETE requests:
- "Swap 0.1 ETH to USDC"
- "Exchange 100 USDT for BTC"
- "Convert 1 BTC to ETH"

Examples of INCOMPLETE requests (casual conversation):
- "hi there I do not get it what is this"
- "ok"
- "what is LazySwap?"
- "how does this work?"
- "I want to swap ETH" (missing amount and destination)
- "swap 0.1 ETH" (missing destination)

Only respond with "PRECHECK" if ALL THREE elements (source token, destination token, amount) are clearly present.
Otherwise respond with "CONTINUE" for casual conversation or incomplete requests.`;
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ["system", SYSTEM_TEMPLATE],
            ["human", "Analyze this user message: {message}"],
        ]);
        const chain = prompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
        const rawCategorization = await chain.invoke({ message: lastUserMessage });
        console.log("🎯 CONDITIONAL_EDGE - Categorization result:", rawCategorization);
        if (rawCategorization.includes("PRECHECK")) {
            console.log("➡️ CONDITIONAL_EDGE - Routing to precheck (complete swap request)");
            return "precheck";
        }
        else {
            console.log("➡️ CONDITIONAL_EDGE - Continuing conversation");
            return "continue";
        }
    }, {
        precheck: "precheck_node",
        continue: "conversation_node",
    });
    // Add conversation node for casual chat
    graph.addNode("conversation_node", async (state) => {
        console.log("💬 CONVERSATION_NODE - Handling casual conversation:", {
            messagesCount: state.messages?.length || 0,
            lastMessage: state.messages?.[state.messages.length - 1]?.content?.substring(0, 100) + "..."
        });
        // Get the user's message
        const userMessages = state.messages?.filter(msg => msg instanceof messages_1.HumanMessage) || [];
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
        const systemTemplate = `You are LazySwap, a friendly crypto swap assistant. You help users understand how to use the service and answer their questions.

Key points about LazySwap:
- You help swap crypto across different chains
- Users can make swap requests with simple text commands
- Examples: "Swap 0.1 ETH to USDC", "Exchange 100 USDT for BTC", "Convert 1 BTC to ETH"
- You need the source token, destination token, and amount to process a swap

Be helpful, friendly, and guide users toward making proper swap requests when they're ready.
Keep responses concise and encouraging.`;
        const humanTemplate = "User message: {message}";
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ["system", systemTemplate],
            ["human", humanTemplate],
        ]);
        const chain = prompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
        const response = await chain.invoke({ message: lastUserMessage });
        console.log("💬 CONVERSATION_NODE - Generated response:", response);
        return {
            messages: [new messages_1.AIMessage(response)]
        };
    });
    graph.addNode("precheck_node", async (state) => {
        console.log("🔍 PRECHECK_NODE - Received state:", {
            messagesCount: state.messages?.length || 0,
            lastMessage: state.messages?.[state.messages.length - 1]?.content?.substring(0, 100) + "...",
            swapValues: state.swapValues
        });
        const systemTemplate = `You are an expert at verifying details for cross-chain swaps. Extract the following information from the user's input:
        1. Source chain
        2. Source token
        3. Destination chain
        4. Destination token
        5. Amount to swap
        6. Destination address (if provided)
    
        Format your response ONLY as a JSON object with these keys: sourceChain, sourceToken, destChain, destToken, amount, destAddress.
        If any information is missing, use null as the value for that key. Do not include any other text in your response.`;
        const humanTemplate = "{input}";
        const chatPrompt = prompts_1.ChatPromptTemplate.fromMessages([
            prompts_1.SystemMessagePromptTemplate.fromTemplate(systemTemplate),
            prompts_1.HumanMessagePromptTemplate.fromTemplate(humanTemplate),
        ]);
        const message = state.messages[state.messages.length - 1].content;
        const chain = chatPrompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
        const result = await chain.invoke({ input: message });
        console.log("📊 PRECHECK_NODE - Raw extraction result:", result);
        // Parse the JSON result
        let parsedResult;
        try {
            parsedResult = JSON.parse(result);
            console.log("✅ PRECHECK_NODE - Parsed result:", parsedResult);
        }
        catch (error) {
            console.error("❌ PRECHECK_NODE - Failed to parse JSON:", error);
            return {
                messages: [new messages_1.AIMessage("ERROR: There was an internal error please try again")]
            };
        }
        // Validate the parsed result using sideShiftValidation
        console.log("🔄 PRECHECK_NODE - Validating with SideShift...");
        const validationResult = await sideShiftValidation(parsedResult);
        console.log("🎯 PRECHECK_NODE - Validation result:", validationResult);
        if (validationResult === "SUCCESS") {
            const swapValues = {
                sourceChain: parsedResult.sourceChain,
                sourceToken: parsedResult.sourceToken,
                destChain: parsedResult.destChain,
                destToken: parsedResult.destToken,
                amount: parsedResult.amount,
            };
            // Only add destAddress if it's provided and not null
            if (parsedResult.destAddress !== null && parsedResult.destAddress !== undefined) {
                swapValues.destAddress = parsedResult.destAddress;
            }
            console.log("✅ PRECHECK_NODE - Success! Setting swapValues:", swapValues);
            return {
                messages: [new messages_1.AIMessage("Tokens are available to swap on SideShift proceeding to generate quote")],
                swapValues: swapValues
            };
        }
        else {
            console.error("❌ PRECHECK_NODE - Validation failed:", validationResult);
            return {
                messages: [new messages_1.AIMessage(validationResult)]
            };
        }
    });
    /* @ts-ignore */
    graph.addConditionalEdges("precheck_node", (state) => {
        console.log("🔀 PRECHECK_CONDITIONAL - Checking state for routing:", {
            swapValues: state.swapValues,
            hasBasicValues: !!(state.swapValues &&
                state.swapValues.sourceToken &&
                state.swapValues.destToken &&
                state.swapValues.amount),
            hasDestAddress: !!state.swapValues?.destAddress
        });
        // Check if we have basic swap info but missing destination address
        if (state.swapValues &&
            state.swapValues.sourceToken &&
            state.swapValues.destToken &&
            state.swapValues.amount &&
            !state.swapValues.destAddress) {
            console.log("➡️ PRECHECK_CONDITIONAL - Routing to collect_address_node (missing destination address)");
            return "collectAddress";
        }
        // Check if we have all information including destination address
        else if (state.swapValues &&
            state.swapValues.sourceToken &&
            state.swapValues.destToken &&
            state.swapValues.amount &&
            state.swapValues.destAddress) {
            console.log("➡️ PRECHECK_CONDITIONAL - Routing to getQuote_node (all info complete)");
            return "getQuote";
        }
        else {
            // If swap values are not complete, end the conversation
            console.log("➡️ PRECHECK_CONDITIONAL - Ending conversation (incomplete values)");
            return "end";
        }
    }, {
        collectAddress: "collect_address_node",
        getQuote: "getQuote_node",
        end: langgraph_2.END
    });
    // Add node to collect destination address
    graph.addNode("collect_address_node", async (state) => {
        console.log("📍 COLLECT_ADDRESS_NODE - Requesting destination address:", {
            swapValues: state.swapValues
        });
        const sourceToken = state.swapValues?.sourceToken || "tokens";
        const destToken = state.swapValues?.destToken || "tokens";
        const amount = state.swapValues?.amount || "amount";
        const message = `Great! I can help you swap ${amount} ${sourceToken.toUpperCase()} to ${destToken.toUpperCase()}.

🔑 **To proceed, I need your ${destToken.toUpperCase()} destination address.**

Please provide the wallet address where you want to receive your ${destToken.toUpperCase()} tokens.

⚠️ **Important**: Make sure the address is correct and supports ${destToken.toUpperCase()} tokens. Incorrect addresses may result in permanent loss of funds.`;
        return {
            messages: [new messages_1.AIMessage(message)]
        };
    });
    // Add conditional routing from collect_address_node
    /* @ts-ignore */
    graph.addConditionalEdges("collect_address_node", async (state) => {
        console.log("🔀 COLLECT_ADDRESS_CONDITIONAL - Analyzing for destination address:", {
            messagesCount: state.messages?.length || 0,
            lastMessage: state.messages?.[state.messages.length - 1]?.content?.substring(0, 100) + "..."
        });
        // Get the user's message (not the bot's response)
        const userMessages = state.messages?.filter(msg => msg instanceof messages_1.HumanMessage) || [];
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
        // Convert to string if it's not already
        const messageText = typeof lastUserMessage === 'string' ? lastUserMessage : String(lastUserMessage);
        console.log("🔍 COLLECT_ADDRESS_CONDITIONAL - User message:", messageText);
        // Simple address validation - check if it looks like a crypto address
        const addressPattern = /^[a-zA-Z0-9]{25,}$/; // Basic pattern for crypto addresses
        if (addressPattern.test(messageText.trim())) {
            console.log("✅ COLLECT_ADDRESS_CONDITIONAL - Valid address detected, updating state");
            // Update the state with the destination address
            const updatedSwapValues = {
                ...state.swapValues,
                destAddress: messageText.trim()
            };
            // Return the updated state along with the routing decision
            state.swapValues = updatedSwapValues;
            return "getQuote";
        }
        else {
            console.log("❌ COLLECT_ADDRESS_CONDITIONAL - Invalid address format, asking again");
            return "askAgain";
        }
    }, {
        getQuote: "getQuote_node",
        askAgain: "ask_address_again_node"
    });
    // Add node to ask for address again if invalid
    graph.addNode("ask_address_again_node", async (state) => {
        console.log("🔄 ASK_ADDRESS_AGAIN_NODE - Invalid address provided");
        const destToken = state.swapValues?.destToken || "token";
        const message = `❌ The address you provided doesn't appear to be valid.

Please provide a valid ${destToken.toUpperCase()} wallet address. It should be a long string of letters and numbers (typically 25+ characters).

Example formats:
• Bitcoin: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
• Ethereum: 0x742d35Cc6634C0532925a3b8D4C9db96590e4265
• Other tokens: Similar format depending on the network

Please try again with your ${destToken.toUpperCase()} address:`;
        return {
            messages: [new messages_1.AIMessage(message)]
        };
    });
    // Route back to collect address after asking again
    /* @ts-ignore */
    graph.addEdge("ask_address_again_node", "collect_address_node");
    graph.addNode("getQuote_node", async (state) => {
        console.log("💰 GETQUOTE_NODE - Received state:", {
            swapValues: state.swapValues,
            quoteId: state.quoteId
        });
        try {
            // First check permissions
            console.log("🔐 GETQUOTE_NODE - Checking permissions...");
            const permissions = await sideShiftAPI.checkPermissions();
            console.log("🔐 GETQUOTE_NODE - Permissions result:", permissions);
            if (!permissions.createShift) {
                console.log("❌ GETQUOTE_NODE - Permissions denied");
                return {
                    messages: [new messages_1.AIMessage("❌ Sorry, SideShift.ai is not available in your region. Please check the supported jurisdictions.")],
                };
            }
            // Helper function to map tokens to SideShift coin symbols
            const getCoinSymbol = (token) => {
                const tokenMap = {
                    "flip": "FLIP",
                    "usdc": "USDC",
                    "dot": "DOT",
                    "eth": "ETH",
                    "btc": "BTC",
                    "usdt": "USDT"
                };
                return tokenMap[token.toLowerCase()] || token.toUpperCase();
            };
            // Create a quote request using SideShift API
            const quoteRequest = {
                depositCoin: getCoinSymbol(state.swapValues.sourceToken),
                settleCoin: getCoinSymbol(state.swapValues.destToken),
                depositAmount: state.swapValues.amount,
                affiliateId: process.env.AFFILIATE_ID || ''
            };
            console.log('💰 GETQUOTE_NODE - Quote request:', quoteRequest);
            const quoteResponse = await sideShiftAPI.requestQuote(quoteRequest);
            console.log('💰 GETQUOTE_NODE - Quote response:', quoteResponse);
            // Store quote ID in state for fixed shift creation
            const deposit = parseFloat(state.swapValues.amount);
            const receive = parseFloat(quoteResponse.settleAmount);
            const rate = parseFloat(quoteResponse.rate);
            const expiresAt = new Date(quoteResponse.expiresAt).toLocaleString();
            const result = `
<b>🎉 Your Fixed Rate Quote:</b>

<b>💸 You Send:</b> ${deposit.toFixed(6)} ${state.swapValues.sourceToken}
<b>💸 You Receive:</b> ${receive.toFixed(6)} ${state.swapValues.destToken}
<b>📈 Exchange Rate:</b> 1 ${state.swapValues.sourceToken} = ${rate.toFixed(6)} ${state.swapValues.destToken}
<b>⏰ Quote Expires:</b> ${expiresAt}

<b>❗ This is a fixed rate quote valid for 15 minutes.</b>
The rate is locked in and includes all fees.

<b>🔑 Please enter your destination address to proceed with the swap.</b>
`;
            console.log('✅ GETQUOTE_NODE - Success! Generated quote message');
            return {
                messages: [new messages_1.AIMessage(result)],
                quoteId: quoteResponse.id,
                quoteResponse: quoteResponse
            };
        }
        catch (error) {
            console.error('❌ GETQUOTE_NODE - Quote error:', error);
            return {
                messages: [new messages_1.AIMessage("😕 Oops! There was an error getting your quote. This could be due to insufficient liquidity or unsupported trading pair. Please try again with different parameters.")],
            };
        }
    });
    /* @ts-ignore */
    graph.addConditionalEdges("getQuote_node", (state) => {
        const lastMessage = state.messages[state.messages.length - 1].content;
        console.log("🔀 GETQUOTE_CONDITIONAL - Analyzing message for routing:", {
            messagePreview: lastMessage.substring(0, 100) + "...",
            hasDestAddress: !!state.swapValues?.destAddress,
            destAddress: state.swapValues?.destAddress
        });
        if (lastMessage.includes("Please enter your destination address to proceed with the swap.") && state.swapValues.destAddress) {
            console.log("➡️ GETQUOTE_CONDITIONAL - Routing to generateDeposit_node");
            return "generateDeposit";
        }
        else if (lastMessage.includes("Sorry, there was an error processing your request.") || lastMessage.includes("Please try again with different parameters.")) {
            console.log("➡️ GETQUOTE_CONDITIONAL - Ending conversation (error)");
            return "end";
        }
        else {
            console.log("➡️ GETQUOTE_CONDITIONAL - Ending conversation (no dest address or other reason)");
            return "end";
        }
    }, {
        generateDeposit: "generateDeposit_node",
        end: langgraph_2.END
    });
    /* @ts-ignore */
    graph.addNode("generateDeposit_node", async (state) => {
        console.log("🏦 GENERATEDEPOSIT_NODE - Received state:", {
            quoteId: state.quoteId,
            swapValues: state.swapValues,
            quoteResponse: state.quoteResponse ? "Present" : "Missing"
        });
        try {
            // Check if we have a quote ID for fixed shift
            if (!state.quoteId) {
                console.log("❌ GENERATEDEPOSIT_NODE - No quote ID found");
                return {
                    messages: [new messages_1.AIMessage("❌ No valid quote found. Please start over to get a new quote.")],
                };
            }
            // Create fixed shift using the quote
            const fixedShiftRequest = {
                settleAddress: state.swapValues.destAddress,
                affiliateId: process.env.AFFILIATE_ID || '',
                quoteId: state.quoteId
            };
            console.log('🏦 GENERATEDEPOSIT_NODE - Fixed shift request:', fixedShiftRequest);
            const result = await sideShiftAPI.createFixedShiftFromQuote(fixedShiftRequest);
            console.log('🏦 GENERATEDEPOSIT_NODE - Fixed shift response:', result);
            // Use the original quote amounts from state since SwapResponse doesn't have settleAmount
            const deposit = parseFloat(state.swapValues.amount);
            const receive = parseFloat(state.quoteResponse?.settleAmount || '0');
            const networkFee = parseFloat(result.settleCoinNetworkFee || '0');
            const networkFeeUsd = parseFloat(result.networkFeeUsd || '0');
            const expiresAt = new Date(result.expiresAt).toLocaleString();
            const resultMessage = `
<b>🎉 Fixed Rate Swap Created!</b>

<b>❗ Important:</b>
- Send exactly <b>${deposit.toFixed(6)} ${state.swapValues.sourceToken}</b> to the deposit address below
- This is a fixed rate swap - you'll receive exactly the quoted amount
- Quote expires at: <b>${expiresAt}</b>
- Funds sent after expiration will be refunded (minus network fees)

<b>📊 Swap Details:</b>
- <b>Swap ID:</b> ${result.id}
- <b>You Send:</b> ${deposit.toFixed(6)} ${state.swapValues.sourceToken}
- <b>You Receive:</b> ${receive.toFixed(6)} ${state.swapValues.destToken}
- <b>Network Fee:</b> ${networkFee.toFixed(6)} ${state.swapValues.destToken} (~$${networkFeeUsd.toFixed(2)})
- <b>Recipient Address:</b> ${state.swapValues.destAddress}

<b>📦 Deposit Address:</b>
<code>${result.depositAddress}</code>

<b>📋 Instructions:</b>
1. Send exactly <b>${deposit.toFixed(6)} ${state.swapValues.sourceToken}</b> to the deposit address above
2. Monitor your swap status: <a href="https://sideshift.ai/orders/${result.id}">View on SideShift</a>
3. You'll receive ${receive.toFixed(6)} ${state.swapValues.destToken} at your destination address

<b>⚠️ Warning:</b> Send the exact amount shown. Sending less may result in a refund with fees deducted.
            `;
            console.log("✅ GENERATEDEPOSIT_NODE - Success! Generated deposit message");
            return {
                messages: [new messages_1.AIMessage(resultMessage)],
                depositAddress: result.depositAddress,
                swapId: result.id,
            };
        }
        catch (error) {
            console.error('❌ GENERATEDEPOSIT_NODE - Fixed shift creation error:', error);
            return {
                messages: [new messages_1.AIMessage(`😕 Sorry, there was an error creating your swap. Please make sure you have provided a valid destination address: ${state.swapValues.destAddress}. The quote may have also expired - please try again.`)],
            };
        }
    });
    /* @ts-ignore */
    graph.addEdge("generateDeposit_node", langgraph_2.END);
    // Add edge from conversation_node to END
    /* @ts-ignore */
    graph.addEdge("conversation_node", langgraph_2.END);
    console.log("✅ Nodegraph compilation complete!");
    return graph.compile();
}
;
nodegraph();
