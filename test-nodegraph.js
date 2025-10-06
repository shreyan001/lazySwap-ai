const { execSync } = require('child_process');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Compile TypeScript and import nodegraph
let nodegraph;
try {
    // Try to compile and require the TypeScript file
    execSync('npx tsc nodegraph.ts --outDir ./temp --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck', { stdio: 'inherit' });
    nodegraph = require('./temp/nodegraph.js');
} catch (error) {
    console.error('Failed to compile TypeScript:', error.message);
    // Fallback to compiled version
    try {
        nodegraph = require('./dir/nodegraph.js');
    } catch (fallbackError) {
        console.error('Failed to load compiled version:', fallbackError.message);
        process.exit(1);
    }
}

console.log('🧠 Starting Nodegraph AI Tests...\n');

async function testBasicGreeting() {
    console.log('👋 Testing Basic Greeting...');
    try {
        const graph = nodegraph.default();
        const initialState = {
            messages: [new HumanMessage("Hi there!")]
        };
        
        console.log('📤 Input: "Hi there!"');
        
        const stream = await graph.stream(initialState);
        let lastResponse = '';
        let nodeCount = 0;
        
        for await (const value of stream) {
            nodeCount++;
            const [nodeName, output] = Object.entries(value)[0];
            console.log(`🔗 Node ${nodeCount}: ${nodeName}`);
            
            if (nodeName !== 'END' && output.messages && output.messages[0]) {
                lastResponse = output.messages[0].content;
            }
        }
        
        console.log('✅ Final Response:', lastResponse.substring(0, 200) + '...');
        console.log(`📊 Processed ${nodeCount} nodes\n`);
        
        return lastResponse.toLowerCase().includes('lazyswap') || lastResponse.toLowerCase().includes('welcome');
    } catch (error) {
        console.error('❌ Greeting Test Error:', error.message);
        return false;
    }
}

async function testSwapRequest() {
    console.log('🔄 Testing Swap Request...');
    try {
        const graph = nodegraph.default();
        const initialState = {
            messages: [new HumanMessage("I want to swap 0.1 BTC to ETH")]
        };
        
        console.log('📤 Input: "I want to swap 0.1 BTC to ETH"');
        
        const stream = await graph.stream(initialState);
        let lastResponse = '';
        let finalState = null;
        let nodeCount = 0;
        
        for await (const value of stream) {
            nodeCount++;
            const [nodeName, output] = Object.entries(value)[0];
            console.log(`🔗 Node ${nodeCount}: ${nodeName}`);
            
            if (nodeName !== 'END' && output.messages && output.messages[0]) {
                lastResponse = output.messages[0].content;
                finalState = output;
            }
        }
        
        console.log('✅ Final Response:', lastResponse.substring(0, 300) + '...');
        console.log('📊 Final State:', {
            hasSwapValues: !!finalState?.swapValues,
            swapValues: finalState?.swapValues,
            hasQuoteId: !!finalState?.quoteId
        });
        console.log(`📊 Processed ${nodeCount} nodes\n`);
        
        return lastResponse.includes('BTC') && lastResponse.includes('ETH');
    } catch (error) {
        console.error('❌ Swap Request Test Error:', error.message);
        return false;
    }
}

async function testCompleteSwapFlow() {
    console.log('🎯 Testing Complete Swap Flow...');
    try {
        const graph = nodegraph.default();
        
        // Step 1: Initial swap request
        console.log('📤 Step 1: "I want to swap 0.1 BTC to ETH"');
        let state = {
            messages: [new HumanMessage("I want to swap 0.1 BTC to ETH")]
        };
        
        let stream = await graph.stream(state);
        let currentState = null;
        
        for await (const value of stream) {
            const [nodeName, output] = Object.entries(value)[0];
            if (nodeName !== 'END') {
                currentState = output;
            }
        }
        
        if (!currentState) {
            console.log('❌ No state after first message');
            return false;
        }
        
        console.log('📊 After Step 1:', {
            messagesCount: currentState.messages?.length,
            hasSwapValues: !!currentState.swapValues
        });
        
        // Step 2: Provide destination address
        console.log('📤 Step 2: Adding destination address');
        currentState.messages.push(new HumanMessage("My ETH address is 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"));
        
        stream = await graph.stream(currentState);
        let finalResponse = '';
        
        for await (const value of stream) {
            const [nodeName, output] = Object.entries(value)[0];
            if (nodeName !== 'END' && output.messages && output.messages[0]) {
                finalResponse = output.messages[0].content;
                currentState = output;
            }
        }
        
        console.log('✅ Final Response:', finalResponse.substring(0, 300) + '...');
        console.log('📊 Final State:', {
            hasSwapValues: !!currentState?.swapValues,
            hasQuoteId: !!currentState?.quoteId,
            hasDepositAddress: !!currentState?.depositAddress
        });
        
        return finalResponse.includes('deposit') || finalResponse.includes('address') || finalResponse.includes('quote');
    } catch (error) {
        console.error('❌ Complete Flow Test Error:', error.message);
        return false;
    }
}

