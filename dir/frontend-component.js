'use client';
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
exports.default = VariableSwapPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function VariableSwapPage() {
    var _a, _b;
    const [coins, setCoins] = (0, react_1.useState)([]);
    const [fromCoin, setFromCoin] = (0, react_1.useState)('');
    const [toCoin, setToCoin] = (0, react_1.useState)('');
    const [settleAddress, setSettleAddress] = (0, react_1.useState)('');
    const [settleMemo, setSettleMemo] = (0, react_1.useState)('');
    const [refundAddress, setRefundAddress] = (0, react_1.useState)('');
    const [refundMemo, setRefundMemo] = (0, react_1.useState)('');
    const [affiliateId, setAffiliateId] = (0, react_1.useState)('WnsGRWBkq');
    const [depositNetwork, setDepositNetwork] = (0, react_1.useState)('');
    const [settleNetwork, setSettleNetwork] = (0, react_1.useState)('');
    const [externalId, setExternalId] = (0, react_1.useState)('');
    const [swapResult, setSwapResult] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchCoins = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/coins');
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                const data = yield response.json();
                setCoins(data);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch coins');
            }
        });
        fetchCoins();
    }, []);
    const getUserIP = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('https://api.ipify.org?format=json');
            const data = yield response.json();
            return data.ip;
        }
        catch (error) {
            console.error('Failed to fetch user IP:', error);
            return '127.0.0.1'; // Fallback IP
        }
    });
    const handleSwap = () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!fromCoin || !toCoin || !settleAddress || !affiliateId) {
            setError('Please fill in all required fields');
            return;
        }
        setLoading(true);
        setError(null);
        setSwapResult(null);
        const userIP = yield getUserIP();
        const requestBody = {
            settleAddress,
            affiliateId,
            depositCoin: fromCoin,
            settleCoin: toCoin,
        };
        // Add optional fields if they have values
        if (settleMemo)
            requestBody.settleMemo = settleMemo;
        if (refundAddress)
            requestBody.refundAddress = refundAddress;
        if (refundMemo)
            requestBody.refundMemo = refundMemo;
        if (depositNetwork)
            requestBody.depositNetwork = depositNetwork;
        if (settleNetwork)
            requestBody.settleNetwork = settleNetwork;
        if (externalId)
            requestBody.externalId = externalId;
        try {
            const response = yield fetch('/api/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(((_a = errorData.error) === null || _a === void 0 ? void 0 : _a.message) || `API error: ${response.status}`);
            }
            const data = yield response.json();
            setSwapResult(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create swap');
        }
        finally {
            setLoading(false);
        }
    });
    return ((0, jsx_runtime_1.jsxs)("div", { style: { maxWidth: '800px', margin: '0 auto', padding: '20px' }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px' }, children: "Create Variable Swap" }), (0, jsx_runtime_1.jsxs)("div", { style: { border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '24px' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }, children: "Swap Details" }), (0, jsx_runtime_1.jsx)("p", { style: { color: '#666', marginBottom: '16px' }, children: "Enter all details for your variable swap" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Deposit Coin" }), (0, jsx_runtime_1.jsxs)("select", { value: fromCoin, onChange: (e) => setFromCoin(e.target.value), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select coin" }), coins.filter(coin => !coin.fixedOnly).map((coin) => ((0, jsx_runtime_1.jsxs)("option", { value: coin.coin, children: [coin.coin, " - ", coin.name] }, coin.coin)))] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Settle Coin" }), (0, jsx_runtime_1.jsxs)("select", { value: toCoin, onChange: (e) => setToCoin(e.target.value), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select coin" }), coins.filter(coin => !coin.fixedOnly).map((coin) => ((0, jsx_runtime_1.jsxs)("option", { value: coin.coin, children: [coin.coin, " - ", coin.name] }, coin.coin)))] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Deposit Network (if required)" }), (0, jsx_runtime_1.jsxs)("select", { value: depositNetwork, onChange: (e) => setDepositNetwork(e.target.value), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select network" }), (_a = coins.find(coin => coin.coin === fromCoin)) === null || _a === void 0 ? void 0 : _a.networks.map((network) => ((0, jsx_runtime_1.jsx)("option", { value: network, children: network }, network)))] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Settle Network (if required)" }), (0, jsx_runtime_1.jsxs)("select", { value: settleNetwork, onChange: (e) => setSettleNetwork(e.target.value), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select network" }), (_b = coins.find(coin => coin.coin === toCoin)) === null || _b === void 0 ? void 0 : _b.networks.map((network) => ((0, jsx_runtime_1.jsx)("option", { value: network, children: network }, network)))] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Settle Address *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: settleAddress, onChange: (e) => setSettleAddress(e.target.value), placeholder: "Enter destination address", style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Settle Memo (optional)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: settleMemo, onChange: (e) => setSettleMemo(e.target.value), placeholder: "Enter memo if required", style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Refund Address (optional)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: refundAddress, onChange: (e) => setRefundAddress(e.target.value), placeholder: "Enter refund address", style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Refund Memo (optional)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: refundMemo, onChange: (e) => setRefundMemo(e.target.value), placeholder: "Enter refund memo", style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "Affiliate ID" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: affiliateId, onChange: (e) => setAffiliateId(e.target.value), placeholder: "Enter affiliate ID", style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', marginBottom: '4px', fontWeight: 'bold' }, children: "External ID (optional)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: externalId, onChange: (e) => setExternalId(e.target.value), placeholder: "Enter external ID", style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } })] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSwap, disabled: loading, style: {
                            width: '100%',
                            padding: '12px',
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }, children: loading ? 'Creating Swap...' : 'Create Variable Swap' })] }), error && ((0, jsx_runtime_1.jsx)("div", { style: { backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '16px' }, children: error })), swapResult && ((0, jsx_runtime_1.jsxs)("div", { style: { border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }, children: "Swap Created Successfully!" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'grid', gap: '8px' }, children: [(0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Swap ID:" }), " ", swapResult.id] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Deposit Address:" }), " ", swapResult.depositAddress] }), swapResult.depositMemo && (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Deposit Memo:" }), " ", swapResult.depositMemo] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Deposit Range:" }), " ", swapResult.depositMin, " - ", swapResult.depositMax, " ", swapResult.depositCoin] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Status:" }), " ", swapResult.status] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Expires At:" }), " ", new Date(swapResult.expiresAt).toLocaleString()] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Network Fee:" }), " ", swapResult.networkFeeUsd, " USD"] })] })] }))] }));
}
