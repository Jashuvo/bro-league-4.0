// src/App.jsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import LeagueTable from './components/LeagueTable'
import PrizeDistribution from './components/PrizeDistribution'
import MonthlyPrizes from './components/MonthlyPrizes'
import WeeklyPrizes from './components/WeeklyPrizes'
import Footer from './components/Footer'
import { mockStandings, gameweekInfo, leagueConfig } from './data/leagueData'

function App() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('standings')

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setLoading(true)
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStandings(mockStandings)
      setLoading(false)
    }
    
    loadData()
  }, [])

  const refreshData = async () => {
    setLoading(true)
    // In real implementation, fetch from FPL API
    await new Promise(resolve => setTimeout(resolve, 500))
    setStandings([...mockStandings]) // Trigger re-render
    setLoading(false)
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
          <MonthlyPrizes />
        )}

        {currentTab === 'weekly' && (
          <WeeklyPrizes />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App