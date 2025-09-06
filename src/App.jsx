// src/App.jsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import LeagueTable from './components/LeagueTable'
import PrizeDistribution from './components/PrizeDistribution'
import MonthlyPrizes from './components/MonthlyPrizes'
import WeeklyPrizes from './components/WeeklyPrizes'
import Footer from './components/Footer'
import { leagueConfig } from './data/leagueData'
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

      // Update standings
      if (result.standings && result.standings.length > 0) {
        setStandings(result.standings)
        console.log(`✅ Loaded ${result.standings.length} managers from ${result.authenticated ? 'FPL API' : 'mock data'}`)
      }

      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('❌ Error loading FPL data:', error)
      console.error('❌ Error stack:', error.stack)
      setAuthStatus({
        authenticated: false,
        message: `Failed to load data: ${error.message}`
      })
      
      // Use completely static data as last resort
      setStandings([
        { id: 1, managerName: 'Manager 1', teamName: 'La Roja ❤️', totalPoints: 206, gameweekPoints: 69, rank: 1, lastRank: 2 },
        { id: 2, managerName: 'Manager 2', teamName: 'Unknown', totalPoints: 181, gameweekPoints: 50, rank: 2, lastRank: 1 },
        { id: 3, managerName: 'Manager 3', teamName: 'Din ekhon Plasticor', totalPoints: 178, gameweekPoints: 52, rank: 3, lastRank: 4 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await loadRealData()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bro-primary via-purple-900 to-indigo-900">
      <Header onRefresh={refreshData} authStatus={authStatus} />
      
      <Hero 
        leagueConfig={leagueConfig}
        gameweekInfo={gameweekInfo}
      />

      <main className="container mx-auto px-4 py-8">
        {/* API Status Banner */}
        {!loading && (
          <div className={`
            alert mb-6 ${authStatus.authenticated ? 'alert-success' : 'alert-warning'}
          `}>
            <div className="flex items-center gap-2">
              <span className={authStatus.authenticated ? '🟢' : '🟡'}>
                {authStatus.authenticated ? '🔗' : '📡'}
              </span>
              <span>
                {authStatus.authenticated 
                  ? `✅ Live data from FPL API - League ID: 1858389` 
                  : `⚠️ ${authStatus.message} - Demo mode active`
                }
              </span>
              {lastUpdated && (
                <span className="text-sm opacity-75 ml-auto">
                  Last updated: {lastUpdated.toLocaleTimeString('en-US', { 
                    timeZone: 'Asia/Dhaka', 
                    hour12: true 
                  })} BD
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="tabs tabs-boxed justify-center mb-8 bg-white/10 backdrop-blur">
          <button 
            className={`tab ${currentTab === 'standings' ? 'tab-active' : ''}`}
            onClick={() => setCurrentTab('standings')}
          >
            🏆 Standings
          </button>
          <button 
            className={`tab ${currentTab === 'prizes' ? 'tab-active' : ''}`}
            onClick={() => setCurrentTab('prizes')}
          >
            💰 Prizes
          </button>
          <button 
            className={`tab ${currentTab === 'monthly' ? 'tab-active' : ''}`}
            onClick={() => setCurrentTab('monthly')}
          >
            📅 Monthly
          </button>
          <button 
            className={`tab ${currentTab === 'weekly' ? 'tab-active' : ''}`}
            onClick={() => setCurrentTab('weekly')}
          >
            ⚡ Weekly
          </button>
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