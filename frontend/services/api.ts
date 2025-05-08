// API base URL - adjust this to your backend URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://roomify-backend-w6i9.onrender.com';

// Type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  year18: number;
}

export interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  date: string;
  userId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TFSAData {
  contributionRoom: number;
  totalDeposits: number;
  totalWithdrawals: number;
  remainingRoom: number;
  transactions: Transaction[];
}

// Helper for localStorage token management
const TOKEN_KEY = 'tfsa_token';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error('Error getting token from localStorage:', e);
    return null;
  }
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('Token saved to localStorage');
  } catch (e) {
    console.error('Error setting token in localStorage:', e);
  }
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(TOKEN_KEY);
    console.log('Token removed from localStorage');
  } catch (e) {
    console.error('Error removing token from localStorage:', e);
  }
};

// Helper for authenticated requests
const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  } as Record<string, string>;
  
  // Only add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}/api${endpoint}`;
  console.log(`Making request to: ${url}`, { hasToken: !!token });
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Check if response is ok (status in the range 200-299)
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      // Only try to parse as JSON if the content type is JSON
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `API Error: ${response.status}`);
      } else {
        console.error('API Error Response (non-JSON):', await response.text());
        throw new Error(`API Error: ${response.status}`);
      }
    }
    
    // Attempt to parse response as JSON
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to parse response as JSON:', error);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);
    throw error;
  }
};

// Authentication API
export const AuthAPI = {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log(`Logging in user: ${email}`);
    return authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  async register(email: string, password: string, year18: number): Promise<AuthResponse> {
    console.log(`Registering user: ${email}`);
    return authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, yearTurned18: year18 }),
    });
  },
  
  async logout(): Promise<void> {
    removeToken();
  },
  
  async getCurrentUser(): Promise<User> {
    return authFetch('/auth/me');
  },
};

// TFSA Data API
export const TFSAAPI = {
  async getData(): Promise<TFSAData> {
    return authFetch('/tfsa');
  },
  
  async addTransaction(type: 'Deposit' | 'Withdrawal', amount: number): Promise<Transaction> {
    return authFetch('/tfsa/transactions', {
      method: 'POST',
      body: JSON.stringify({ 
        type: type.toLowerCase(), // Backend expects lowercase
        amount 
      }),
    });
  },
  
  async deleteTransaction(transactionId: string): Promise<{
    success: boolean;
    contributionRoom: number;
    totalDeposits: number;
    totalWithdrawals: number;
    remainingRoom: number;
    deletedTransaction: Transaction;
  }> {
    return authFetch(`/tfsa/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  },
  
  async getTransactions(): Promise<Transaction[]> {
    return authFetch('/tfsa/transactions');
  },
  

  async debugTransactions(): Promise<any> {
    return authFetch('/tfsa/debug/transactions');
  },
  
  // Fix contribution room calculations
  async fixRoom(): Promise<{
    success: boolean;
    fixedContributionRoom: number;
    totalDeposits: number;
    totalWithdrawals: number;
    remainingRoom: number;
  }> {
    return authFetch('/tfsa/fix-room', {
      method: 'POST'
    });
  }
}; 