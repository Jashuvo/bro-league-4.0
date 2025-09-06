// src/App.jsx - Enhanced Version
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
    try {
      console.log('🚀 Loading enhanced FPL data for BRO League 4.0...')
      
      const result = await fplApi.initializeWithAuth()
      
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

      // Set gameweek table and league stats
      if (result.gameweekTable) {
        setGameweekTable(result.gameweekTable)
        console.log(`📈 Loaded gameweek history for ${result.gameweekTable.length} gameweeks`)
      }

      if (result.leagueStats) {
        setLeagueStats(result.leagueStats)
        console.log('📊 Loaded comprehensive league statistics')
      }

      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('❌ Error loading enhanced FPL data:', error)
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
        {/* Enhanced Tab Navigation */}
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
              🏆 Current Standings
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
              📊 Gameweek History
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
              💰 Prizes
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
              ⚡ Weekly
            </button>
          </div>
        </div>

        {/* Enhanced Stats Bar */}
        {authStatus.authenticated && leagueStats.totalManagers && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{leagueStats.totalManagers}</div>
                <div className="text-sm text-gray-600">Total Managers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{Math.round(leagueStats.averageScore)}</div>
                <div className="text-sm text-gray-600">Average Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{Math.round(leagueStats.averageGameweek)}</div>
                <div className="text-sm text-gray-600">Average GW</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{leagueStats.highestTotal}</div>
                <div className="text-sm text-gray-600">Highest Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{leagueStats.veteranManagers}</div>
                <div className="text-sm text-gray-600">Veterans</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{leagueStats.newManagers}</div>
                <div className="text-sm text-gray-600">New Managers</div>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {currentTab === 'standings' && (
          <LeagueTable 
            standings={standings} 
            loading={loading}
            authStatus={authStatus}
            gameweekInfo={gameweekInfo}
            leagueStats={leagueStats}
          />
        )}

        {currentTab === 'gameweeks' && (
          <GameweekTable 
            gameweekTable={gameweekTable}
            currentGameweek={gameweekInfo.current}
            loading={loading}
          />
        )}

        {currentTab === 'prizes' && (
          <PrizeDistribution />
        )}

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
      </main>

      <Footer />
    </div>
  )
}

export default App