// src/components/TeamView.jsx - MINIMAL FIX: Only changing pitch/subs proportions + scrolling
import { useState, useEffect } from 'react'
import { X, Zap, AlertCircle, Users, Trophy, TrendingUp, ArrowDown, Info, Shield, Star } from 'lucide-react'

const TeamView = ({ managerId, managerName, teamName, gameweekInfo, onClose }) => {
  const [teamData, setTeamData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('pitch') // 'pitch' or 'list'

  // Only use current gameweek - no navigation needed
  const currentGameweek = gameweekInfo?.current || 4

  // Fetch team data
  const fetchTeamData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/team-picks?managerId=${managerId}&eventId=${currentGameweek}`)
      
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
    if (managerId) {
      fetchTeamData()
    }
  }, [managerId])

  // Helper function to get points color class
  const getPointsColorClass = (points) => {
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

  // Enhanced player positioning system - BETTER SPACING
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
      verticalPosition = '5%'
    } else if (player?.positionType === 'DEF') {
      groupIndex = def.findIndex(p => p?.id === player?.id)
      totalInGroup = def.length
      verticalPosition = '25%'
    } else if (player?.positionType === 'MID') {
      groupIndex = mid.findIndex(p => p?.id === player?.id)
      totalInGroup = mid.length
      verticalPosition = '50%'
    } else if (player?.positionType === 'FWD') {
      groupIndex = fwd.findIndex(p => p?.id === player?.id)
      totalInGroup = fwd.length
      verticalPosition = '75%'
    }

    // MUCH BETTER horizontal spacing for realistic formation
    let leftPosition = '50%'
    if (totalInGroup === 1) {
      leftPosition = '50%'
    } else if (totalInGroup === 2) {
      leftPosition = groupIndex === 0 ? '30%' : '70%'
    } else if (totalInGroup === 3) {
      leftPosition = ['20%', '50%', '80%'][groupIndex]
    } else if (totalInGroup === 4) {
      leftPosition = ['15%', '35%', '65%', '85%'][groupIndex]
    } else if (totalInGroup === 5) {
      leftPosition = ['10%', '27.5%', '50%', '72.5%', '90%'][groupIndex]
    }

    return {
      bottom: verticalPosition,
      left: leftPosition,
      transform: 'translateX(-50%)'
    }
  }

  // IMPROVED: Player card component with better layout
  const PlayerCard = ({ player, isBench = false }) => {
    if (!player) return null
    
    // FIXED: Better points extraction and debugging
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
    
    const chanceOfPlaying = player.chanceOfPlaying || 100
    const isInjured = player.status === 'i' || chanceOfPlaying < 75
    const isDoubtful = chanceOfPlaying >= 75 && chanceOfPlaying < 100
    
    // Get short name for better display
    const displayName = player.name ? 
      (player.name.length > 8 ? player.name.split(' ').pop() : player.name) : '?'
    
    return (
      <div className={`
        relative flex flex-col items-center
        ${isBench ? 'scale-90' : ''}
        ${isInjured ? 'opacity-60' : ''}
      `}>
        {/* Player circle */}
        <div className={`
          w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs shadow-lg relative overflow-hidden
          ${getPositionColorClass(player.positionType)}
          ${player.isCaptain ? 'ring-4 ring-yellow-400' : ''}
          ${player.isViceCaptain ? 'ring-4 ring-gray-400' : ''}
        `}>
          {/* Captain/Vice-Captain badge */}
          {player.isCaptain && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-gray-900 font-black text-xs">C</span>
            </div>
          )}
          {player.isViceCaptain && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white font-black text-xs">V</span>
            </div>
          )}
          
          {/* Position */}
          <div className="text-xs font-bold leading-none mb-0.5">
            {player.positionType || '?'}
          </div>
        </div>

        {/* Player name */}
        <div className="mt-1 text-center">
          <div className={`
            text-xs font-bold leading-tight max-w-16 truncate
            ${isBench ? 'text-white/90' : 'text-white'}
          `}>
            {displayName}
          </div>
        </div>

        {/* Points */}
        <div className={`
          mt-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold
          ${isBench ? 'bg-white/20 text-white' : 'bg-white/90 text-gray-900'}
        `}>
          {playerPoints}
        </div>

        {/* Status indicators */}
        {isInjured && (
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
            <AlertCircle size={8} className="text-white" />
          </div>
        )}
        {isDoubtful && !isInjured && (
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">!</span>
          </div>
        )}
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Modal Container - KEEPING ORIGINAL SIZE */}
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[95vh] overflow-hidden shadow-2xl">
        
        {/* ORIGINAL Header - NO CHANGES */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-2 text-white relative">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Users size={12} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold">{managerName || 'Team View'}</h2>
                <p className="text-purple-200 text-xs">{teamName || ''}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-1">
            <div className="text-xs font-bold">GW {currentGameweek}</div>
            {teamData?.activeChip && (
              <div className="text-xs bg-yellow-400 text-purple-900 px-1 py-0.5 rounded-full inline-block font-semibold">
                {teamData.activeChip.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* ORIGINAL View Toggle - NO CHANGES */}
        <div className="p-2 border-b">
          <div className="flex bg-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('pitch')}
              className={`flex-1 py-1.5 px-2 text-xs font-medium transition-colors ${
                viewMode === 'pitch' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pitch
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-1.5 px-2 text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Content - ONLY CHANGING PROPORTIONS HERE */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'pitch' ? (
            // PITCH VIEW - FIXED PROPORTIONS
            <div className="bg-gradient-to-b from-green-400 to-green-600 h-full overflow-y-auto">
              <div className="flex flex-col h-full">
                {/* Main Pitch - 80% of available space */}
                <div style={{ height: '80%' }} className="relative mx-2 mt-2">
                  {/* Pitch markings - keeping original design */}
                  <div className="absolute inset-0 bg-green-500 rounded-2xl overflow-hidden">
                    {/* Pitch lines */}
                    <div className="absolute inset-x-8 bottom-[8%] h-24 border-2 border-white/40 rounded-t-2xl"></div>
                    <div className="absolute inset-x-8 top-[8%] h-24 border-2 border-white/40 rounded-b-2xl"></div>
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full"></div>
                    <div className="absolute left-1/2 bottom-[8%] transform -translate-x-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
                    <div className="absolute left-1/2 top-[8%] transform -translate-x-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
                  </div>

                  {/* Players */}
                  {teamData?.startingXI?.map((player, index) => (
                    <div
                      key={player?.id || index}
                      className="absolute z-10"
                      style={getPlayerPosition(player, index, teamData.startingXI)}
                    >
                      <PlayerCard player={player} />
                    </div>
                  ))}

                  {/* Formation */}
                  <div className="absolute top-3 left-3 bg-black/60 text-white px-2 py-1 rounded-xl backdrop-blur-sm">
                    <div className="text-sm font-bold">{teamData?.formation || '4-4-2'}</div>
                  </div>
                </div>

                {/* COMPACT Substitutes - 20% of available space */}
                {teamData?.bench && teamData.bench.length > 0 && (
                  <div style={{ height: '20%' }} className="mx-4 mb-2 flex items-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-3 w-full">
                      <h4 className="text-xs font-bold text-white text-center mb-2">SUBSTITUTES</h4>
                      <div className="flex justify-center gap-3">
                        {teamData.bench.map((player, index) => (
                          <div key={player?.id || index} className="flex flex-col items-center">
                            <div className="scale-75">
                              <PlayerCard player={player} isBench={true} />
                            </div>
                            <div className="mt-1 bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // LIST VIEW - FIXED SCROLLING ONLY
            <div className="bg-gradient-to-b from-green-50 to-green-100 h-full overflow-y-auto">
              <div className="p-3 pb-24">
                {/* Starting XI - keeping original */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                    <Users size={16} className="text-purple-600" />
                    Starting XI
                  </h3>
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {teamData?.startingXI && Array.isArray(teamData.startingXI) && teamData.startingXI.length > 0 ? (
                      teamData.startingXI.map((player, index) => {
                        if (!player) return null
                        
                        let displayPoints = 0
                        if (player.points !== undefined && player.points !== null) {
                          displayPoints = player.points
                        } else if (player.eventPoints !== undefined && player.eventPoints !== null) {
                          displayPoints = player.eventPoints
                        }
                        
                        if (player.isCaptain && player.multiplier && player.multiplier > 1) {
                          displayPoints = displayPoints * player.multiplier
                        }
                        
                        return (
                          <div 
                            key={player.id || index} 
                            className={`p-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              index !== teamData.startingXI.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`
                                w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md
                                ${getPositionColorClass(player.positionType)}
                              `}>
                                {player.positionType || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                                  {player.name || 'Unknown'}
                                  {player.isCaptain && (
                                    <span className="bg-yellow-400 text-gray-900 text-xs px-1.5 py-0.5 rounded-full font-bold border">C</span>
                                  )}
                                  {player.isViceCaptain && (
                                    <span className="bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">V</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600">{player.teamName || 'Unknown'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-base ${getPointsColorClass(displayPoints)}`}>
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
                      <div className="p-3 text-center text-gray-500 text-sm">
                        No starting XI data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Bench - keeping original design */}
                {teamData?.bench && Array.isArray(teamData.bench) && teamData.bench.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                      <Shield size={16} className="text-gray-600" />
                      Substitutes
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      {teamData.bench.map((player, index) => {
                        if (!player) return null
                        
                        let displayPoints = 0
                        if (player.points !== undefined && player.points !== null) {
                          displayPoints = player.points
                        } else if (player.eventPoints !== undefined && player.eventPoints !== null) {
                          displayPoints = player.eventPoints
                        }
                        
                        return (
                          <div 
                            key={player.id || index} 
                            className={`p-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              index !== teamData.bench.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`
                                w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md opacity-70
                                ${getPositionColorClass(player.positionType)}
                              `}>
                                {player.positionType || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">
                                  {player.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-600">{player.teamName || 'Unknown'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-base ${getPointsColorClass(displayPoints)}`}>
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