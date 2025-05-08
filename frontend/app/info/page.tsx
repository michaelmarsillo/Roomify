import Link from 'next/link';
import Footer from '@/components/Footer';

// TFSA annual limits data
const tfsaLimits = [
  { year: 2009, amount: 5000 },
  { year: 2010, amount: 5000 },
  { year: 2011, amount: 5000 },
  { year: 2012, amount: 5000 },
  { year: 2013, amount: 5500 },
  { year: 2014, amount: 5500 },
  { year: 2015, amount: 10000 },
  { year: 2016, amount: 5500 },
  { year: 2017, amount: 5500 },
  { year: 2018, amount: 5500 },
  { year: 2019, amount: 6000 },
  { year: 2020, amount: 6000 },
  { year: 2021, amount: 6000 },
  { year: 2022, amount: 6000 },
  { year: 2023, amount: 6500 },
  { year: 2024, amount: 7000 },
  { year: 2025, amount: 7000 },
];

export default function TFSAInfo() {
  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <header className="border-b border-gray-800 py-4 mb-8">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Roomify.</h1>
            <nav className="hidden md:flex space-x-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/info" className="text-white font-medium">TFSA Info</Link>
            </nav>
          </div>
          <div>
            <Link
              href="/"
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-4">Tax-Free Savings Account (TFSA)</h1>
            <p className="text-gray-300 text-lg">
              The Tax-Free Savings Account (TFSA) is a registered account that allows Canadians to earn investment income tax-free.
            </p>
          </div>
          
          {/* Key Facts */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Key Facts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-400/30 rounded-xl p-6 border border-blue-400">
                <h3 className="text-xl font-bold text-white mb-2">Eligibility</h3>
                <p className="text-gray-300">
                  Canadian residents 18 years or older with a valid Social Insurance Number (SIN) can open a TFSA.
                </p>
              </div>
              
              <div className="bg-blue-400/30 rounded-xl p-6 border border-blue-400">
                <h3 className="text-xl font-bold text-white mb-2">Tax Benefits</h3>
                <p className="text-gray-300">
                  Investment income earned in a TFSA is not taxed, including interest, dividends, and capital gains.
                </p>
              </div>
              
              <div className="bg-blue-400/30 rounded-xl p-6 border border-blue-400">
                <h3 className="text-xl font-bold text-white mb-2">Contribution Room</h3>
                <p className="text-gray-300">
                  Your contribution room accumulates starting from the year you turn 18 or 2009 (whichever is later).
                </p>
              </div>
              
              <div className="bg-blue-400/30 rounded-xl p-6 border border-blue-400">
                <h3 className="text-xl font-bold text-white mb-2">Withdrawals</h3>
                <p className="text-gray-300">
                  You can withdraw any amount at any time without tax penalties. Withdrawn amounts are added back to your contribution room in the following calendar year.
                </p>
              </div>
            </div>
          </div>
          
          {/* Annual Contribution Limits */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Annual Contribution Limits</h2>
            <div className="bg-black/30 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                      <th className="px-6 py-3 font-medium">Year</th>
                      <th className="px-6 py-3 font-medium">Annual Limit</th>
                      <th className="px-6 py-3 font-medium">Cumulative Total (Since 2009)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {tfsaLimits.map((limit, index) => {
                      const cumulativeTotal = tfsaLimits
                        .slice(0, index + 1)
                        .reduce((sum, item) => sum + item.amount, 0);
                        
                      return (
                        <tr key={limit.year} className="text-gray-300 hover:bg-gray-800/30">
                          <td className="px-6 py-3 font-medium">{limit.year}</td>
                          <td className="px-6 py-3">${limit.amount.toLocaleString()}</td>
                          <td className="px-6 py-3">${cumulativeTotal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Important Rules */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Important Rules</h2>
            <div className="bg-black/30 rounded-xl p-6 border border-gray-800 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Over-contributions</h3>
                <p className="text-gray-300">
                  Exceeding your contribution limit will result in a 1% penalty tax per month on the excess amount.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Unused Contribution Room</h3>
                <p className="text-gray-300">
                  Unused contribution room carries forward indefinitely to future years.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Withdrawals and Re-contributions</h3>
                <p className="text-gray-300">
                  When you withdraw funds, the withdrawn amount is added back to your contribution room, but only at the beginning of the following calendar year.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Multiple Accounts</h3>
                <p className="text-gray-300">
                  You can have multiple TFSA accounts, but your total contribution room across all accounts is still capped at the same amount dependant on the year you turned 18.
                </p>
              </div>
            </div>
          </div>
          
          {/* Tools */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Track Your TFSA</h2>
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-800/40 flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-300 mb-4 md:mb-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Try Roomify Today</h1>
                <p>
                  Track your contributions, withdrawals, and available room with my easy-to-use calculator.
                </p>
              </div>
              <Link 
                href="/dashboard" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
} 