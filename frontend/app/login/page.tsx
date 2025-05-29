"use client";

import { useState, FormEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { useRouter } from 'next/navigation';
import { AuthAPI, setToken } from '@/services/api';

export default function Login() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => { 
    e.preventDefault(); // Ensure default form submission is prevented
    setError('');
    setIsLoading(true);
    
    
    try {
      console.log('Attempting login with:', { email });
      const response = await AuthAPI.login(email, password);
      console.log('Login successful:', response);
      setToken(response.token);
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error details:', err);
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-black/20 p-10 backdrop-blur-sm shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-gray-400">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email" 
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-700 bg-black/30 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-700 bg-black/30 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-blue-500 py-3.5 font-medium text-white transition-all hover:bg-blue-600 active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
        <div className="mt-1.5 text-center">
          <p className="text-gray-400">
            Back to {' '}
            <Link href="/" className="text-blue-500 hover:underline">
              Home
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
} 