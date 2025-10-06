import axios, { AxiosResponse } from 'axios';

// Types based on SideShift API documentation
export interface Coin {
  coin: string;
  name: string;
  networks: string[];
  hasMemo: boolean;
  fixedOnly: boolean;
  variableOnly: boolean;
  tokenDetails?: {
    contractAddress: string;
    decimals: number;
  };
}

export interface CheckoutRequest {
  settleCoin: string;
  settleNetwork: string;
  settleAmount: string;
  settleAddress: string;
  settleMemo?: string;
  affiliateId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponse {
  id: string;
  settleCoin: string;
  settleNetwork: string;
  settleAddress: string;
  settleAmount: string;
  affiliateId: string;
  successUrl: string;
  cancelUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface SwapRequest {
  settleAddress: string;
  depositCoin: string;
  settleCoin: string;
  affiliateId: string;
  settleMemo?: string;
  refundAddress?: string;
  refundMemo?: string;
  depositNetwork?: string;
  settleNetwork?: string;
  externalId?: string;
}

export interface SwapResponse {
  id: string;
  createdAt: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  depositAddress: string;
  depositMemo?: string;
  settleAddress: string;
  settleMemo?: string;
  depositMin: string;
  depositMax: string;
  refundAddress?: string;
  refundMemo?: string;
  type: string;
  expiresAt: string;
  status: string;
  averageShiftSeconds: string;
  externalId?: string;
  settleCoinNetworkFee: string;
  networkFeeUsd: string;
}

export interface WebhookRequest {
  targetUrl: string;
}

export interface WebhookResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  targetUrl: string;
  enabled: boolean;
}

export interface QuoteRequest {
  depositCoin: string;
  depositNetwork?: string;
  settleCoin: string;
  settleNetwork?: string;
  depositAmount?: string;
  settleAmount?: string;
  affiliateId: string;
}

export interface QuoteResponse {
  id: string;
  createdAt: string;
  depositCoin: string;
  depositNetwork: string;
  settleCoin: string;
  settleNetwork: string;
  depositAmount: string;
  settleAmount: string;
  rate: string;
  expiresAt: string;
  affiliateId: string;
}

export interface FixedShiftRequest {
  settleAddress: string;
  affiliateId: string;
  quoteId: string;
  settleMemo?: string;
  refundAddress?: string;
  refundMemo?: string;
}

export interface PermissionsResponse {
  createShift: boolean;
  reasons?: string[];
}

export class SideShiftAPI {
  private baseURL = 'https://sideshift.ai/api/v2';
  private graphqlURL = 'https://sideshift.ai/graphql';
  private privateKey: string;
  private demoMode: boolean;

  constructor(privateKey: string, demoMode: boolean = false) {
    console.log("🔧 SIDESHIFT_API - Initializing SideShift API client");
    this.privateKey = privateKey;
    this.demoMode = demoMode;
    console.log("✅ SIDESHIFT_API - API client initialized with private key:", privateKey ? "Present" : "Missing");
    console.log("🎭 SIDESHIFT_API - Demo mode:", demoMode ? "Enabled" : "Disabled");
  }

  // Check if user has permissions to use SideShift
  async checkPermissions(userIP?: string): Promise<PermissionsResponse> {
    console.log("🔐 SIDESHIFT_API - Checking permissions for IP:", userIP || "Not provided");
    
    // Demo mode - return mock permissions
    if (this.demoMode) {
      console.log("🎭 SIDESHIFT_API - Demo mode: Returning mock permissions");
      return {
        createShift: true,
        reasons: []
      };
    }
    
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (userIP) {
        headers['x-user-ip'] = userIP;
      }

      console.log("📡 SIDESHIFT_API - Making permissions request to:", `${this.baseURL}/permissions`);
      const response = await axios.get(`${this.baseURL}/permissions`, {
        headers
      });
      
      console.log("✅ SIDESHIFT_API - Permissions response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error checking permissions:', error.response?.data || error.message);
      throw new Error('Failed to check permissions');
    }
  }

  // Get user IP address
  async getUserIP(): Promise<string> {
    console.log("🌐 SIDESHIFT_API - Fetching user IP address...");
    
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      console.log("✅ SIDESHIFT_API - User IP fetched:", response.data.ip);
      return response.data.ip;
    } catch (error) {
      console.error('❌ SIDESHIFT_API - Failed to fetch user IP:', error);
      console.log("🔄 SIDESHIFT_API - Using fallback IP: 127.0.0.1");
      return '127.0.0.1'; // Fallback IP
    }
  }

  // Get all available coins
  async getCoins(): Promise<Coin[]> {
    console.log("💰 SIDESHIFT_API - Fetching available coins...");
    
    try {
      console.log("📡 SIDESHIFT_API - Making coins request to:", `${this.baseURL}/coins`);
      const response: AxiosResponse<Coin[]> = await axios.get(`${this.baseURL}/coins`);
      console.log("✅ SIDESHIFT_API - Coins fetched successfully, count:", response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ SIDESHIFT_API - Error fetching coins:', error);
      throw new Error('Failed to fetch available coins');
    }
  }

  // Create a checkout for payment processing
  async createCheckout(checkoutData: CheckoutRequest, userIP?: string): Promise<CheckoutResponse> {
    console.log("🛒 SIDESHIFT_API - Creating checkout with data:", {
      settleCoin: checkoutData.settleCoin,
      settleAmount: checkoutData.settleAmount,
      settleAddress: checkoutData.settleAddress.substring(0, 10) + "...",
      affiliateId: checkoutData.affiliateId
    });
    
    try {
      const ip = userIP || await this.getUserIP();
      console.log("🌐 SIDESHIFT_API - Using IP for checkout:", ip);
      
      console.log("📡 SIDESHIFT_API - Making checkout request to:", `${this.baseURL}/checkout`);
      const response: AxiosResponse<CheckoutResponse> = await axios.post(
        `${this.baseURL}/checkout`,
        checkoutData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-sideshift-secret': this.privateKey,
            'x-user-ip': ip,
          },
        }
      );
      
      console.log("✅ SIDESHIFT_API - Checkout created successfully:", {
        id: response.data.id,
        settleCoin: response.data.settleCoin,
        settleAmount: response.data.settleAmount
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error creating checkout:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create checkout');
    }
  }

  // Create a variable swap
  async createVariableSwap(swapData: SwapRequest, userIP?: string): Promise<SwapResponse> {
    console.log("🔄 SIDESHIFT_API - Creating variable swap with data:", {
      depositCoin: swapData.depositCoin,
      settleCoin: swapData.settleCoin,
      settleAddress: swapData.settleAddress ? swapData.settleAddress.substring(0, 10) + "..." : "undefined",
      affiliateId: swapData.affiliateId
    });
    
    // Demo mode - return mock swap response
      if (this.demoMode) {
        console.log("🎭 SIDESHIFT_API - Demo mode: Returning mock variable swap");
        const mockSwap: SwapResponse = {
          id: `demo-swap-${Date.now()}`,
          createdAt: new Date().toISOString(),
          depositCoin: swapData.depositCoin,
          settleCoin: swapData.settleCoin,
          depositNetwork: "mainnet",
          settleNetwork: "mainnet",
          depositAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // Mock BTC address
          settleAddress: swapData.settleAddress,
          depositMin: "0.001",
          depositMax: "10",
          type: "variable",
          status: "waiting",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          averageShiftSeconds: "300",
          settleCoinNetworkFee: "0.0001",
          networkFeeUsd: "2.50"
        };
        console.log("✅ SIDESHIFT_API - Mock variable swap created:", {
          id: mockSwap.id,
          depositAddress: mockSwap.depositAddress,
          status: mockSwap.status
        });
        return mockSwap;
      }
    
    try {
      const ip = userIP || await this.getUserIP();
      console.log("🌐 SIDESHIFT_API - Using IP for variable swap:", ip);
      
      console.log("📡 SIDESHIFT_API - Making variable swap request to:", `${this.baseURL}/shifts/variable`);
      const response: AxiosResponse<SwapResponse> = await axios.post(
        `${this.baseURL}/shifts/variable`,
        swapData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-sideshift-secret': this.privateKey,
            'x-user-ip': ip,
          },
        }
      );
      
      console.log("✅ SIDESHIFT_API - Variable swap created successfully:", {
        id: response.data.id,
        depositAddress: response.data.depositAddress,
        status: response.data.status
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error creating variable swap:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create swap');
    }
  }

  // Create a fixed swap
  async createFixedSwap(swapData: SwapRequest & { depositAmount: string }, userIP?: string): Promise<SwapResponse> {
    console.log("🔒 SIDESHIFT_API - Creating fixed swap with data:", {
      depositCoin: swapData.depositCoin,
      settleCoin: swapData.settleCoin,
      depositAmount: swapData.depositAmount,
      settleAddress: swapData.settleAddress.substring(0, 10) + "...",
      affiliateId: swapData.affiliateId
    });
    
    try {
      const ip = userIP || await this.getUserIP();
      console.log("🌐 SIDESHIFT_API - Using IP for fixed swap:", ip);
      
      console.log("📡 SIDESHIFT_API - Making fixed swap request to:", `${this.baseURL}/shifts/fixed`);
      const response: AxiosResponse<SwapResponse> = await axios.post(
        `${this.baseURL}/shifts/fixed`,
        swapData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-sideshift-secret': this.privateKey,
            'x-user-ip': ip,
          },
        }
      );
      
      console.log("✅ SIDESHIFT_API - Fixed swap created successfully:", {
        id: response.data.id,
        depositAddress: response.data.depositAddress,
        status: response.data.status,
        expiresAt: response.data.expiresAt
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error creating fixed swap:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create fixed swap');
    }
  }

  // Get swap status by ID
  async getSwapStatus(swapId: string): Promise<SwapResponse> {
    console.log("📊 SIDESHIFT_API - Fetching swap status for ID:", swapId);
    
    try {
      console.log("📡 SIDESHIFT_API - Making swap status request to:", `${this.baseURL}/shifts/${swapId}`);
      const response: AxiosResponse<SwapResponse> = await axios.get(
        `${this.baseURL}/shifts/${swapId}`,
        {
          headers: {
            'x-sideshift-secret': this.privateKey,
          },
        }
      );
      
      console.log("✅ SIDESHIFT_API - Swap status fetched:", {
        id: response.data.id,
        status: response.data.status,
        depositCoin: response.data.depositCoin,
        settleCoin: response.data.settleCoin
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error fetching swap status:', error.response?.data || error.message);
      throw new Error('Failed to fetch swap status');
    }
  }

  // Create webhook for payment notifications
  async createWebhook(targetUrl: string): Promise<WebhookResponse> {
    console.log("🪝 SIDESHIFT_API - Creating webhook for URL:", targetUrl);
    
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

      console.log("📡 SIDESHIFT_API - Making webhook request to:", this.graphqlURL);
      const response: AxiosResponse<{ data: { createHook: WebhookResponse } }> = await axios.post(
        this.graphqlURL,
        { query: mutation },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-sideshift-secret': this.privateKey,
          },
        }
      );

      console.log("✅ SIDESHIFT_API - Webhook created successfully:", {
        id: response.data.data.createHook.id,
        targetUrl: response.data.data.createHook.targetUrl,
        enabled: response.data.data.createHook.enabled
      });
      return response.data.data.createHook;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error creating webhook:', error.response?.data || error.message);
      throw new Error('Failed to create webhook');
    }
  }

