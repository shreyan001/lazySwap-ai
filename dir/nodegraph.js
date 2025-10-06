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
exports.default = nodegraph;
const sideshift_api_1 = require("./sideshift-api");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const prompts_1 = require("@langchain/core/prompts");
const langgraph_1 = require("@langchain/langgraph");
const langgraph_2 = require("@langchain/langgraph");
const prompts_2 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const messages_1 = require("@langchain/core/messages");
const langgraph_3 = require("@langchain/langgraph");
const groq_1 = require("@langchain/groq");
const dotenv_2 = require("dotenv");
(0, dotenv_2.config)();
const sideShiftAPI = (0, sideshift_api_1.createSideShiftAPI)(process.env.SIDESHIFT_SECRET || '');
const model = new groq_1.ChatGroq({
    modelName: "Llama3-8b-8192",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
});
const sideShiftValidation = (_a) => __awaiter(void 0, [_a], void 0, function* ({ sourceChain, sourceToken, destChain, destToken }) {
    // Get available coins from SideShift API
    const coins = yield sideShiftAPI.getCoins();
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
});
function nodegraph() {
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
    graph.addNode("initial_node", (state) => __awaiter(this, void 0, void 0, function* () {
        const SYSTEM_TEMPLATE = `You are LazySwap, an AI-powered Telegram bot facilitating cross-chain cryptocurrency swaps powered by SideShift API.
        Be concise yet friendly in your responses.
        Your main functions are:
        1. Assist users in performing cross-chain swaps using simple, conversational interactions.
        2. Provide information about available tokens and networks supported by the SideShift API.
        3. Guide users through the swap process step-by-step.
        4. Answer basic questions about LazySwap and cross-chain swaps.
        
        Tokens refer to the digital assets you want to swap, such as cryptocurrencies like ETH, BTC, USDT, USDC, and many others. Networks refer to the blockchain networks these tokens reside on.
        
        SideShift supports a wide variety of cryptocurrencies and networks including:
        - Bitcoin (BTC) on Bitcoin network
        - Ethereum (ETH) on Ethereum network
        - USDT on multiple networks (Ethereum, Tron, etc.)
        - USDC on multiple networks (Ethereum, Polygon, etc.)
        - And many other popular cryptocurrencies
        
        When a user wants to perform a swap, gather the following information conversationally:
        - The token symbol they want to swap from (source token)
        - The network of the source token (if applicable)
        - The token symbol they want to swap to (destination token)
        - The network of the destination token (if applicable)
        - The amount they want to swap
        - The destination address where they want to receive the swapped tokens
        
        Ensure the following conditions are met:
        - Only accept token symbols that are supported by SideShift (we validate this automatically)
        - The minimum swap amount varies by token - we'll validate this through the API
        - Users must provide a valid destination address for the token they're receiving
        
        Always ensure you have all required fields (source token, destination token, amount, destination address) before proceeding.
        
        Validate the provided tokens against SideShift's supported list. If any token is invalid or not supported, inform the user and ask for clarification.
        
        Once you have all the required information, reorder and display it to the user in the following format for the next support bot to easily make a decision:
        'You want to swap [amount] [source token] to [destination token].
        
        Before we proceed, I just want to confirm the details:
        
        * Source Token: [source token]
        * Destination Token: [destination token]
        * Amount: [amount]
        * Destination Address: [destination address]'
        
        If any information is missing, ask the user conversationally for clarification (e.g., "Could you please specify which network you want to use for your USDT?").
        `;
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ["system", SYSTEM_TEMPLATE],
            new prompts_2.MessagesPlaceholder("messages"),
        ]);
        const response = yield prompt.pipe(model).invoke({ messages: state.messages });
        return {
            messages: [response]
        };
    }));
    /* @ts-ignore */
    graph.addEdge(langgraph_3.START, "initial_node");
    /* @ts-ignore */
    graph.addConditionalEdges("initial_node", (state) => __awaiter(this, void 0, void 0, function* () {
        const SYSTEM_TEMPLATE = `You are a support system for the LazySwap bot responsible for routing the conversation to either the pre-check node or continuing the conversation.
Your task is to discern whether the user has provided all the necessary information for a swap or if the conversation is still ongoing.`;
        const HUMAN_TEMPLATE = `Analyze the following user message:

{messages}

Extract the following information from the message if it is present:
1. Source token
2. Source chain
3. Destination token
4. Destination chain
5. Amount to swap

If all required information is present, respond with "PRECHECK".
If any information is missing or the bot is responding to questions, respond with "RESPOND".

Remember, only respond with one of the above words.`;
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ["system", SYSTEM_TEMPLATE],
            ["human", HUMAN_TEMPLATE],
        ]);
        const chain = prompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
        console.log(state.messages[state.messages.length - 1].content, "yo mfs this is the state what you gonna do");
        const rawCategorization = yield chain.invoke({ messages: state.messages[state.messages.length - 1].content });
        if (rawCategorization.includes("PRECHECK")) {
            console.log("precheck");
            return "precheck";
        }
        else {
            console.log("conversational");
            return "conversational";
        }
    }), {
        precheck: "precheck_node",
        conversational: langgraph_2.END,
    });
    graph.addNode("precheck_node", (state) => __awaiter(this, void 0, void 0, function* () {
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
        const result = yield chain.invoke({ input: message });
        console.log(result);
        // Parse the JSON result
        let parsedResult;
        try {
            parsedResult = JSON.parse(result);
            console.log(parsedResult);
        }
        catch (error) {
            console.log("Failed to parse JSON:", error);
            return {
                messages: [new messages_1.AIMessage("ERROR: There was an internal error please try again")]
            };
        }
        // Validate the parsed result using sideShiftValidation
        const validationResult = yield sideShiftValidation(parsedResult);
        console.log(validationResult);
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
            return {
                messages: [new messages_1.AIMessage("Tokens are available to swap on SideShift proceeding to generate quote")],
                swapValues: swapValues
            };
        }
        else {
            console.error("Validation failed:", validationResult);
            return {
                messages: [new messages_1.AIMessage(validationResult)]
            };
        }
    }));
    /* @ts-ignore */
    graph.addConditionalEdges("precheck_node", (state) => {
        // Check if swapValues exist and have all the necessary properties
        if (state.swapValues &&
            state.swapValues.sourceChain &&
            state.swapValues.sourceToken &&
            state.swapValues.destChain &&
            state.swapValues.destToken &&
            state.swapValues.amount) {
            console.log("Routing to getQuote_node");
            return "getQuote";
        }
        else {
            // If swap values are not complete, end the conversation
            console.log("Ending conversation");
            return "end";
        }
    }, {
        getQuote: "getQuote_node",
        end: langgraph_2.END
    });
    graph.addNode("getQuote_node", (state) => __awaiter(this, void 0, void 0, function* () {
        try {
            // First check permissions
            const permissions = yield sideShiftAPI.checkPermissions();
            if (!permissions.createShift) {
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
            console.log('Quote request:', quoteRequest);
            const quoteResponse = yield sideShiftAPI.requestQuote(quoteRequest);
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
            return {
                messages: [new messages_1.AIMessage(result)],
                quoteId: quoteResponse.id,
                quoteResponse: quoteResponse
            };
        }
        catch (error) {
            console.error('Quote error:', error);
            return {
                messages: [new messages_1.AIMessage("😕 Oops! There was an error getting your quote. This could be due to insufficient liquidity or unsupported trading pair. Please try again with different parameters.")],
            };
        }
    }));
    /* @ts-ignore */
    graph.addConditionalEdges("getQuote_node", (state) => {
        const lastMessage = state.messages[state.messages.length - 1].content;
        if (lastMessage.includes("Please enter your destination address to proceed with the swap.") && state.swapValues.destAddress) {
            console.log("Routing to generateDeposit_node");
            return "generateDeposit";
        }
        else if (lastMessage.includes("Sorry, there was an error processing your request.") || lastMessage.includes("Please try again with different parameters.")) {
            console.log("Ending conversation");
            return "end";
        }
        else {
            console.log("Destination address not found in response, ending conversation");
            return "end";
        }
    }, {
        generateDeposit: "generateDeposit_node",
        end: langgraph_2.END
    });
    /* @ts-ignore */
    graph.addNode("generateDeposit_node", (state) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Check if we have a quote ID for fixed shift
            if (!state.quoteId) {
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
            console.log('Fixed shift request:', fixedShiftRequest);
            const result = yield sideShiftAPI.createFixedShiftFromQuote(fixedShiftRequest);
            // Use the original quote amounts from state since SwapResponse doesn't have settleAmount
            const deposit = parseFloat(state.swapValues.amount);
            const receive = parseFloat(((_a = state.quoteResponse) === null || _a === void 0 ? void 0 : _a.settleAmount) || '0');
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
            console.log(resultMessage);
            return {
                messages: [new messages_1.AIMessage(resultMessage)],
                depositAddress: result.depositAddress,
                swapId: result.id,
            };
        }
        catch (error) {
            console.error('Fixed shift creation error:', error);
            return {
                messages: [new messages_1.AIMessage(`😕 Sorry, there was an error creating your swap. Please make sure you have provided a valid destination address: ${state.swapValues.destAddress}. The quote may have also expired - please try again.`)],
            };
        }
    }));
    /* @ts-ignore */
    graph.addEdge("generateDeposit_node", langgraph_2.END);
    return graph.compile();
}
;
nodegraph();
