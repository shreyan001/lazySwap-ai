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

  constructor(privateKey: string) {
    this.privateKey = privateKey;
  }

  // Check if user has permissions to use SideShift
  async checkPermissions(userIP?: string): Promise<PermissionsResponse> {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (userIP) {
        headers['x-user-ip'] = userIP;
      }

      const response = await axios.get(`${this.baseURL}/permissions`, {
        headers
      });
      return response.data;
    } catch (error: any) {
      console.error('Error checking permissions:', error.response?.data || error.message);
      throw new Error('Failed to check permissions');
    }
  }

  // Get user IP address
  async getUserIP(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (error) {
      console.error('Failed to fetch user IP:', error);
      return '127.0.0.1'; // Fallback IP
    }
  }

  // Get all available coins
  async getCoins(): Promise<Coin[]> {
    try {
      const response: AxiosResponse<Coin[]> = await axios.get(`${this.baseURL}/coins`);
      return response.data;
    } catch (error) {
      console.error('Error fetching coins:', error);
      throw new Error('Failed to fetch available coins');
    }
  }

  // Create a checkout for payment processing
  async createCheckout(checkoutData: CheckoutRequest, userIP?: string): Promise<CheckoutResponse> {
    try {
      const ip = userIP || await this.getUserIP();
      
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
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating checkout:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create checkout');
    }
  }

  // Create a variable swap
  async createVariableSwap(swapData: SwapRequest, userIP?: string): Promise<SwapResponse> {
    try {
      const ip = userIP || await this.getUserIP();
      
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
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating variable swap:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create swap');
    }
  }

  // Create a fixed swap
  async createFixedSwap(swapData: SwapRequest & { depositAmount: string }, userIP?: string): Promise<SwapResponse> {
    try {
      const ip = userIP || await this.getUserIP();
      
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
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating fixed swap:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create fixed swap');
    }
  }

  // Get swap status by ID
  async getSwapStatus(swapId: string): Promise<SwapResponse> {
    try {
      const response: AxiosResponse<SwapResponse> = await axios.get(
        `${this.baseURL}/shifts/${swapId}`,
        {
          headers: {
            'x-sideshift-secret': this.privateKey,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching swap status:', error.response?.data || error.message);
      throw new Error('Failed to fetch swap status');
    }
  }

  // Create webhook for payment notifications
  async createWebhook(targetUrl: string): Promise<WebhookResponse> {
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

      return response.data.data.createHook;
    } catch (error: any) {
      console.error('Error creating webhook:', error.response?.data || error.message);
      throw new Error('Failed to create webhook');
    }
  }

  // Get quote for a swap (estimate)
  async getQuote(fromCoin: string, toCoin: string, amount: string, fromNetwork?: string, toNetwork?: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        depositCoin: fromCoin,
        settleCoin: toCoin,
        depositAmount: amount,
      });

      if (fromNetwork) params.append('depositNetwork', fromNetwork);
      if (toNetwork) params.append('settleNetwork', toNetwork);

      const response = await axios.get(`${this.baseURL}/quotes?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting quote:', error.response?.data || error.message);
      throw new Error('Failed to get quote');
    }
  }

  // Generate payment URL for checkout
  generatePaymentURL(checkoutId: string): string {
    return `https://pay.sideshift.ai/checkout/${checkoutId}`;
  }

  // Validate webhook signature (implement based on SideShift documentation)
  validateWebhookSignature(payload: string, signature: string): boolean {
    // Implementation depends on SideShift's webhook signature validation
    // This is a placeholder - check SideShift docs for actual implementation
    return true;
  }
  // Request a quote (step 1 of fixed shift process)
  async requestQuote(quoteData: QuoteRequest): Promise<QuoteResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/quotes`, quoteData, {
        headers: {
          'Content-Type': 'application/json',
          'x-sideshift-secret': this.privateKey
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error requesting quote:', error.response?.data || error.message);
      throw new Error('Failed to request quote');
    }
  }

  // Create fixed shift using quote ID (step 2 of fixed shift process)
  async createFixedShiftFromQuote(shiftData: FixedShiftRequest): Promise<SwapResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/shifts/fixed`, shiftData, {
        headers: {
          'Content-Type': 'application/json',
          'x-sideshift-secret': this.privateKey
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating fixed shift:', error.response?.data || error.message);
      throw new Error('Failed to create fixed shift');
    }
  }
}

// Export a default instance factory
export const createSideShiftAPI = (privateKey: string): SideShiftAPI => {
  return new SideShiftAPI(privateKey);
};