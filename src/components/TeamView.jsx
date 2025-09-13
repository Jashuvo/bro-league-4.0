// src/components/TeamView.jsx - FIXED VERSION (JSX Syntax Corrected)
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

  // Helper function to get points color class
  const getPointsColorClass = (points) => {
    const pointValue = points || 0
    if (pointValue >= 10) return 'text-green-600'
    if (pointValue >= 5) return 'text-blue-600'
    if (pointValue >= 1) return 'text-gray-700'
    return 'text-red-600'
  }

  // Helper function to get position color class
  const getPositionColorClass = (positionType) => {
    switch (positionType) {
      case 'GKP': return 'bg-gradient-to-br from-green-500 to-green-600'
      case 'DEF': return 'bg-gradient-to-br from-blue-500 to-blue-600'
      case 'MID': return 'bg-gradient-to-br from-purple-500 to-purple-600'
      default: return 'bg-gradient-to-br from-red-500 to-red-600'
    }
  }

  // FIXED: Enhanced player positioning system
  const getPlayerPosition = (player, index, startingXI) => {
    // Group players by position
    const gkp = startingXI.filter(p => p.positionType === 'GKP')
    const def = startingXI.filter(p => p.positionType === 'DEF')
    const mid = startingXI.filter(p => p.positionType === 'MID')
    const fwd = startingXI.filter(p => p.positionType === 'FWD')

    // Find player's position within their group
    let groupIndex = 0
    let totalInGroup = 0
    let verticalPosition = '10%'

    if (player.positionType === 'GKP') {
      groupIndex = gkp.findIndex(p => p.id === player.id)
      totalInGroup = gkp.length
      verticalPosition = '5%'
    } else if (player.positionType === 'DEF') {
      groupIndex = def.findIndex(p => p.id === player.id)
      totalInGroup = def.length
      verticalPosition = '25%'
    } else if (player.positionType === 'MID') {
      groupIndex = mid.findIndex(p => p.id === player.id)
      totalInGroup = mid.length
      verticalPosition = '50%'
    } else if (player.positionType === 'FWD') {
      groupIndex = fwd.findIndex(p => p.id === player.id)
      totalInGroup = fwd.length
      verticalPosition = '75%'
    }

    // Calculate horizontal position
    const spacing = 100 / (totalInGroup + 1)
    const leftPosition = `${spacing * (groupIndex + 1)}%`

    return {
      bottom: verticalPosition,
      left: leftPosition,
      transform: 'translateX(-50%)'
    }
  }

  // FIXED: Enhanced player card component
  const PlayerCard = ({ player, isBench = false }) => {
    // Better points detection with multiple fallbacks
    const playerPoints = player.points || player.eventPoints || player.event_points || player.total_points || 0
    const chanceOfPlaying = player.chanceOfPlaying || 100
    const isInjured = player.status === 'i' || chanceOfPlaying < 75
    const isDoubtful = chanceOfPlaying >= 75 && chanceOfPlaying < 100
    
    // Debug logging for first few players
    if (!isBench && playerPoints === 0) {
      console.log('Player points debug:', {
        name: player.name,
        points: player.points,
        eventPoints: player.eventPoints,
        event_points: player.event_points,
        total_points: player.total_points,
        playerData: player
      })
    }
    
    return (
      <div className={`
        text-center cursor-pointer transition-all hover:scale-105
        ${isBench ? 'scale-75' : 'scale-100'}
        ${player.isCaptain || player.isViceCaptain ? 'relative' : ''}
      `}>
        {/* Captain/Vice Badge */}
        {(player.isCaptain || player.isViceCaptain) && (
          <div className={`
            absolute -top-2 left-1/2 transform -translate-x-1/2 z-10
            px-2 py-1 rounded-full text-xs font-bold border-2 border-white
            ${player.isCaptain 
              ? 'bg-yellow-400 text-black' 
              : 'bg-gray-600 text-white'
            }
          `}>
            {player.isCaptain ? 'C' : 'V'}
          </div>
        )}
        
        {/* Player Jersey/Shirt */}
        <div className="relative mb-1">
          <div className={`
            w-14 h-14 mx-auto rounded-full flex items-center justify-center font-bold text-white text-lg
            border-2 border-white shadow-lg
            ${getPositionColorClass(player.positionType)}
            ${isInjured ? 'opacity-60 grayscale' : ''}
            ${isDoubtful ? 'border-orange-400' : ''}
          `}>
            {/* Player position number/icon */}
            <span className="text-white font-bold">
              {player.positionType === 'GKP' ? '1' : player.positionType.slice(0,1)}
            </span>
          </div>
          
          {/* Status indicator */}
          {(isInjured || isDoubtful) && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center border border-white">
              <AlertCircle size={8} className="text-white" />
            </div>
          )}
        </div>
        
        {/* Player Name */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
          <div className="text-xs font-semibold text-gray-900 truncate max-w-16">
            {player.name}
          </div>
          
          {/* Points */}
          <div className={`text-xs font-bold ${getPointsColorClass(playerPoints)}`}>
            {playerPoints}
          </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{managerName}</h2>
                  <p className="text-purple-200 text-sm">{teamName || 'Team View'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                <X size={24} />
              </button>
            </div>

            {/* Gameweek Navigation */}
            <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <button
                onClick={handlePrevGW}
                disabled={currentGameweek <= 1}
                className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-center">
                <div className="text-lg font-bold">Gameweek {currentGameweek}</div>
                {teamData?.activeChip && (
                  <div className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded-full inline-block mt-1 font-semibold">
                    {teamData.activeChip.toUpperCase()}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleNextGW}
                disabled={currentGameweek >= (gameweekInfo?.total || 38)}
                className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
              <div className="text-xs text-gray-500">Overall Rank</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {teamData?.entryHistory?.eventTransfers || 0}
                {teamData?.entryHistory?.eventTransfersCost && teamData.entryHistory.eventTransfersCost > 0 && (
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
          <div className="bg-white rounded-xl p-1 flex gap-1 shadow-sm border">
            <button
              onClick={() => setViewMode('pitch')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'pitch' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pitch View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Team Display with proper scrolling */}
        <div className="overflow-y-auto max-h-[60vh] bg-gradient-to-b from-green-50 to-green-100">
          {viewMode === 'pitch' ? (
            // Pitch View
            <div className="p-6">
              <div className="relative h-[600px] max-w-lg mx-auto">
                {/* Enhanced Pitch Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-400 via-green-500 to-green-600 rounded-3xl shadow-2xl overflow-hidden">
                  {/* Pitch pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='pitch' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23pitch)' /%3E%3C/svg%3E")`
                    }}></div>
                  </div>
                  
                  {/* Pitch markings */}
                  <div className="absolute inset-x-6 top-1/2 transform -translate-y-1/2 h-0.5 bg-white/40"></div>
                  <div className="absolute inset-x-12 bottom-[8%] h-24 border-2 border-white/40 rounded-t-2xl"></div>
                  <div className="absolute inset-x-12 top-[8%] h-24 border-2 border-white/40 rounded-b-2xl"></div>
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full"></div>
                  <div className="absolute left-1/2 bottom-[8%] transform -translate-x-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
                  <div className="absolute left-1/2 top-[8%] transform -translate-x-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
                </div>

                {/* Players positioned correctly */}
                {teamData?.startingXI?.map((player, index) => (
                  <div
                    key={player.id}
                    className="absolute z-10"
                    style={getPlayerPosition(player, index, teamData.startingXI)}
                  >
                    <PlayerCard player={player} />
                  </div>
                ))}

                {/* Formation Display */}
                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-xl backdrop-blur-sm">
                  <div className="text-sm font-bold">{teamData?.formation || '4-4-2'}</div>
                </div>

                {/* Team of the Week indicator */}
                {teamData?.isTeamOfTheWeek && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1">
                    <Star size={14} />
                    Team of the Week
                  </div>
                )}
              </div>
            </div>
          ) : (
            // List View
            <div className="p-6">
              <div className="space-y-6">
                {/* Starting XI */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <Users size={20} className="text-purple-600" />
                    Starting XI
                  </h3>
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {teamData?.startingXI?.map((player, index) => {
                      const playerPoints = player.points || 0
                      return (
                        <div 
                          key={player.id} 
                          className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                            index !== teamData.startingXI.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`
                              w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md
                              ${getPositionColorClass(player.positionType)}
                            `}>
                              {player.positionType}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {player.name}
                                {player.isCaptain && (
                                  <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full font-bold border">C</span>
                                )}
                                {player.isViceCaptain && (
                                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold">V</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">{player.teamName}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-lg ${getPointsColorClass(playerPoints)}`}>
                              {playerPoints}
                            </div>
                            <div className="text-xs text-gray-500">
                              £{((player.nowCost || 0) / 10).toFixed(1)}m
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Bench */}
                {teamData?.bench && teamData.bench.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                      <Shield size={20} className="text-gray-600" />
                      Substitutes
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      {teamData.bench.map((player, index) => (
                        <div 
                          key={player.id} 
                          className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                            index !== teamData.bench.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm
                              ${getPositionColorClass(player.positionType)}
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
                              {player.points || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              £{((player.nowCost || 0) / 10).toFixed(1)}m
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto Subs */}
                {teamData?.automaticSubs && teamData.automaticSubs.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                      <ArrowDown size={20} className="text-orange-600" />
                      Automatic Substitutions
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      {teamData.automaticSubs.map((sub, index) => (
                        <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="font-medium">{sub.element_in_name}</span> 
                          <span className="text-gray-500">replaced</span>
                          <span className="font-medium">{sub.element_out_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with team value */}
        <div className="bg-gray-100 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Team Value: £{((teamData?.entryHistory?.value || 1000) / 10).toFixed(1)}m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>In Bank: £{((teamData?.entryHistory?.bank || 0) / 10).toFixed(1)}m</span>
              </div>
            </div>
            
            <div className="text-gray-500">
              GW{currentGameweek} • {teamData?.entryHistory?.points || 0} pts
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamView