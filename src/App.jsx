// src/App.jsx - Complete Fixed Version with gameweekTable Props
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import LeagueTable from './components/LeagueTable'
import GameweekTable from './components/GameweekTable'
import PrizeDistribution from './components/PrizeDistribution'
import MonthlyPrizes from './components/MonthlyPrizes'
import WeeklyPrizes from './components/WeeklyPrizes'
import Footer from './components/Footer'
import fplApi from './services/fplApi'

function App() {
  const [standings, setStandings] = useState([])
  const [gameweekInfo, setGameweekInfo] = useState({ current: 3, total: 38 })
  const [gameweekTable, setGameweekTable] = useState([])
  const [leagueStats, setLeagueStats] = useState({})
  const [bootstrap, setBootstrap] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('standings')
  const [authStatus, setAuthStatus] = useState({ authenticated: false, message: '' })
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    loadEnhancedData()
  }, [])

  const loadEnhancedData = async () => {
    setLoading(true)
    const startTime = performance.now()
    
    try {
      console.log('🚀 Loading OPTIMIZED FPL data for BRO League 4.0...')
      
      const result = await fplApi.initializeWithAuth()
      
      const endTime = performance.now()
      console.log(`⚡ OPTIMIZED data loaded in ${Math.round(endTime - startTime)}ms`)
      console.log('📊 Enhanced API Result:', result)

      // Update authentication status
      setAuthStatus({
        authenticated: result.authenticated,
        message: result.authenticated ? 'Connected to FPL API' : 'Using offline data'
      })

      // Update gameweek info from bootstrap data
      if (result.bootstrap) {
        setGameweekInfo({
          current: result.bootstrap.currentGameweek || 3,
          total: result.bootstrap.totalGameweeks || 38,
          status: 'active'
        })
        setBootstrap(result.bootstrap)
      }

      // Update standings - only use real API data
      if (result.standings && result.standings.length > 0) {
        setStandings(result.standings)
        console.log(`✅ Loaded ${result.standings.length} managers with enhanced data`)
      } else {
        console.log('⚠️ No standings data available from API')
        setStandings([])
      }

      // Set OPTIMIZED gameweek table (only loaded gameweeks)
      if (result.gameweekTable) {
        setGameweekTable(result.gameweekTable)
        console.log(`📈 OPTIMIZED: Loaded gameweek history for ${result.gameweekTable.length} gameweeks (instead of 38)`)
        console.log(`🔥 Performance improvement: ${Math.round(((38 - result.gameweekTable.length) / 38) * 100)}% fewer gameweeks processed`)
      }

      if (result.leagueStats) {
        setLeagueStats(result.leagueStats)
        console.log('📊 Loaded comprehensive league statistics')
      }

      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('❌ Error loading optimized FPL data:', error)
      setAuthStatus({
        authenticated: false,
        message: 'Failed to connect to FPL API'
      })
      setStandings([])
      setGameweekTable([])
      setLeagueStats({})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header 
        onRefresh={loadEnhancedData} 
        authStatus={authStatus}
        loading={loading}
      />
      
      <Hero 
        standings={standings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
        leagueStats={leagueStats}
        bootstrap={bootstrap}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 flex gap-1 overflow-x-auto">
            <button 
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
                ${currentTab === 'standings' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
              onClick={() => setCurrentTab('standings')}
            >
              🏆 League Table
            </button>
            
            <button 
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
                ${currentTab === 'gameweeks' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
              onClick={() => setCurrentTab('gameweeks')}
            >
              📊 Gameweeks
            </button>
            
            <button 
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
                ${currentTab === 'prizes' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
              onClick={() => setCurrentTab('prizes')}
            >
              🎁 Prizes
            </button>
            
            <button 
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
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
                px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
                ${currentTab === 'weekly' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
              onClick={() => setCurrentTab('weekly')}
            >
              📈 Weekly Winners
            </button>
          </div>
        </div>

        {currentTab === 'standings' && (
          <LeagueTable 
            standings={standings}
            loading={loading}
            authStatus={authStatus}
            gameweekInfo={gameweekInfo}
            leagueStats={leagueStats}
            gameweekTable={gameweekTable}
          />
        )}
        
        {currentTab === 'gameweeks' && (
          <GameweekTable 
            gameweekTable={gameweekTable}
            currentGameweek={gameweekInfo.current}
            loading={loading}
            bootstrap={bootstrap}
          />
        )}
        
        {currentTab === 'prizes' && <PrizeDistribution />}
        
        {currentTab === 'monthly' && (
          <MonthlyPrizes 
            standings={standings}
            gameweekInfo={gameweekInfo}
            gameweekTable={gameweekTable}
          />
        )}
        
        {currentTab === 'weekly' && (
          <WeeklyPrizes 
            standings={standings}
            gameweekInfo={gameweekInfo}
            gameweekTable={gameweekTable}
          />
        )}

        {lastUpdated && (
          <div className="mt-8 text-center">
            <div className="inline-block bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3">
              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-center gap-4">
                  <span>📡 Last updated: {lastUpdated.toLocaleTimeString()}</span>
                  <span>•</span>
                  <span>⚡ Optimized loading enabled</span>
                  <span>•</span>
                  <span>📊 {gameweekTable.length}/{gameweekInfo.total} gameweeks loaded</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer 
        gameweekInfo={gameweekInfo}
        standings={standings}
        authStatus={authStatus}
        bootstrap={bootstrap}
      />
    </div>
  )
}

export default App