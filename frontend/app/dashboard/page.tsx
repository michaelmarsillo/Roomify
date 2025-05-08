"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { User, Transaction, TFSAAPI, AuthAPI, TFSAData, removeToken, getToken } from '@/services/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/services/api';

// Mock data for demo mode
const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@example.com',
  name: 'Demo User',
  year18: 2015
};

const DEMO_DATA: TFSAData = {
  contributionRoom: 40500,
  totalDeposits: 25000,
  totalWithdrawals: 8000,
  remainingRoom: 23500, // 40500 - 25000 + 8000 = 23500
  transactions: [
    {
      id: 'demo-1',
      type: 'Deposit',
      amount: 10000,
      date: new Date(2022, 1, 15).toISOString(),
      userId: 'demo-user'
    },
    {
      id: 'demo-2',
      type: 'Deposit',
      amount: 15000,
      date: new Date(2022, 5, 22).toISOString(),
      userId: 'demo-user'
    },
    {
      id: 'demo-3',
      type: 'Withdrawal',
      amount: 8000,
      date: new Date(2023, 2, 10).toISOString(),
      userId: 'demo-user'
    }
  ]
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [tfsaData, setTfsaData] = useState<TFSAData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'Deposit' | 'Withdrawal'>('Deposit');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Fetch user and TFSA data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Check if in demo mode
        const demoParam = searchParams?.get('demo');
        if (demoParam === 'true') {
          console.log('Loading demo data');
          setIsDemoMode(true);
          setUser(DEMO_USER);
          setTfsaData(DEMO_DATA);
          setIsLoading(false);
          return;
        }

        // Not in demo mode, check if user is authenticated
        const token = getToken();
        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/login');
          return;
        }
        
        // Get current user
        const userData = await AuthAPI.getCurrentUser();
        setUser(userData);
        
        // Get TFSA data
        const tfsaData = await TFSAAPI.getData();
        setTfsaData(tfsaData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Unable to load your data. Please try logging in again.');
        // Only redirect if not in demo mode
        if (!isDemoMode) {
          removeToken();
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [router, searchParams]);
  
  const handleLogout = () => {
    if (isDemoMode) {
      router.push('/');
      return;
    }
    
    AuthAPI.logout();
    router.push('/login');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isDemoMode) {
        // In demo mode, just update the local state with mock data
        const newAmount = Number(amount);
        const newTransaction = {
          id: `demo-${Date.now()}`,
          type: transactionType,
          amount: newAmount,
          date: new Date().toISOString(),
          userId: 'demo-user'
        };
        
        setTfsaData(prev => {
          if (!prev) return prev;
          
          const updatedData = { ...prev };

          
          if (transactionType === 'Deposit') {
            updatedData.totalDeposits += newAmount;
            // Update ONLY remaining room for deposits (subtract)
            updatedData.remainingRoom = updatedData.remainingRoom - newAmount;
          } else {
            updatedData.totalWithdrawals += newAmount;
            // Update ONLY remaining room for withdrawals (add)
            updatedData.remainingRoom = updatedData.remainingRoom + newAmount;
          }
          
          updatedData.transactions = [newTransaction, ...prev.transactions];
          return updatedData;
        });
        
        // Close modal and reset form
        setIsAddTransactionOpen(false);
        setAmount('');
        return;
      }
      
      // Real mode - add transaction via API
      await TFSAAPI.addTransaction(transactionType, Number(amount));
      
      // Refresh TFSA data
      const updatedTfsaData = await TFSAAPI.getData();
      setTfsaData(updatedTfsaData);
      
      // Close modal and reset form
      setIsAddTransactionOpen(false);
      setAmount('');
    } catch (err) {
      console.error('Error adding transaction:', err);
      alert('Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };


  // Add a function to delete transactions
  const deleteTransaction = async (transactionId: string) => {
    if (isDemoMode) {
      // In demo mode, just update local state
      setTfsaData(prev => {
        if (!prev) return prev;
        
        // Find the transaction to delete
        const transaction = prev.transactions.find(t => t.id === transactionId);
        if (!transaction) return prev;
        
        const updatedData = { ...prev };
        // Remove the transaction
        updatedData.transactions = prev.transactions.filter(t => t.id !== transactionId);
        
        // Update totals based on transaction type
        if (transaction.type === 'Deposit') {
          updatedData.totalDeposits -= transaction.amount;
          // Update remaining room (add back the deposit amount)
          updatedData.remainingRoom = updatedData.remainingRoom + transaction.amount;
        } else {
          updatedData.totalWithdrawals -= transaction.amount;
          // Update remaining room (subtract the withdrawal amount)
          updatedData.remainingRoom = updatedData.remainingRoom - transaction.amount;
        }
        
        return updatedData;
      });
      
      return;
    }
    
    
    try {
      const result = await TFSAAPI.deleteTransaction(transactionId);
      
      // Update the TFSA data with the values returned from the server
      setTfsaData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          contributionRoom: result.contributionRoom,  // This should never change
          totalDeposits: result.totalDeposits,
          totalWithdrawals: result.totalWithdrawals,
          remainingRoom: result.remainingRoom,
          transactions: prev.transactions.filter(t => t.id !== transactionId)
        };
      });
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your TFSA data...</p>
        </div>
      </div>
    );
  }

  if (error && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-black/30 rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-red-400 mb-4 text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Demo banner */}
      {isDemoMode && (
        <div className="bg-blue-500 rounded-lg text-white py-1.5 text-center">
          <div className="container mx-auto">
            <p>You are viewing the demo dashboard. <Link href="/signup" className="underline font-medium">Sign up</Link> to create your own TFSA tracker.</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="border-b border-gray-800 py-4 mb-8">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Roomify.</h1>
            <nav className="hidden md:flex space-x-5 ">
              <Link href="/dashboard" className="text-white font-medium">Dashboard</Link>
              <Link href="/info" className="text-gray-400 hover:text-white transition-colors">TFSA Info</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-gray-400 text-sm">
              Welcome, {user?.name || 'User'}
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              {isDemoMode ? 'Back to Home' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
            <h2 className="text-gray-400 text-sm font-medium mb-1">Total Contribution Room</h2>
            <p className="text-white text-2xl font-bold">
              {tfsaData ? formatCurrency(tfsaData.contributionRoom) : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Dependant on the year you turned 18</p>
          </div>
          
          <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
            <h2 className="text-gray-400 text-sm font-medium mb-1">Total Deposits</h2>
            <p className="text-white text-2xl font-bold">
              {tfsaData ? formatCurrency(tfsaData.totalDeposits) : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Reduces remaining room</p>
          </div>
          
          <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
            <h2 className="text-gray-400 text-sm font-medium mb-1">Total Withdrawals</h2>
            <p className="text-white text-2xl font-bold">
              {tfsaData ? formatCurrency(tfsaData.totalWithdrawals) : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Increases remaining room</p>
          </div>
          
          <div className="bg-blue-400/30 rounded-xl p-6 border border-blue-800/40">
            <h2 className="text-blue-300 text-sm font-medium mb-1">Remaining Room</h2>
            <p className="text-white text-2xl font-bold">
              {tfsaData ? formatCurrency(tfsaData.remainingRoom || 0) : '-'}
            </p>
            <p className="text-xs text-blue-300/70 mt-1">This changes with transactions</p>
          </div>
        </div>
        
        {/* Add Transaction Button */}
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setIsAddTransactionOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Transaction
          </button>
        </div>
        
        {/* Transactions Table */}
        <div className="bg-black/30 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Transaction History</h2>
          </div>
          {tfsaData && tfsaData.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tfsaData.transactions.map((transaction) => (
                    <tr key={transaction.id} className="text-gray-300 hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          transaction.type === 'Deposit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(transaction.date).toLocaleDateString('en-CA')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete transaction"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No transactions yet. Get started by adding your first deposit or withdrawal.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Transaction Modal */}
      {isAddTransactionOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add Transaction</h2>
              <button 
                onClick={() => setIsAddTransactionOpen(false)}
                className="text-gray-400 hover:text-white"
                disabled={isSubmitting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className={`px-4 py-3 rounded-lg border ${
                      transactionType === 'Deposit'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-black/30 border-gray-700 text-gray-400 hover:bg-black/50'
                    }`}
                    onClick={() => setTransactionType('Deposit')}
                    disabled={isSubmitting}
                  >
                    Deposit
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-3 rounded-lg border ${
                      transactionType === 'Withdrawal'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-black/30 border-gray-700 text-gray-400 hover:bg-black/50'
                    }`}
                    onClick={() => setTransactionType('Withdrawal')}
                    disabled={isSubmitting}
                  >
                    Withdrawal
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
                  Amount (CAD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-gray-700 bg-black/30 pl-8 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-blue-500 py-3.5 font-medium text-white transition-all hover:bg-blue-600 active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
} 