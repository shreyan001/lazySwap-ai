import { SideShiftAPI, createSideShiftAPI } from './sideshift-api';
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import {  StateGraph } from "@langchain/langgraph";
import { END } from "@langchain/langgraph";
import { RunnableSequence } from "@langchain/core/runnables";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseMessage, AIMessage, HumanMessage} from "@langchain/core/messages";
import { START } from "@langchain/langgraph";
import {z} from "zod";
import { ChatGroq } from "@langchain/groq";

type lazyState = {
  messages: any[] | null,
  swapValues?: {
      sourceChain?: string | null,
      sourceToken?: string | null,
      destChain?: string | null,
      destToken?: string | null,
      amount?: string | null,
      destAddress?: string | null,
  }
}


const sideShiftAPI = createSideShiftAPI(process.env.SIDESHIFT_SECRET || '');


const model = new ChatGroq({
    modelName: "Llama3-8b-8192",
    temperature:0,
  apiKey: process.env.GROQ_API_KEY,
});
   
  const REKT = async ( ) => {
    // Example using SideShift API
    const coins = await sideShiftAPI.getCoins();
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

}

REKT();