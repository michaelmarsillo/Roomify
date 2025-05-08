import Link from 'next/link'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-black/20 p-10 backdrop-blur-sm shadow-xl">
        <div className="mb-10 text-center">
          <h1 className="text-6xl font-extrabold text-white tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Roomify</span>
            <span className="text-white">.</span>
          </h1>
          <h3 className="text-xl mt-3 font-medium text-gray-300">A TFSA Calculator</h3>
          <div className="flex justify-center gap-2 mt-4">
            <span className="px-3 py-1 bg-black/30 rounded-full text-sm text-gray-300">Simple</span>
            <span className="px-3 py-1 bg-black/30 rounded-full text-sm text-gray-300">Secure</span>
            <span className="px-3 py-1 bg-black/30 rounded-full text-sm text-gray-300">Smart</span>
          </div>
        </div>
        
        <div className="space-y-5">
          <Link 
            href="/login"
            className="flex w-full justify-center rounded-full bg-blue-500 py-3.5 font-medium text-white transition-all hover:bg-blue-600 active:scale-98"
          >
            Log In
          </Link>
          
          <Link 
            href="/signup"
            className="flex w-full justify-center rounded-full border border-gray-700 bg-transparent py-3.5 font-medium text-white transition-all hover:bg-white/5 active:scale-98"
          >
            Create Account
          </Link>
          
          <Link 
            href="/dashboard?demo=true"
            className="flex w-full justify-center rounded-full bg-gray-800/70 py-3 font-medium text-gray-300 text-sm transition-all hover:bg-gray-700 active:scale-98 mt-2"
          >
            View Demo Dashboard
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Track your TFSA contribution room effortlessly
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
} 