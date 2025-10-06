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
exports.createSideShiftAPI = exports.SideShiftAPI = void 0;
const axios_1 = __importDefault(require("axios"));
class SideShiftAPI {
    constructor(privateKey) {
        this.baseURL = 'https://sideshift.ai/api/v2';
        this.graphqlURL = 'https://sideshift.ai/graphql';
        this.privateKey = privateKey;
    }
    // Check if user has permissions to use SideShift
    checkPermissions(userIP) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (userIP) {
                    headers['x-user-ip'] = userIP;
                }
                const response = yield axios_1.default.get(`${this.baseURL}/permissions`, {
                    headers
                });
                return response.data;
            }
            catch (error) {
                console.error('Error checking permissions:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to check permissions');
            }
        });
    }
    // Get user IP address
    getUserIP() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('https://api.ipify.org?format=json');
                return response.data.ip;
            }
            catch (error) {
                console.error('Failed to fetch user IP:', error);
                return '127.0.0.1'; // Fallback IP
            }
        });
    }
    // Get all available coins
    getCoins() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.baseURL}/coins`);
                return response.data;
            }
            catch (error) {
                console.error('Error fetching coins:', error);
                throw new Error('Failed to fetch available coins');
            }
        });
    }
    // Create a checkout for payment processing
    createCheckout(checkoutData, userIP) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const ip = userIP || (yield this.getUserIP());
                const response = yield axios_1.default.post(`${this.baseURL}/checkout`, checkoutData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-sideshift-secret': this.privateKey,
                        'x-user-ip': ip,
                    },
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating checkout:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to create checkout');
            }
        });
    }
    // Create a variable swap
    createVariableSwap(swapData, userIP) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const ip = userIP || (yield this.getUserIP());
                const response = yield axios_1.default.post(`${this.baseURL}/shifts/variable`, swapData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-sideshift-secret': this.privateKey,
                        'x-user-ip': ip,
                    },
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating variable swap:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to create swap');
            }
        });
    }
    // Create a fixed swap
    createFixedSwap(swapData, userIP) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const ip = userIP || (yield this.getUserIP());
                const response = yield axios_1.default.post(`${this.baseURL}/shifts/fixed`, swapData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-sideshift-secret': this.privateKey,
                        'x-user-ip': ip,
                    },
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating fixed swap:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to create fixed swap');
            }
        });
    }
    // Get swap status by ID
    getSwapStatus(swapId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.get(`${this.baseURL}/shifts/${swapId}`, {
                    headers: {
                        'x-sideshift-secret': this.privateKey,
                    },
                });
                return response.data;
            }
            catch (error) {
                console.error('Error fetching swap status:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to fetch swap status');
            }
        });
    }
    // Create webhook for payment notifications
    createWebhook(targetUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const mutation = `
        mutation {
          createHook(targetUrl: "${targetUrl}") {
            id
            createdAt
            updatedAt
            targetUrl
            enabled
          }
        }
      `;
                const response = yield axios_1.default.post(this.graphqlURL, { query: mutation }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-sideshift-secret': this.privateKey,
                    },
                });
                return response.data.data.createHook;
            }
            catch (error) {
                console.error('Error creating webhook:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to create webhook');
            }
        });
    }
    // Get quote for a swap (estimate)
    getQuote(fromCoin, toCoin, amount, fromNetwork, toNetwork) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const params = new URLSearchParams({
                    depositCoin: fromCoin,
                    settleCoin: toCoin,
                    depositAmount: amount,
                });
                if (fromNetwork)
                    params.append('depositNetwork', fromNetwork);
                if (toNetwork)
                    params.append('settleNetwork', toNetwork);
                const response = yield axios_1.default.get(`${this.baseURL}/quotes?${params.toString()}`);
                return response.data;
            }
            catch (error) {
                console.error('Error getting quote:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to get quote');
            }
        });
    }
    // Generate payment URL for checkout
    generatePaymentURL(checkoutId) {
        return `https://pay.sideshift.ai/checkout/${checkoutId}`;
    }
    // Validate webhook signature (implement based on SideShift documentation)
    validateWebhookSignature(payload, signature) {
        // Implementation depends on SideShift's webhook signature validation
        // This is a placeholder - check SideShift docs for actual implementation
        return true;
    }
    // Request a quote (step 1 of fixed shift process)
    requestQuote(quoteData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${this.baseURL}/quotes`, quoteData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-sideshift-secret': this.privateKey
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('Error requesting quote:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to request quote');
            }
        });
    }
    // Create fixed shift using quote ID (step 2 of fixed shift process)
    createFixedShiftFromQuote(shiftData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${this.baseURL}/shifts/fixed`, shiftData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-sideshift-secret': this.privateKey
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating fixed shift:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to create fixed shift');
            }
        });
    }
}
exports.SideShiftAPI = SideShiftAPI;
// Export a default instance factory
const createSideShiftAPI = (privateKey) => {
    return new SideShiftAPI(privateKey);
};
exports.createSideShiftAPI = createSideShiftAPI;
