// src/components/TeamView.jsx - FIXED: API Limitation + Better Layout
import { useState, useEffect } from 'react'
import { X, Zap, AlertCircle, Users, ChevronLeft, ChevronRight, Trophy, TrendingUp, ArrowDown, Info, Shield, Star, Clock } from 'lucide-react'

const TeamView = ({ managerId, managerName, teamName, gameweekInfo, onClose }) => {
  const [teamData, setTeamData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentGameweek, setCurrentGameweek] = useState(gameweekInfo?.current || 4)
  const [viewMode, setViewMode] = useState('pitch') // 'pitch' or 'list'

  // Fetch team data
  const fetchTeamData = async (gw) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/team-picks?managerId=${managerId}&eventId=${gw}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team data: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Response:', result) // Debug log
      
      if (result.success && result.data) {
        setTeamData(result.data)
        console.log('Team data set:', result.data) // Debug log
        
        // ENHANCED: Debug individual player points
        if (result.data.startingXI) {
          console.log('🔍 Starting XI points debug:', 
            result.data.startingXI.slice(0, 5).map(p => ({
              name: p?.name, 
              points: p?.points, 
              eventPoints: p?.eventPoints,
              multiplier: p?.multiplier,
              isCaptain: p?.isCaptain
            }))
          )
        }
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

  // IMPORTANT: Check if we should show individual player points
  const isCurrentGameweek = currentGameweek === (gameweekInfo?.current || 4)
  const showPlayerPoints = isCurrentGameweek

  // Helper function to get points color class
  const getPointsColorClass = (points) => {
    if (!showPlayerPoints) return 'text-gray-400'
    if (points === null || points === undefined || points === '-') return 'text-gray-400'
    const pointValue = Number(points) || 0
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
      case 'FWD': return 'bg-gradient-to-br from-red-500 to-red-600'
      default: return 'bg-gradient-to-br from-gray-500 to-gray-600'
    }
  }

  // Enhanced player positioning system - FIXED SPACING
  const getPlayerPosition = (player, index, startingXI) => {
    if (!startingXI || !Array.isArray(startingXI)) return { bottom: '10%', left: '50%', transform: 'translateX(-50%)' }
    
    // Group players by position
    const gkp = startingXI.filter(p => p?.positionType === 'GKP')
    const def = startingXI.filter(p => p?.positionType === 'DEF') 
    const mid = startingXI.filter(p => p?.positionType === 'MID')
    const fwd = startingXI.filter(p => p?.positionType === 'FWD')

    // Find player's position within their group
    let groupIndex = 0
    let totalInGroup = 0
    let verticalPosition = '10%'

    if (player?.positionType === 'GKP') {
      groupIndex = gkp.findIndex(p => p?.id === player?.id)
      totalInGroup = gkp.length
      verticalPosition = '8%'
    } else if (player?.positionType === 'DEF') {
      groupIndex = def.findIndex(p => p?.id === player?.id)
      totalInGroup = def.length
      verticalPosition = '28%'
    } else if (player?.positionType === 'MID') {
      groupIndex = mid.findIndex(p => p?.id === player?.id)
      totalInGroup = mid.length
      verticalPosition = '52%'
    } else if (player?.positionType === 'FWD') {
      groupIndex = fwd.findIndex(p => p?.id === player?.id)
      totalInGroup = fwd.length
      verticalPosition = '76%'
    }

    // IMPROVED: Better horizontal spacing to prevent overlapping
    let leftPosition = '50%'
    if (totalInGroup === 1) {
      leftPosition = '50%'
    } else if (totalInGroup === 2) {
      leftPosition = groupIndex === 0 ? '35%' : '65%'
    } else if (totalInGroup === 3) {
      leftPosition = ['30%', '50%', '70%'][groupIndex]
    } else if (totalInGroup === 4) {
      leftPosition = ['22%', '40%', '60%', '78%'][groupIndex]
    } else if (totalInGroup === 5) {
      leftPosition = ['18%', '32%', '50%', '68%', '82%'][groupIndex]
    }

    return {
      bottom: verticalPosition,
      left: leftPosition,
      transform: 'translateX(-50%)'
    }
  }

  // IMPROVED: Player card component with API limitation handling
  const PlayerCard = ({ player, isBench = false }) => {
    if (!player) return null
    
    // FIXED: Handle API limitation for historical gameweeks
    let displayPoints = '?'
    if (showPlayerPoints) {
      let playerPoints = 0
      if (player.points !== undefined && player.points !== null) {
        playerPoints = player.points
      } else if (player.eventPoints !== undefined && player.eventPoints !== null) {
        playerPoints = player.eventPoints
      }
      
      // Apply multiplier if captain/vice-captain
      if (player.isCaptain && player.multiplier && player.multiplier > 1) {
        playerPoints = playerPoints * player.multiplier
      }
      
      displayPoints = playerPoints
    }
    
    const chanceOfPlaying = player.chanceOfPlaying || 100
    const isInjured = player.status === 'i' || chanceOfPlaying < 75
    const isDoubtful = chanceOfPlaying >= 75 && chanceOfPlaying < 100
    
    // Get short name for better display
    const displayName = player.name ? 
      (player.name.length > 9 ? player.name.split(' ').pop() : player.name) : '?'
    
    return (
      <div className={`
        text-center cursor-pointer transition-all hover:scale-105
        ${isBench ? 'scale-75' : 'scale-100'}
        ${player.isCaptain || player.isViceCaptain ? 'relative' : ''}
      `}>
        {/* Captain/Vice Badge */}
        {(player.isCaptain || player.isViceCaptain) && (
          <div className={`
            absolute -top-2 left-1/2 transform -translate-x-1/2 z-20
            w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border-2 border-white shadow-lg
            ${player.isCaptain 
              ? 'bg-yellow-400 text-black' 
              : 'bg-gray-600 text-white'
            }
          `}>
            {player.isCaptain ? 'C' : 'V'}
          </div>
        )}

        {/* IMPROVED: Player Circle with better text layout */}
        <div className={`
          w-16 h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg border-3 border-white relative
          ${getPositionColorClass(player.positionType)}
          ${isInjured ? 'opacity-60' : ''}
        `}>
          {/* Player Name - Top */}
          <div className="text-xs leading-tight text-center px-1 truncate w-14 -mb-0.5">
            {displayName}
          </div>
          
          {/* Points - Bottom */}
          <div className={`text-xs font-bold ${!showPlayerPoints ? 'text-gray-300' : ''}`}>
            {displayPoints}
          </div>
        </div>

        {/* Status indicators */}
        {isInjured && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10">
            <AlertCircle size={10} className="text-white" />
          </div>
        )}
        {isDoubtful && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center z-10">
            <Info size={10} className="text-white" />
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !teamData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
          <div className="p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
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
      {/* IMPROVED: Better modal sizing using available space */}
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{managerName || 'Team View'}</h2>
                  <p className="text-purple-200 text-sm">{teamName || ''}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Gameweek Navigation */}
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <button
                onClick={handlePrevGW}
                disabled={currentGameweek <= 1}
                className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="text-center">
                <div className="text-lg font-bold">Gameweek {currentGameweek}</div>
                <div className="flex items-center gap-2 justify-center mt-1">
                  {teamData?.activeChip && (
                    <div className="text-xs bg-yellow-400 text-purple-900 px-2 py-1 rounded-full font-semibold">
                      {teamData.activeChip.toUpperCase()}
                    </div>
                  )}
                  {!isCurrentGameweek && (
                    <div className="flex items-center gap-1 text-xs text-purple-200">
                      <Clock size={12} />
                      Historical
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleNextGW}
                disabled={currentGameweek >= (gameweekInfo?.total || 38)}
                className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* API Limitation Notice for Historical Gameweeks */}
        {!isCurrentGameweek && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center gap-2 text-sm text-amber-800 flex-shrink-0">
            <Info size={16} className="text-amber-600 flex-shrink-0" />
            <span>Historical team selection shown. Individual player points only available for current gameweek.</span>
          </div>
        )}

        {/* Stats Section */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex-shrink-0">
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
                {Math.floor((teamData?.entryHistory?.eventTransfersCost || 0) / 4)}
                {teamData?.entryHistory?.eventTransfersCost > 0 && (
                  <span className="text-red-600 text-sm ml-1">
                    (-{teamData.entryHistory.eventTransfersCost}pts)
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">Transfers</div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center p-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
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

        {/* Team Display - Uses remaining flex space */}
        <div className="bg-gradient-to-b from-green-50 to-green-100 flex-1 overflow-hidden">
          {viewMode === 'pitch' ? (
            // IMPROVED: Pitch View with better use of space
            <div className="p-4 h-full flex flex-col">
              <div className="relative flex-1 max-w-md mx-auto">
                {/* Enhanced Pitch Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-400 via-green-500 to-green-600 rounded-3xl shadow-2xl overflow-hidden">
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
                    key={player?.id || index}
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
              </div>

              {/* Bench */}
              {teamData?.bench && teamData.bench.length > 0 && (
                <div className="mt-4 flex-shrink-0">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Substitutes</h4>
                  <div className="flex justify-center gap-3">
                    {teamData.bench.map((player, index) => (
                      <div key={player?.id || index} className="scale-75">
                        <PlayerCard player={player} isBench={true} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // FIXED: List View with better scrolling
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Starting XI */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <Users size={20} className="text-purple-600" />
                    Starting XI
                  </h3>
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {teamData?.startingXI && Array.isArray(teamData.startingXI) && teamData.startingXI.length > 0 ? (
                      teamData.startingXI.map((player, index) => {
                        if (!player) return null
                        
                        // FIXED: Handle API limitation
                        let displayPoints = '?'
                        if (showPlayerPoints) {
                          let playerPoints = 0
                          if (player.points !== undefined && player.points !== null) {
                            playerPoints = player.points
                          } else if (player.eventPoints !== undefined && player.eventPoints !== null) {
                            playerPoints = player.eventPoints
                          }
                          
                          // Apply multiplier if captain
                          if (player.isCaptain && player.multiplier && player.multiplier > 1) {
                            playerPoints = playerPoints * player.multiplier
                          }
                          
                          displayPoints = playerPoints
                        }
                        
                        return (
                          <div 
                            key={player.id || index} 
                            className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              index !== teamData.startingXI.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md
                                ${getPositionColorClass(player.positionType)}
                              `}>
                                {player.positionType || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                  {player.name || 'Unknown'}
                                  {player.isCaptain && (
                                    <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full font-bold border">C</span>
                                  )}
                                  {player.isViceCaptain && (
                                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold">V</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">{player.teamName || 'Unknown'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-lg ${getPointsColorClass(displayPoints)}`}>
                                {displayPoints}
                              </div>
                              <div className="text-xs text-gray-500">
                                £{((player.nowCost || 0) / 10).toFixed(1)}m
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No starting XI data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Bench */}
                {teamData?.bench && Array.isArray(teamData.bench) && teamData.bench.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                      <Shield size={20} className="text-gray-600" />
                      Substitutes
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      {teamData.bench.map((player, index) => {
                        if (!player) return null
                        
                        let displayPoints = '?'
                        if (showPlayerPoints) {
                          let playerPoints = 0
                          if (player.points !== undefined && player.points !== null) {
                            playerPoints = player.points
                          } else if (player.eventPoints !== undefined && player.eventPoints !== null) {
                            playerPoints = player.eventPoints
                          }
                          displayPoints = playerPoints
                        }
                        
                        return (
                          <div 
                            key={player.id || index} 
                            className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              index !== teamData.bench.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md opacity-70
                                ${getPositionColorClass(player.positionType)}
                              `}>
                                {player.positionType || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {player.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-600">{player.teamName || 'Unknown'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-lg ${getPointsColorClass(displayPoints)}`}>
                                {displayPoints}
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamView