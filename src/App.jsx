// src/App.jsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import LeagueTable from './components/LeagueTable'
import PrizeDistribution from './components/PrizeDistribution'
import MonthlyPrizes from './components/MonthlyPrizes'
import WeeklyPrizes from './components/WeeklyPrizes'
import Footer from './components/Footer'
import fplApi from './services/fplApi'

function App() {
  const [standings, setStandings] = useState([])
  const [gameweekInfo, setGameweekInfo] = useState({ current: 15, total: 38 })
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('standings')
  const [authStatus, setAuthStatus] = useState({ authenticated: false, message: '' })
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    loadRealData()
  }, [])

  const loadRealData = async () => {
    setLoading(true)
    try {
      console.log('🚀 Loading real FPL data for BRO League 4.0...')
      console.log('🔗 Current URL:', window.location.href)
      console.log('🌐 Environment:', import.meta.env.MODE)
      
      const result = await fplApi.initializeWithAuth()
      
      console.log('📊 API Result:', result)
      
      // Update authentication status
      setAuthStatus({
        authenticated: result.authenticated,
        message: result.authenticated ? 'Connected to FPL API' : 'Using offline data'
      })

      // Update gameweek info from bootstrap data
      if (result.bootstrap) {
        setGameweekInfo({
          current: result.bootstrap.currentGameweek || 15,
          total: result.bootstrap.totalGameweeks || 38,
          status: 'active'
        })
      }

      // Update standings - only use real API data, no demo data
      if (result.standings && result.standings.length > 0) {
        setStandings(result.standings)
        console.log(`✅ Loaded ${result.standings.length} managers from FPL API`)
      } else {
        console.log('⚠️ No standings data available from API')
        setStandings([]) // Clear any existing data
      }

      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('❌ Error loading FPL data:', error)
      setAuthStatus({
        authenticated: false,
        message: 'Failed to connect to FPL API'
      })
      setStandings([]) // Clear data on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header 
        onRefresh={loadRealData} 
        authStatus={authStatus}
        loading={loading}
      />
      
      <Hero 
        standings={standings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 flex gap-1">
            <button 
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${currentTab === 'standings' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
              onClick={() => setCurrentTab('standings')}
            >
              🏆 Standings
            </button>
            <button 
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${currentTab === 'prizes' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
              onClick={() => setCurrentTab('prizes')}
            >
              💰 Prizes
            </button>
            <button 
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${currentTab === 'monthly' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
              onClick={() => setCurrentTab('monthly')}
            >
              📅 Monthly
            </button>
            <button 
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${currentTab === 'weekly' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
              onClick={() => setCurrentTab('weekly')}
            >
              ⚡ Weekly
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {currentTab === 'standings' && (
          <LeagueTable 
            standings={standings} 
            loading={loading}
            authStatus={authStatus}
            gameweekInfo={gameweekInfo}
          />
        )}

        {currentTab === 'prizes' && (
          <PrizeDistribution />
        )}

        {currentTab === 'monthly' && (
          <MonthlyPrizes 
            standings={standings}
            gameweekInfo={gameweekInfo}
          />
        )}

        {currentTab === 'weekly' && (
          <WeeklyPrizes 
            standings={standings}
            gameweekInfo={gameweekInfo}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App