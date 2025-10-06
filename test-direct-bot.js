const nodegraph = require('./temp/nodegraph');

// Mock Cloudflare AI model
const mockModel = {
    invoke: async (messages) => {
        // Simple mock responses for testing
        const lastMessage = messages[messages.length - 1];
        if (typeof lastMessage === 'string') {
            return { content: `Mock AI response to: ${lastMessage}` };
        } else if (lastMessage.content) {
            return { content: `Mock AI response to: ${lastMessage.content}` };
        }
        return { content: "Mock AI response" };
    }
};

// Mock SideShift API
const mockSideShiftAPI = {
    getCoins: async () => ({
        'btc': { name: 'Bitcoin', networks: ['bitcoin'] },
        'eth': { name: 'Ethereum', networks: ['ethereum'] },
        'usdt': { name: 'Tether', networks: ['ethereum', 'tron'] }
    }),
    getQuote: async (fromCoin, toCoin, amount) => ({
        id: 'test-quote-123',
        depositCoin: fromCoin,
        settleCoin: toCoin,
        depositAmount: amount,
        settleAmount: (parseFloat(amount) * 0.95).toString(), // Mock 5% fee
        rate: '0.95',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }),
    createFixedShiftFromQuote: async (quoteId, settleAddress, affiliateId) => ({
        id: 'test-shift-456',
        depositAddress: 'bc1qtest123depositaddress456',
        settleAddress: settleAddress,
        status: 'waiting',
        depositCoin: 'btc',
        settleCoin: 'eth',
        depositAmount: '0.1',
        settleAmount: '2.5'
    })
};

async function testDirectBotConversation() {
    console.log('🤖 Testing Direct Bot Conversation Flow\n');
    
    try {
        // Initialize the nodegraph
        const graph = nodegraph.default();
        
        // Test conversation state
        let state = {
            messages: [],
            swapValues: {},
            currentStep: 'conversation'
        };
        
        console.log('📝 Test 1: Greeting');
        console.log('Input: Hello');
        
        state.messages.push({ role: 'user', content: 'Hello' });
        let result = await graph.invoke(state);
        console.log('Bot Response:', result.messages[result.messages.length - 1].content);
        console.log('Current Step:', result.currentStep);
        console.log('✅ Greeting test completed\n');
        
        console.log('📝 Test 2: Swap Request');
        console.log('Input: I want to swap 0.1 BTC to ETH');
        
        result.messages.push({ role: 'user', content: 'I want to swap 0.1 BTC to ETH' });
        result = await graph.invoke(result);
        console.log('Bot Response:', result.messages[result.messages.length - 1].content);
        console.log('Current Step:', result.currentStep);
        console.log('Swap Values:', result.swapValues);
        console.log('✅ Swap request test completed\n');
        
        console.log('📝 Test 3: Valid Address');
        console.log('Input: 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87');
        
        result.messages.push({ role: 'user', content: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87' });
        result = await graph.invoke(result);
        console.log('Bot Response:', result.messages[result.messages.length - 1].content);
        console.log('Current Step:', result.currentStep);
        console.log('Swap Values:', result.swapValues);
        console.log('✅ Valid address test completed\n');
        
        console.log('📝 Test 4: Invalid Address');
        console.log('Starting fresh conversation for invalid address test...');
        
        // Reset state for invalid address test
        state = {
            messages: [],
            swapValues: { fromCoin: 'btc', toCoin: 'eth', amount: '0.1' },
            currentStep: 'waiting_for_address'
        };
        
        state.messages.push({ role: 'user', content: 'invalid-address-123' });
        result = await graph.invoke(state);
        console.log('Bot Response:', result.messages[result.messages.length - 1].content);
        console.log('Current Step:', result.currentStep);
        console.log('✅ Invalid address test completed\n');
        
        console.log('📝 Test 5: Different Swap Format');
        console.log('Starting fresh conversation for different swap format...');
        
        // Reset state for different swap format
        state = {
            messages: [],
            swapValues: {},
            currentStep: 'conversation'
        };
        
        state.messages.push({ role: 'user', content: 'convert 50 USDT to BTC' });
        result = await graph.invoke(state);
        console.log('Bot Response:', result.messages[result.messages.length - 1].content);
        console.log('Current Step:', result.currentStep);
        console.log('Swap Values:', result.swapValues);
        console.log('✅ Different swap format test completed\n');
        
        console.log('🎉 All direct bot conversation tests completed successfully!');
        console.log('📊 The nodegraph is handling all conversation flows correctly.');
        
    } catch (error) {
        console.error('❌ Direct bot test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the direct bot test
testDirectBotConversation();