  // Get quote for a swap (estimate)
  async getQuote(fromCoin: string, toCoin: string, amount: string, fromNetwork?: string, toNetwork?: string): Promise<any> {
    console.log("💱 SIDESHIFT_API - Getting quote:", {
      fromCoin,
      toCoin,
      amount,
      fromNetwork,
      toNetwork
    });
    
    try {
      const params = new URLSearchParams({
        depositCoin: fromCoin,
        settleCoin: toCoin,
        depositAmount: amount,
      });

      if (fromNetwork) params.append('depositNetwork', fromNetwork);
      if (toNetwork) params.append('settleNetwork', toNetwork);

      const url = `${this.baseURL}/quotes?${params.toString()}`;
      console.log("📡 SIDESHIFT_API - Making quote request to:", url);
      
      const response = await axios.get(url);
      console.log("✅ SIDESHIFT_API - Quote fetched successfully:", {
        rate: response.data.rate,
        depositAmount: response.data.depositAmount,
        settleAmount: response.data.settleAmount
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error getting quote:', error.response?.data || error.message);
      throw new Error('Failed to get quote');
    }
  }

  // Generate payment URL for checkout
  generatePaymentURL(checkoutId: string): string {
    const url = `https://pay.sideshift.ai/checkout/${checkoutId}`;
    console.log("🔗 SIDESHIFT_API - Generated payment URL:", url);
    return url;
  }

  // Validate webhook signature (implement based on SideShift documentation)
  validateWebhookSignature(payload: string, signature: string): boolean {
    console.log("🔐 SIDESHIFT_API - Validating webhook signature for payload length:", payload.length);
    // Implementation depends on SideShift's webhook signature validation
    // This is a placeholder - check SideShift docs for actual implementation
    console.log("⚠️ SIDESHIFT_API - Webhook signature validation not implemented, returning true");
    return true;
  }
  
  // Request a quote (step 1 of fixed shift process)
  async requestQuote(quoteData: QuoteRequest): Promise<QuoteResponse> {
    console.log("💰 SIDESHIFT_API - Requesting quote with data:", {
      depositCoin: quoteData.depositCoin,
      settleCoin: quoteData.settleCoin,
      depositAmount: quoteData.depositAmount,
      settleAmount: quoteData.settleAmount,
      affiliateId: quoteData.affiliateId
    });
    
    try {
      console.log("📡 SIDESHIFT_API - Making quote request to:", `${this.baseURL}/quotes`);
      const response = await axios.post(`${this.baseURL}/quotes`, quoteData, {
        headers: {
          'Content-Type': 'application/json',
          'x-sideshift-secret': this.privateKey
        }
      });
      
      console.log("✅ SIDESHIFT_API - Quote requested successfully:", {
        id: response.data.id,
        rate: response.data.rate,
        depositAmount: response.data.depositAmount,
        settleAmount: response.data.settleAmount,
        expiresAt: response.data.expiresAt
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error requesting quote:', error.response?.data || error.message);
      throw new Error('Failed to request quote');
    }
  }

  // Create fixed shift using quote ID (step 2 of fixed shift process)
  async createFixedShiftFromQuote(shiftData: FixedShiftRequest): Promise<SwapResponse> {
    console.log("🔒 SIDESHIFT_API - Creating fixed shift from quote:", {
      quoteId: shiftData.quoteId,
      settleAddress: shiftData.settleAddress.substring(0, 10) + "...",
      affiliateId: shiftData.affiliateId
    });
    
    try {
      console.log("📡 SIDESHIFT_API - Making fixed shift request to:", `${this.baseURL}/shifts/fixed`);
      const response = await axios.post(`${this.baseURL}/shifts/fixed`, shiftData, {
        headers: {
          'Content-Type': 'application/json',
          'x-sideshift-secret': this.privateKey
        }
      });
      
      console.log("✅ SIDESHIFT_API - Fixed shift created from quote successfully:", {
        id: response.data.id,
        depositAddress: response.data.depositAddress,
        status: response.data.status,
        expiresAt: response.data.expiresAt
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ SIDESHIFT_API - Error creating fixed shift:', error.response?.data || error.message);
      throw new Error('Failed to create fixed shift');
    }
  }
}

// Export a default instance factory
export const createSideShiftAPI = (privateKey: string): SideShiftAPI => {
  console.log("🏭 SIDESHIFT_API - Creating SideShift API instance");
  return new SideShiftAPI(privateKey);
};