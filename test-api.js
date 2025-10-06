const { SideShiftAPI } = require('./dir/sideshift-api.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🚀 Starting SideShift API Tests...\n');

// Initialize API with demo mode enabled for testing
const api = new SideShiftAPI(process.env.SIDESHIFT_SECRET || '', true);

async function testPermissions() {
    console.log('🔐 Testing Permissions...');
    try {
        const permissions = await api.checkPermissions('8.8.8.8');
        console.log('✅ Permissions Result:', permissions);
        return permissions.createShift;
    } catch (error) {
        console.error('❌ Permissions Error:', error.message);
        return false;
    }
}

async function testGetCoins() {
    console.log('\n💰 Testing Get Coins...');
    try {
        const coins = await api.getCoins();
        console.log('✅ Coins fetched successfully. Count:', coins.length);
        console.log('📋 Sample coins:', coins.slice(0, 5).map(c => ({ coin: c.coin, name: c.name })));
        return coins;
    } catch (error) {
        console.error('❌ Get Coins Error:', error.message);
        return [];
    }
}

async function testQuote() {
    console.log('\n💱 Testing Quote Request...');
    try {
        const quoteRequest = {
            depositCoin: 'BTC',
            settleCoin: 'ETH',
            depositAmount: '0.1',
            affiliateId: process.env.AFFILIATE_ID || ''
        };
        
        console.log('📤 Quote Request:', quoteRequest);
        const quote = await api.requestQuote(quoteRequest);
        console.log('✅ Quote Response:', {
            id: quote.id,
            rate: quote.rate,
            depositAmount: quote.depositAmount,
            settleAmount: quote.settleAmount,
            expiresAt: quote.expiresAt
        });
        return quote;
    } catch (error) {
        console.error('❌ Quote Error:', error.message);
        return null;
    }
}

async function testVariableSwap() {
    console.log('\n🔄 Testing Variable Swap...');
    try {
        const swapRequest = {
            depositCoin: 'BTC',
            settleCoin: 'ETH',
            settleAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Example ETH address
            affiliateId: process.env.AFFILIATE_ID || ''
        };
        
        console.log('📤 Variable Swap Request:', swapRequest);
        const swap = await api.createVariableSwap(swapRequest, '8.8.8.8');
        console.log('✅ Variable Swap Response:', {
            id: swap.id,
            depositAddress: swap.depositAddress,
            depositCoin: swap.depositCoin,
            settleCoin: swap.settleCoin,
            status: swap.status,
            depositMin: swap.depositMin,
            depositMax: swap.depositMax
        });
        return swap;
    } catch (error) {
        console.error('❌ Variable Swap Error:', error.message);
        return null;
    }
}

async function testFixedSwap(quoteId) {
    if (!quoteId) {
        console.log('\n🔒 Skipping Fixed Swap Test (no quote ID)');
        return null;
    }
    
    console.log('\n🔒 Testing Fixed Swap...');
    try {
        const fixedShiftRequest = {
            settleAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Example ETH address
            affiliateId: process.env.AFFILIATE_ID || '',
            quoteId: quoteId
        };
        
        console.log('📤 Fixed Swap Request:', fixedShiftRequest);
        const swap = await api.createFixedShiftFromQuote(fixedShiftRequest);
        console.log('✅ Fixed Swap Response:', {
            id: swap.id,
            depositAddress: swap.depositAddress,
            depositCoin: swap.depositCoin,
            settleCoin: swap.settleCoin,
            status: swap.status,
            expiresAt: swap.expiresAt
        });
        return swap;
    } catch (error) {
        console.error('❌ Fixed Swap Error:', error.message);
        return null;
    }
}

async function testSwapStatus(swapId) {
    if (!swapId) {
        console.log('\n📊 Skipping Swap Status Test (no swap ID)');
        return null;
    }
    
    console.log('\n📊 Testing Swap Status...');
    try {
        const status = await api.getSwapStatus(swapId);
        console.log('✅ Swap Status:', {
            id: status.id,
            status: status.status,
            depositCoin: status.depositCoin,
            settleCoin: status.settleCoin,
            createdAt: status.createdAt
        });
        return status;
    } catch (error) {
        console.error('❌ Swap Status Error:', error.message);
        return null;
    }
}

async function runAllTests() {
    console.log('🎯 Environment Check:');
    console.log('- SIDESHIFT_SECRET:', process.env.SIDESHIFT_SECRET ? 'Present' : 'Missing');
    console.log('- AFFILIATE_ID:', process.env.AFFILIATE_ID || 'Not set');
    console.log('- Demo Mode: Enabled\n');
    
    // Test 1: Permissions
    const hasPermissions = await testPermissions();
    
    // Test 2: Get Coins
    const coins = await testGetCoins();
    
    // Test 3: Quote
    const quote = await testQuote();
    
    // Test 4: Variable Swap
    const variableSwap = await testVariableSwap();
    
    // Test 5: Fixed Swap (if quote available)
    const fixedSwap = await testFixedSwap(quote?.id);
    
    // Test 6: Swap Status (if swap available)
    const swapStatus = await testSwapStatus(variableSwap?.id || fixedSwap?.id);
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('- Permissions:', hasPermissions ? '✅ Pass' : '❌ Fail');
    console.log('- Get Coins:', coins.length > 0 ? '✅ Pass' : '❌ Fail');
    console.log('- Quote:', quote ? '✅ Pass' : '❌ Fail');
    console.log('- Variable Swap:', variableSwap ? '✅ Pass' : '❌ Fail');
    console.log('- Fixed Swap:', fixedSwap ? '✅ Pass' : '❌ Fail');
    console.log('- Swap Status:', swapStatus ? '✅ Pass' : '❌ Fail');
    
    const passedTests = [hasPermissions, coins.length > 0, quote, variableSwap, fixedSwap, swapStatus].filter(Boolean).length;
    console.log(`\n🎉 Overall: ${passedTests}/6 tests passed`);
    
    if (passedTests >= 4) {
        console.log('✅ API is working well! Ready for nodegraph integration.');
    } else {
        console.log('⚠️ Some API issues detected. Check the errors above.');
    }
}

// Run the tests
runAllTests().catch(console.error);