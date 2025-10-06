const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🔍 LazySwap Integration Test - Investigating Server Utilization\n');

async function testServerEndpoints() {
    console.log('🌐 Testing Server Endpoints...');
    
    const baseUrls = [
        'http://localhost:3000',
        'http://localhost:4000',
        'http://localhost:5000'
    ];
    
    for (const baseUrl of baseUrls) {
        try {
            console.log(`\n📡 Testing ${baseUrl}:`);
            
            // Test health endpoint
            const healthResponse = await axios.get(`${baseUrl}/health`, { timeout: 2000 });
            console.log(`✅ Health: ${healthResponse.status} - ${healthResponse.data.status}`);
            
            // Test permissions endpoint
            const permissionsResponse = await axios.get(`${baseUrl}/api/permissions`, { timeout: 2000 });
            console.log(`✅ Permissions: ${permissionsResponse.status} - ${permissionsResponse.data.createShifts ? 'Enabled' : 'Disabled'}`);
            
            // Test coins endpoint
            const coinsResponse = await axios.get(`${baseUrl}/api/coins`, { timeout: 2000 });
            console.log(`✅ Coins: ${coinsResponse.status} - ${coinsResponse.data.length} coins available`);
            
        } catch (error) {
            console.log(`❌ ${baseUrl}: ${error.code || error.message}`);
        }
    }
}

async function testTelegramBotWebhook() {
    console.log('\n🤖 Testing Telegram Bot Webhook...');
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.log('❌ No TELEGRAM_BOT_TOKEN found in environment');
        return;
    }
    
    try {
        // Get bot info
        const botInfoResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
        console.log(`✅ Bot Info: @${botInfoResponse.data.result.username} (${botInfoResponse.data.result.first_name})`);
        
        // Get webhook info
        const webhookResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const webhookInfo = webhookResponse.data.result;
        
        console.log('📡 Webhook Status:');
        console.log(`- URL: ${webhookInfo.url || 'Not set (using polling)'}`);
        console.log(`- Has Custom Certificate: ${webhookInfo.has_custom_certificate}`);
        console.log(`- Pending Updates: ${webhookInfo.pending_update_count}`);
        console.log(`- Last Error: ${webhookInfo.last_error_message || 'None'}`);
        
    } catch (error) {
        console.log(`❌ Telegram API Error: ${error.response?.data?.description || error.message}`);
    }
}

async function simulateTelegramMessage() {
    console.log('\n💬 Simulating Telegram Message Processing...');
    
    // Test if we can simulate a message to the running server
    const testMessage = {
        update_id: 123456789,
        message: {
            message_id: 1,
            from: {
                id: 12345,
                is_bot: false,
                first_name: "Test",
                username: "testuser"
            },
            chat: {
                id: 12345,
                first_name: "Test",
                username: "testuser",
                type: "private"
            },
            date: Math.floor(Date.now() / 1000),
            text: "Hi there!"
        }
    };
    
    const baseUrls = ['http://localhost:3000', 'http://localhost:4000'];
    
    for (const baseUrl of baseUrls) {
        try {
            console.log(`\n📤 Sending test message to ${baseUrl}:`);
            
            // Try to send to webhook endpoint (if it exists)
            const webhookResponse = await axios.post(`${baseUrl}/webhook/telegram`, testMessage, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log(`✅ Webhook Response: ${webhookResponse.status}`);
            
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`ℹ️ No webhook endpoint at ${baseUrl}`);
            } else {
                console.log(`❌ Webhook Error: ${error.code || error.message}`);
            }
        }
    }
}

async function checkRunningProcesses() {
    console.log('\n🔍 Checking Running Node Processes...');
    
    try {
        const { execSync } = require('child_process');
        
        // Get detailed process information
        const processInfo = execSync(
            'Get-WmiObject Win32_Process | Where-Object {$_.Name -like "*node*" -and $_.CommandLine -like "*lazyswap*"} | Select-Object ProcessId, CommandLine | Format-Table -HideTableHeaders',
            { encoding: 'utf8', shell: 'powershell' }
        );
        
        console.log('📊 LazySwap-related Node processes:');
        console.log(processInfo || 'No LazySwap processes found');
        
    } catch (error) {
        console.log('❌ Error checking processes:', error.message);
    }
}

async function analyzeImplementations() {
    console.log('\n🔬 Analyzing Bot Implementations...');
    
    const fs = require('fs');
    const path = require('path');
    
    const files = [
        { name: 'server.ts', path: './server.ts' },
        { name: 'index.ts', path: './index.ts' },
        { name: 'nodegraph.ts', path: './nodegraph.ts' }
    ];
    
    for (const file of files) {
        try {
            if (fs.existsSync(file.path)) {
                const content = fs.readFileSync(file.path, 'utf8');
                
                console.log(`\n📄 ${file.name}:`);
                console.log(`- Lines: ${content.split('\n').length}`);
                console.log(`- Has bot.launch(): ${content.includes('bot.launch()') ? '✅' : '❌'}`);
                console.log(`- Has Telegraf import: ${content.includes('Telegraf') ? '✅' : '❌'}`);
                console.log(`- Has nodegraph import: ${content.includes('nodegraph') ? '✅' : '❌'}`);
                console.log(`- Has SideShift API: ${content.includes('SideShift') ? '✅' : '❌'}`);
                
                // Check for specific patterns
                if (content.includes('StateGraph')) {
                    console.log(`- Uses LangGraph: ✅`);
                }
                if (content.includes('express')) {
                    console.log(`- Express server: ✅`);
                }
                if (content.includes('session')) {
                    console.log(`- Session management: ✅`);
                }
            } else {
                console.log(`\n📄 ${file.name}: ❌ File not found`);
            }
        } catch (error) {
            console.log(`\n📄 ${file.name}: ❌ Error reading file - ${error.message}`);
        }
    }
}

async function runIntegrationTests() {
    console.log('🎯 Environment Check:');
    console.log('- TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Present' : 'Missing');
    console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');
    console.log('- SIDESHIFT_SECRET:', process.env.SIDESHIFT_SECRET ? 'Present' : 'Missing');
    console.log('');
    
    await checkRunningProcesses();
    await testServerEndpoints();
    await testTelegramBotWebhook();
    await simulateTelegramMessage();
    await analyzeImplementations();
    
    console.log('\n📋 Integration Test Summary:');
    console.log('✅ Server endpoint testing completed');
    console.log('✅ Telegram bot webhook analysis completed');
    console.log('✅ Implementation analysis completed');
    console.log('\n💡 Recommendations:');
    console.log('1. Check which server instance is actually handling Telegram messages');
    console.log('2. Verify if both server.ts and index.ts are meant to run simultaneously');
    console.log('3. Consider consolidating bot implementations to avoid conflicts');
    console.log('4. Ensure proper session isolation between different bot instances');
}

// Run the integration tests
runIntegrationTests().catch(console.error);