"use client";

import { useState, FormEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { useRouter } from 'next/navigation';
import { AuthAPI, setToken } from '@/services/api';

export default function Signup() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [year18, setYear18] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter();
  
  // Generate year options from 1991 (first year someone could have turned 18 by 2009) to current year
  const currentYear = new Date().getFullYear()
  const yearOptions: number[] = []
  for (let year = 1991; year <= currentYear; year++) {
    yearOptions.push(year)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    
    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!year18) {
      setError('Please select the year you turned 18')
      return
    }
    
    setIsLoading(true)
    
    try {
      console.log('Attempting registration with:', { 
        email, 
        passwordLength: password.length,
        year18: parseInt(year18, 10)
      });
      
      const response = await AuthAPI.register(
        email, 
        password, 
        parseInt(year18, 10)
      )
      
      console.log('Registration successful, token received');
      setToken(response.token)
      
      // Redirect to dashboard after successful registration
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Registration error details:', err);
      
      if (err.message && err.message.includes('already exists')) {
        setError('This email is already registered. Please use a different email or try logging in.')
      } else if (err.message && err.message.includes('required')) {
        setError('Missing required information. Please fill out all fields.')
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center py-8">
      <div className="w-full max-w-md rounded-2xl bg-black/20 p-10 backdrop-blur-sm shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="mt-2 text-gray-400">Start tracking your TFSA contributions</p>
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
              minLength={6}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-700 bg-black/30 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-700 bg-black/30 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label htmlFor="year18" className="block text-sm font-medium text-gray-400 mb-1">
              Year You Turned 18
            </label>
            <select
              id="year18"
              value={year18}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setYear18(e.target.value)}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-700 bg-black/30 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select year</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              This helps us calculate your TFSA contribution room
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-blue-500 py-3.5 font-medium text-white transition-all hover:bg-blue-600 active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-500 hover:underline">
              Sign in
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