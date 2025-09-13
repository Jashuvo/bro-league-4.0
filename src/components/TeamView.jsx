// src/components/TeamView.jsx - COMPLETE NEW Team View Modal Component
// This is a NEW file - does not replace anything existing

import { useState, useEffect } from 'react'
import { X, Zap, AlertCircle, Users, ChevronLeft, ChevronRight, Trophy, TrendingUp, ArrowDown, Info, Shield, Star } from 'lucide-react'

const TeamView = ({ managerId, managerName, teamName, gameweekInfo, onClose }) => {
  const [teamData, setTeamData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentGameweek, setCurrentGameweek] = useState(gameweekInfo?.current || 3)
  const [viewMode, setViewMode] = useState('pitch') // 'pitch' or 'list'

  // Fetch team data
  const fetchTeamData = async (gw) => {
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = import.meta.env.VITE_USE_LOCAL_API === 'true' 
        ? 'http://localhost:3001/api'
        : import.meta.env.VITE_API_URL || '/api'
      
      const response = await fetch(`${apiUrl}/team-picks?managerId=${managerId}&eventId=${gw}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team data: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setTeamData(result.data)
      } else {
        throw new Error(result.error || 'Failed to load team data')
      }
    } catch (err) {
      console.error('Error fetching team data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (managerId && currentGameweek) {
      fetchTeamData(currentGameweek)
    }
  }, [managerId, currentGameweek])

  // Navigate gameweeks
  const handlePrevGW = () => {
    if (currentGameweek > 1) {
      setCurrentGameweek(prev => prev - 1)
    }
  }

  const handleNextGW = () => {
    if (currentGameweek < (gameweekInfo?.total || 38)) {
      setCurrentGameweek(prev => prev + 1)
    }
  }

  // Get player position on pitch
  const getPlayerPosition = (position, formation) => {
    const positions = {
      // GK
      1: { bottom: '5%', left: '50%', transform: 'translateX(-50%)' },
      // Defense (3-5 players)
      2: { bottom: '25%' },
      3: { bottom: '25%' },
      4: { bottom: '25%' },
      5: { bottom: '25%' },
      6: { bottom: '25%' },
      // Midfield (2-5 players)
      7: { bottom: '50%' },
      8: { bottom: '50%' },
      9: { bottom: '50%' },
      10: { bottom: '50%' },
      11: { bottom: '50%' },
      // Forward (1-3 players)
      12: { bottom: '75%' },
      13: { bottom: '75%' },
      14: { bottom: '75%' }
    }

    // Adjust horizontal positioning based on formation
    const defCount = teamData?.startingXI?.filter(p => p.positionType === 'DEF').length || 0
    const midCount = teamData?.startingXI?.filter(p => p.positionType === 'MID').length || 0
    const fwdCount = teamData?.startingXI?.filter(p => p.positionType === 'FWD').length || 0

    // Defense positioning
    if (position >= 2 && position <= 6) {
      const defIndex = position - 2
      const spacing = 100 / (defCount + 1)
      return { ...positions[position], left: `${spacing * (defIndex + 1)}%`, transform: 'translateX(-50%)' }
    }

    // Midfield positioning
    if (position >= 7 && position <= 11) {
      const midIndex = position - 7 - (5 - defCount)
      const spacing = 100 / (midCount + 1)
      return { ...positions[position], left: `${spacing * (midIndex + 1)}%`, transform: 'translateX(-50%)' }
    }

    // Forward positioning
    if (position >= 12 && position <= 14) {
      const fwdIndex = position - 12 - (5 - defCount) - (5 - midCount)
      const spacing = 100 / (fwdCount + 1)
      return { ...positions[position], left: `${spacing * (fwdIndex + 1)}%`, transform: 'translateX(-50%)' }
    }

    return positions[position] || positions[1]
  }

  // Player card component
  const PlayerCard = ({ player, isBench = false }) => {
    const isInjured = player.status === 'i' || player.chanceOfPlaying < 75
    const isDoubtful = player.chanceOfPlaying >= 75 && player.chanceOfPlaying < 100
    
    return (
      <div className={`
        text-center 
        ${isBench ? 'scale-90' : ''}
        ${player.isCaptain ? 'relative' : ''}
      `}>
        {/* Captain/Vice Badge */}
        {(player.isCaptain || player.isViceCaptain) && (
          <div className={`
            absolute -top-2 left-1/2 transform -translate-x-1/2 z-10
            px-1.5 py-0.5 rounded-full text-xs font-bold
            ${player.isCaptain 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-600 text-white'
            }
          `}>
            {player.isCaptain ? 'C' : 'V'}
          </div>
        )}
        
        {/* Shirt/Jersey */}
        <div className="relative">
          <div className={`
            w-12 h-12 mx-auto rounded-lg flex items-center justify-center font-bold text-white
            ${player.positionType === 'GKP' ? 'bg-yellow-500' :
              player.positionType === 'DEF' ? 'bg-green-600' :
              player.positionType === 'MID' ? 'bg-blue-600' :
              'bg-red-600'}
            ${isInjured ? 'opacity-60' : ''}
            ${isDoubtful ? 'border-2 border-orange-400' : ''}
          `}>
            {player.positionType === 'GKP' ? '🥅' :
             player.positionType === 'DEF' ? '🛡️' :
             player.positionType === 'MID' ? '⚡' :
             '⚽'}
          </div>
          
          {/* Status indicator */}
          {(isInjured || isDoubtful) && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <AlertCircle size={10} className="text-white" />
            </div>
          )}
        </div>
        
        {/* Player Name */}
        <div className="mt-1 text-xs font-medium text-gray-900 truncate max-w-16">
          {player.name}
        </div>
        
        {/* Points */}
        <div className={`
          text-xs font-bold mt-0.5
          ${player.points > 10 ? 'text-green-600' :
            player.points > 5 ? 'text-blue-600' :
            player.points > 0 ? 'text-gray-700' :
            'text-red-600'}
        `}>
          {player.points} pts
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading team data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Team</h3>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold">{managerName}</h2>
              <p className="text-sm opacity-90">{teamName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Gameweek Navigation */}
          <div className="flex items-center justify-between bg-white/10 rounded-lg p-2">
            <button
              onClick={handlePrevGW}
              disabled={currentGameweek <= 1}
              className="p-1 hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-bold">Gameweek {currentGameweek}</div>
              {teamData?.activeChip && (
                <div className="text-xs bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full inline-block mt-1">
                  {teamData.activeChip.toUpperCase()}
                </div>
              )}
            </div>
            
            <button
              onClick={handleNextGW}
              disabled={currentGameweek >= (gameweekInfo?.total || 38)}
              className="p-1 hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {teamData?.entryHistory?.points || 0}
              </div>
              <div className="text-xs text-gray-500">GW Points</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {teamData?.entryHistory?.totalPoints?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-500">Total Points</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                #{teamData?.entryHistory?.overallRank?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">GW Rank</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {teamData?.entryHistory?.eventTransfers || 0}
                {teamData?.entryHistory?.eventTransfersCost > 0 && (
                  <span className="text-red-600 text-sm ml-1">
                    (-{teamData.entryHistory.eventTransfersCost})
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">Transfers</div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center p-3 bg-gray-50 border-b border-gray-200">
          <div className="bg-white rounded-lg p-1 flex gap-1 shadow-sm">
            <button
              onClick={() => setViewMode('pitch')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'pitch' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pitch View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Team Display */}
        <div className="p-4 bg-gradient-to-b from-green-50 to-green-100 min-h-[400px] overflow-y-auto">
          {viewMode === 'pitch' ? (
            // Pitch View
            <div className="relative h-[500px] max-w-md mx-auto">
              {/* Pitch Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-green-400 to-green-500 rounded-lg shadow-xl">
                {/* Pitch Lines */}
                <div className="absolute inset-x-4 top-1/2 transform -translate-y-1/2 h-0.5 bg-white/30"></div>
                <div className="absolute inset-x-8 bottom-[15%] h-20 border-2 border-white/30 rounded-t-lg"></div>
                <div className="absolute inset-x-8 top-[15%] h-20 border-2 border-white/30 rounded-b-lg"></div>
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/30 rounded-full"></div>
              </div>

              {/* Players on Pitch */}
              {teamData?.startingXI?.map((player, index) => (
                <div
                  key={player.id}
                  className="absolute"
                  style={getPlayerPosition(player.position, teamData.formation)}
                >
                  <PlayerCard player={player} />
                </div>
              ))}

              {/* Formation Display */}
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-bold">
                {teamData?.formation}
              </div>
            </div>
          ) : (
            // List View
            <div className="space-y-4">
              {/* Starting XI */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Users size={18} />
                  Starting XI
                </h3>
                <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
                  {teamData?.startingXI?.map((player) => (
                    <div key={player.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs
                          ${player.positionType === 'GKP' ? 'bg-yellow-500' :
                            player.positionType === 'DEF' ? 'bg-green-600' :
                            player.positionType === 'MID' ? 'bg-blue-600' :
                            'bg-red-600'}
                        `}>
                          {player.positionType}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {player.name}
                            {player.isCaptain && (
                              <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">C</span>
                            )}
                            {player.isViceCaptain && (
                              <span className="bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded-full">V</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{player.teamName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          player.points > 10 ? 'text-green-600' :
                          player.points > 5 ? 'text-blue-600' :
                          player.points > 0 ? 'text-gray-700' :
                          'text-red-600'
                        }`}>
                          {player.points} pts
                        </div>
                        <div className="text-xs text-gray-500">
                          £{((player.nowCost || 0) / 10).toFixed(1)}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bench */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield size={18} />
                  Bench
                  {teamData?.entryHistory?.pointsOnBench > 0 && (
                    <span className="text-sm font-normal text-orange-600">
                      ({teamData.entryHistory.pointsOnBench} pts)
                    </span>
                  )}
                </h3>
                <div className="bg-white/80 rounded-lg shadow-sm divide-y divide-gray-100">
                  {teamData?.bench?.map((player, index) => (
                    <div key={player.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs opacity-75
                          ${player.positionType === 'GKP' ? 'bg-yellow-500' :
                            player.positionType === 'DEF' ? 'bg-green-600' :
                            player.positionType === 'MID' ? 'bg-blue-600' :
                            'bg-red-600'}
                        `}>
                          {player.positionType}
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">{player.name}</div>
                          <div className="text-xs text-gray-500">{player.teamName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-600">
                          {player.points} pts
                        </div>
                        <div className="text-xs text-gray-500">
                          £{((player.nowCost || 0) / 10).toFixed(1)}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto Subs */}
              {teamData?.automaticSubs?.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ArrowDown size={18} />
                    Automatic Substitutions
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    {teamData.automaticSubs.map((sub, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        <span className="font-medium">{sub.element_in_name}</span> replaced{' '}
                        <span className="font-medium">{sub.element_out_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-3">
          <div className="text-center text-xs text-gray-500">
            Team Value: £{((teamData?.entryHistory?.value || 1000) / 10).toFixed(1)}m 
            • Bank: £{((teamData?.entryHistory?.bank || 0) / 10).toFixed(1)}m
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamView