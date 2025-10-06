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
Object.defineProperty(exports, "__esModule", { value: true });
const sideshift_api_1 = require("./sideshift-api");
const groq_1 = require("@langchain/groq");
const sideShiftAPI = (0, sideshift_api_1.createSideShiftAPI)(process.env.SIDESHIFT_SECRET || '');
const model = new groq_1.ChatGroq({
    modelName: "Llama3-8b-8192",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
});
const REKT = () => __awaiter(void 0, void 0, void 0, function* () {
    // Example using SideShift API
    const coins = yield sideShiftAPI.getCoins();
    console.log('Available coins:', coins);
    // Create a variable swap
    const swapRequest = {
        settleAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        affiliateId: 'WnsGRWBkq',
        depositCoin: 'eth',
        settleCoin: 'usdt',
    };
    //     const response = await swapSDK.getQuote(quoteRequest);
    // const parsedResult = JSON.stringify(response, null, 2);
    // console.log(response);
});
REKT();