async function testInvalidSwapRequest() {
    console.log('❌ Testing Invalid Swap Request...');
    try {
        const graph = nodegraph.default();
        const initialState = {
            messages: [new HumanMessage("I want to swap INVALIDCOIN to ANOTHERFAKECOIN")]
        };
        
        console.log('📤 Input: "I want to swap INVALIDCOIN to ANOTHERFAKECOIN"');
        
        const stream = await graph.stream(initialState);
        let lastResponse = '';
        let nodeCount = 0;
        
        for await (const value of stream) {
            nodeCount++;
            const [nodeName, output] = Object.entries(value)[0];
            
            if (nodeName !== 'END' && output.messages && output.messages[0]) {
                lastResponse = output.messages[0].content;
            }
        }
        
        console.log('✅ Response:', lastResponse.substring(0, 200) + '...');
        console.log(`📊 Processed ${nodeCount} nodes\n`);
        
        return lastResponse.toLowerCase().includes('invalid') || 
               lastResponse.toLowerCase().includes('not found') ||
               lastResponse.toLowerCase().includes('supported');
    } catch (error) {
        console.error('❌ Invalid Request Test Error:', error.message);
        return false;
    }
}

async function testConversationalFlow() {
    console.log('💬 Testing Conversational Flow...');
    try {
        const graph = nodegraph.default();
        const initialState = {
            messages: [new HumanMessage("What tokens do you support?")]
        };
        
        console.log('📤 Input: "What tokens do you support?"');
        
        const stream = await graph.stream(initialState);
        let lastResponse = '';
        let nodeCount = 0;
        
        for await (const value of stream) {
            nodeCount++;
            const [nodeName, output] = Object.entries(value)[0];
            
            if (nodeName !== 'END' && output.messages && output.messages[0]) {
                lastResponse = output.messages[0].content;
            }
        }
        
        console.log('✅ Response:', lastResponse.substring(0, 300) + '...');
        console.log(`📊 Processed ${nodeCount} nodes\n`);
        
        return lastResponse.toLowerCase().includes('token') || 
               lastResponse.toLowerCase().includes('support') ||
               lastResponse.toLowerCase().includes('btc') ||
               lastResponse.toLowerCase().includes('eth');
    } catch (error) {
        console.error('❌ Conversational Test Error:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🎯 Environment Check:');
    console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');
    console.log('- SIDESHIFT_SECRET:', process.env.SIDESHIFT_SECRET ? 'Present' : 'Missing');
    console.log('- AFFILIATE_ID:', process.env.AFFILIATE_ID || 'Not set');
    console.log('');
    
    const tests = [
        { name: 'Basic Greeting', fn: testBasicGreeting },
        { name: 'Swap Request', fn: testSwapRequest },
        { name: 'Complete Swap Flow', fn: testCompleteSwapFlow },
        { name: 'Invalid Swap Request', fn: testInvalidSwapRequest },
        { name: 'Conversational Flow', fn: testConversationalFlow }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.error(`❌ ${test.name} failed with error:`, error.message);
            results.push({ name: test.name, passed: false });
        }
    }
    
    // Summary
    console.log('📋 Test Summary:');
    results.forEach(result => {
        console.log(`- ${result.name}: ${result.passed ? '✅ Pass' : '❌ Fail'}`);
    });
    
    const passedTests = results.filter(r => r.passed).length;
    console.log(`\n🎉 Overall: ${passedTests}/${results.length} tests passed`);
    
    if (passedTests >= 3) {
        console.log('✅ Nodegraph is working reasonably well!');
    } else {
        console.log('⚠️ Nodegraph needs improvements. Check the errors above.');
    }
    
    return results;
}

// Run the tests
runAllTests().catch(console.error);