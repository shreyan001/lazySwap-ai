const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// Simulate a Telegram message structure
function createTelegramMessage(text, chatId = 123456789, userId = 987654321) {
    return {
        message: {
            message_id: Math.floor(Math.random() * 10000),
            from: {
                id: userId,
                is_bot: false,
                first_name: "Test",
                username: "testuser"
            },
            chat: {
                id: chatId,
                first_name: "Test",
                username: "testuser",
                type: "private"
            },
            date: Math.floor(Date.now() / 1000),
            text: text
        }
    };
}

async function testBotConversation() {
    console.log('🤖 Testing Telegram Bot Conversation Flow\n');
    
    try {
        // Test 1: Greeting/Start Command
        console.log('📝 Test 1: Greeting Flow');
        console.log('Sending: /start');
        
        let response = await axios.post(`${BASE_URL}/webhook`, createTelegramMessage('/start'));
        console.log('✅ Response received for /start command\n');
        
        // Test 2: General greeting
        console.log('📝 Test 2: General Greeting');
        console.log('Sending: Hello');
        
        response = await axios.post(`${BASE_URL}/webhook`, createTelegramMessage('Hello'));
        console.log('✅ Response received for greeting\n');
        
        // Test 3: Swap request
        console.log('📝 Test 3: Swap Request');
        console.log('Sending: I want to swap 0.1 BTC to ETH');
        
        response = await axios.post(`${BASE_URL}/webhook`, createTelegramMessage('I want to swap 0.1 BTC to ETH'));
        console.log('✅ Response received for swap request\n');
        
        // Test 4: Valid address
        console.log('📝 Test 4: Valid Ethereum Address');
        console.log('Sending: 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87');
        
        response = await axios.post(`${BASE_URL}/webhook`, createTelegramMessage('0x742d35Cc6634C0532925a3b8D4C9db96590c6C87'));
        console.log('✅ Response received for valid address\n');
        
        // Test 5: Invalid address
        console.log('📝 Test 5: Invalid Address');
        console.log('Sending: invalid-address-123');
        
        response = await axios.post(`${BASE_URL}/webhook`, createTelegramMessage('invalid-address-123'));
        console.log('✅ Response received for invalid address\n');
        
        // Test 6: Another swap request (different tokens)
        console.log('📝 Test 6: Different Swap Request');
        console.log('Sending: convert 50 USDT to BTC');
        
        response = await axios.post(`${BASE_URL}/webhook`, createTelegramMessage('convert 50 USDT to BTC'));
        console.log('✅ Response received for different swap request\n');
        
        // Test 7: Bitcoin address
        console.log('📝 Test 7: Bitcoin Address');
        console.log('Sending: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
        
        response = await axios.post(`${BASE_URL}/webhook`, createTelegramMessage('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'));
        console.log('✅ Response received for Bitcoin address\n');
        
        console.log('🎉 All conversation flow tests completed successfully!');
        console.log('📊 The bot is responding to all message types without errors.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Test API endpoints
async function testAPIEndpoints() {
    console.log('\n🔌 Testing API Endpoints\n');
    
    try {
        // Test health endpoint
        console.log('📝 Testing /health endpoint');
        let response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check:', response.data);
        
        // Test coins endpoint
        console.log('📝 Testing /api/coins endpoint');
        response = await axios.get(`${BASE_URL}/api/coins`);
        console.log('✅ Coins endpoint working, returned', Object.keys(response.data).length, 'coins');
        
        console.log('🎉 All API endpoints working correctly!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Comprehensive Bot Testing\n');
    console.log('=' .repeat(50));
    
    await testAPIEndpoints();
    console.log('\n' + '=' .repeat(50));
    await testBotConversation();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✨ Testing Complete! Check the server logs for detailed responses.');
}

// Run the tests
runAllTests();