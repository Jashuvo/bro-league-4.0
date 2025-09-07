// src/components/StatsDashboard.jsx - Advanced Stats Dashboard
import { TrendingUp, TrendingDown, Users, Target, Zap, Award, Trophy, Calendar, DollarSign, Clock, BarChart3, PieChart } from 'lucide-react'

const StatsDashboard = ({ standings = [], gameweekInfo = {}, leagueStats = {}, gameweekTable = [], bootstrap = {} }) => {
  const currentGW = gameweekInfo.current || 3
  
  // Calculate advanced statistics
  const calculateAdvancedStats = () => {
    if (standings.length === 0) return {}

    // Basic calculations
    const totalManagers = standings.length
    const totalPoints = standings.reduce((sum, m) => sum + m.totalPoints, 0)
    const averageTotal = Math.round(totalPoints / totalManagers)
    
    // Current gameweek stats
    const currentGWPoints = standings.reduce((sum, m) => sum + m.gameweekPoints, 0)
    const averageGW = Math.round(currentGWPoints / totalManagers)
    
    // Form analysis (last 3 gameweeks)
    const formAnalysis = standings.map(manager => {
      const recentGWs = gameweekTable
        .filter(gw => gw.gameweek >= currentGW - 2 && gw.gameweek < currentGW)
        .map(gw => gw.managers?.find(m => m.id === manager.id))
        .filter(Boolean)
        .reduce((sum, gw) => sum + (gw.points || 0), 0)
      
      return {
        id: manager.id,
        name: manager.managerName,
        formPoints: recentGWs,
        currentRank: manager.rank
      }
    }).sort((a, b) => b.formPoints - a.formPoints)

    // League dynamics
    const pointsSpread = Math.max(...standings.map(m => m.totalPoints)) - Math.min(...standings.map(m => m.totalPoints))
    const top3Points = standings.slice(0, 3).reduce((sum, m) => sum + m.totalPoints, 0)
    const bottom3Points = standings.slice(-3).reduce((sum, m) => sum + m.totalPoints, 0)
    const competitiveness = Math.round(((bottom3Points / top3Points) * 100))
    
    // Transfer analysis
    const transferData = gameweekTable.reduce((acc, gw) => {
      if (gw.managers) {
        const gwTransfers = gw.managers.reduce((sum, m) => sum + (m.transfers || 0), 0)
        const gwCosts = gw.managers.reduce((sum, m) => sum + (m.transferCost || 0), 0)
        acc.totalTransfers += gwTransfers
        acc.totalCosts += gwCosts
      }
      return acc
    }, { totalTransfers: 0, totalCosts: 0 })

    return {
      totalManagers,
      averageTotal,
      averageGW,
      pointsSpread,
      competitiveness,
      formAnalysis: formAnalysis.slice(0, 5),
      transferData,
      participation: Math.round((standings.filter(m => m.gameweekPoints > 0).length / totalManagers) * 100)
    }
  }

  const stats = calculateAdvancedStats()

  // Prize pool calculations
  const prizeDistribution = {
    weekly: currentGW * 30,
    monthly: Math.floor(currentGW / 4) * 750,
    remaining: 12000 - (currentGW * 30) - (Math.floor(currentGW / 4) * 750) - 1800 - 1910
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue", trend = null, highlight = false }) => (
    <div className={`
      bg-white rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg hover:scale-105
      ${highlight ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50' : 'border-gray-200'}
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">League Analytics</h2>
        <p className="text-gray-600">Deep dive into BRO League 4.0 performance metrics</p>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="League Average"
          value={stats.averageTotal?.toLocaleString() || '--'}
          subtitle="Total points per manager"
          icon={Users}
          color="blue"
          highlight={true}
        />
        
        <StatCard
          title="Current GW Avg"
          value={stats.averageGW || '--'}
          subtitle={`Gameweek ${currentGW} performance`}
          icon={Zap}
          color="yellow"
        />
        
        <StatCard
          title="Points Spread"
          value={stats.pointsSpread?.toLocaleString() || '--'}
          subtitle="Gap between 1st and last"
          icon={BarChart3}
          color="purple"
        />
        
        <StatCard
          title="Competitiveness"
          value={`${stats.competitiveness || '--'}%`}
          subtitle="Bottom 3 vs Top 3 ratio"
          icon={Target}
          color="green"
        />
      </div>

      {/* Prize Pool & Financial Stats */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <DollarSign size={28} />
          Prize Pool Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">৳{prizeDistribution.weekly.toLocaleString()}</div>
            <div className="text-green-100">Weekly Distributed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">৳{prizeDistribution.monthly.toLocaleString()}</div>
            <div className="text-green-100">Monthly Distributed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">৳{prizeDistribution.remaining.toLocaleString()}</div>
            <div className="text-green-100">Still to Win</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{Math.round(((12000 - prizeDistribution.remaining) / 12000) * 100)}%</div>
            <div className="text-green-100">Distributed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={20} />
              Recent Form Leaders
            </h3>
            <p className="text-purple-100 text-sm">Last 3 gameweeks performance</p>
          </div>
          
          <div className="p-4">
            {stats.formAnalysis && stats.formAnalysis.length > 0 ? (
              <div className="space-y-3">
                {stats.formAnalysis.map((manager, index) => (
                  <div key={manager.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-500 text-white' : 
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{manager.name}</div>
                        <div className="text-xs text-gray-500">Overall: #{manager.currentRank}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{manager.formPoints}</div>
                      <div className="text-xs text-gray-500">form pts</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
                <p>Form data will appear as more gameweeks complete</p>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Analysis */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 text-white">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 size={20} />
              Transfer Analysis
            </h3>
            <p className="text-orange-100 text-sm">League transfer activity</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.transferData?.totalTransfers || 0}</div>
              <div className="text-gray-600">Total Transfers Made</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">৳{stats.transferData?.totalCosts || 0}</div>
              <div className="text-gray-600">Total Hit Penalties</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.transferData?.totalTransfers > 0 
                  ? Math.round(stats.transferData.totalCosts / stats.transferData.totalTransfers * 100) / 100
                  : '0'}
              </div>
              <div className="text-gray-600">Avg Cost per Transfer</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-800">{stats.participation || '--'}%</div>
                <div className="text-orange-600 text-sm">Active Participation Rate</div>
                <div className="text-xs text-orange-500 mt-1">Managers who scored in current GW</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* League Health Indicators */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <PieChart size={24} />
          League Health Indicators
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.participation}%</div>
            <div className="text-green-600 font-medium">Participation</div>
            <div className="text-xs text-green-500 mt-1">
              {stats.participation > 80 ? 'Excellent' : stats.participation > 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.competitiveness}%</div>
            <div className="text-blue-600 font-medium">Competitiveness</div>
            <div className="text-xs text-blue-500 mt-1">
              {stats.competitiveness > 70 ? 'Very Competitive' : stats.competitiveness > 50 ? 'Competitive' : 'One-sided'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{Math.round((currentGW / 38) * 100)}%</div>
            <div className="text-purple-600 font-medium">Season Progress</div>
            <div className="text-xs text-purple-500 mt-1">
              {currentGW} of 38 gameweeks completed
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsDashboard