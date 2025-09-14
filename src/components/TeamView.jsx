// TeamView.jsx - FIXED VERSION with proper scrolling
import React, { useState, useEffect } from 'react';
import { Users, X, AlertCircle, Crown, Star, TrendingUp, ArrowUp } from 'lucide-react';

const TeamView = ({ managerId, managerName, teamName, gameweekInfo, onClose }) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // Default to list view

  // Current gameweek
  const currentGameweek = gameweekInfo?.current || 3;

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!managerId) {
        setError('No manager ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch team picks
        const picksResponse = await fetch(`https://fantasy.premierleague.com/api/entry/${managerId}/event/${currentGameweek}/picks/`);
        if (!picksResponse.ok) {
          throw new Error(`Failed to fetch team picks: ${picksResponse.status}`);
        }
        const picksData = await picksResponse.json();

        // Fetch live gameweek data
        const liveResponse = await fetch(`https://fantasy.premierleague.com/api/event/${currentGameweek}/live/`);
        if (!liveResponse.ok) {
          throw new Error(`Failed to fetch live data: ${liveResponse.status}`);
        }
        const liveData = await liveResponse.json();

        // Fetch bootstrap data for player info
        const bootstrapResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
        if (!bootstrapResponse.ok) {
          throw new Error(`Failed to fetch bootstrap data: ${bootstrapResponse.status}`);
        }
        const bootstrapData = await bootstrapResponse.json();

        // Process team data
        const processedTeam = processTeamData(picksData, liveData, bootstrapData);
        setTeamData(processedTeam);

      } catch (err) {
        console.error('Error fetching team data:', err);
        setError(err.message || 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [managerId, currentGameweek]);

  // Process team data function
  const processTeamData = (picks, live, bootstrap) => {
    const players = bootstrap.elements;
    const teams = bootstrap.teams;
    
    const startingXI = [];
    const bench = [];
    let captainId = null;
    let viceCaptainId = null;

    picks.picks.forEach(pick => {
      const player = players.find(p => p.id === pick.element);
      const team = teams.find(t => t.id === player?.team);
      const liveStats = live.elements[pick.element]?.stats || {};
      
      if (!player) return;

      const playerData = {
        id: player.id,
        name: player.web_name,
        fullName: `${player.first_name} ${player.second_name}`,
        positionType: getPositionAbbr(player.element_type),
        team: team?.short_name || '',
        price: player.now_cost / 10,
        points: liveStats.total_points || 0,
        eventPoints: liveStats.total_points || 0,
        multiplier: pick.multiplier,
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        position: pick.position,
        status: player.status,
        isInjured: player.status === 'i',
        isDoubtful: player.status === 'd'
      };

      if (pick.is_captain) captainId = pick.element;
      if (pick.is_vice_captain) viceCaptainId = pick.element;

      if (pick.position <= 11) {
        startingXI.push(playerData);
      } else {
        bench.push(playerData);
      }
    });

    return {
      startingXI: startingXI.sort((a, b) => a.position - b.position),
      bench: bench.sort((a, b) => a.position - b.position),
      formation: getFormation(startingXI),
      activeChip: picks.active_chip || null,
      captainId,
      viceCaptainId
    };
  };

  // Helper functions
  const getPositionAbbr = (elementType) => {
    const positions = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    return positions[elementType] || '?';
  };

  const getPositionColorClass = (position) => {
    const colors = {
      'GK': 'bg-yellow-500',
      'DEF': 'bg-blue-500', 
      'MID': 'bg-green-500',
      'FWD': 'bg-red-500'
    };
    return colors[position] || 'bg-gray-500';
  };

  const getFormation = (startingXI) => {
    if (!startingXI || startingXI.length === 0) return '4-4-2';
    
    const counts = startingXI.reduce((acc, player) => {
      if (player.positionType !== 'GK') {
        acc[player.positionType] = (acc[player.positionType] || 0) + 1;
      }
      return acc;
    }, {});
    
    return `${counts.DEF || 0}-${counts.MID || 0}-${counts.FWD || 0}`;
  };

  const getPlayerPosition = (player, index, startingXI) => {
    const formations = {
      '3-4-3': {
        'DEF': [{ left: '20%', bottom: '25%' }, { left: '50%', bottom: '20%' }, { left: '80%', bottom: '25%' }],
        'MID': [{ left: '15%', bottom: '45%' }, { left: '40%', bottom: '50%' }, { left: '60%', bottom: '50%' }, { left: '85%', bottom: '45%' }],
        'FWD': [{ left: '25%', bottom: '70%' }, { left: '50%', bottom: '75%' }, { left: '75%', bottom: '70%' }],
        'GK': [{ left: '50%', bottom: '5%' }]
      },
      '3-5-2': {
        'DEF': [{ left: '20%', bottom: '20%' }, { left: '50%', bottom: '15%' }, { left: '80%', bottom: '20%' }],
        'MID': [{ left: '10%', bottom: '45%' }, { left: '30%', bottom: '50%' }, { left: '50%', bottom: '55%' }, { left: '70%', bottom: '50%' }, { left: '90%', bottom: '45%' }],
        'FWD': [{ left: '35%', bottom: '75%' }, { left: '65%', bottom: '75%' }],
        'GK': [{ left: '50%', bottom: '5%' }]
      },
      '4-3-3': {
        'DEF': [{ left: '15%', bottom: '25%' }, { left: '35%', bottom: '20%' }, { left: '65%', bottom: '20%' }, { left: '85%', bottom: '25%' }],
        'MID': [{ left: '25%', bottom: '50%' }, { left: '50%', bottom: '55%' }, { left: '75%', bottom: '50%' }],
        'FWD': [{ left: '20%', bottom: '75%' }, { left: '50%', bottom: '80%' }, { left: '80%', bottom: '75%' }],
        'GK': [{ left: '50%', bottom: '5%' }]
      },
      '4-4-2': {
        'DEF': [{ left: '15%', bottom: '25%' }, { left: '35%', bottom: '20%' }, { left: '65%', bottom: '20%' }, { left: '85%', bottom: '25%' }],
        'MID': [{ left: '20%', bottom: '50%' }, { left: '40%', bottom: '55%' }, { left: '60%', bottom: '55%' }, { left: '80%', bottom: '50%' }],
        'FWD': [{ left: '35%', bottom: '75%' }, { left: '65%', bottom: '75%' }],
        'GK': [{ left: '50%', bottom: '5%' }]
      },
      '4-5-1': {
        'DEF': [{ left: '15%', bottom: '25%' }, { left: '35%', bottom: '20%' }, { left: '65%', bottom: '20%' }, { left: '85%', bottom: '25%' }],
        'MID': [{ left: '10%', bottom: '45%' }, { left: '30%', bottom: '50%' }, { left: '50%', bottom: '55%' }, { left: '70%', bottom: '50%' }, { left: '90%', bottom: '45%' }],
        'FWD': [{ left: '50%', bottom: '75%' }],
        'GK': [{ left: '50%', bottom: '5%' }]
      },
      '5-3-2': {
        'DEF': [{ left: '10%', bottom: '25%' }, { left: '25%', bottom: '20%' }, { left: '50%', bottom: '15%' }, { left: '75%', bottom: '20%' }, { left: '90%', bottom: '25%' }],
        'MID': [{ left: '25%', bottom: '50%' }, { left: '50%', bottom: '55%' }, { left: '75%', bottom: '50%' }],
        'FWD': [{ left: '35%', bottom: '75%' }, { left: '65%', bottom: '75%' }],
        'GK': [{ left: '50%', bottom: '5%' }]
      },
      '5-4-1': {
        'DEF': [{ left: '10%', bottom: '25%' }, { left: '25%', bottom: '20%' }, { left: '50%', bottom: '15%' }, { left: '75%', bottom: '20%' }, { left: '90%', bottom: '25%' }],
        'MID': [{ left: '20%', bottom: '50%' }, { left: '40%', bottom: '55%' }, { left: '60%', bottom: '55%' }, { left: '80%', bottom: '50%' }],
        'FWD': [{ left: '50%', bottom: '75%' }],
        'GK': [{ left: '50%', bottom: '5%' }]
      }
    };

    const formation = teamData?.formation || '4-4-2';
    const positions = formations[formation] || formations['4-4-2'];
    const positionArray = positions[player.positionType] || [{ left: '50%', bottom: '50%' }];
    
    const positionCounts = { 'GK': 0, 'DEF': 0, 'MID': 0, 'FWD': 0 };
    startingXI.forEach((p, i) => {
      if (i < index) positionCounts[p.positionType]++;
    });
    
    const positionIndex = positionCounts[player.positionType];
    const position = positionArray[positionIndex] || positionArray[0];
    
    return {
      left: position.left,
      bottom: position.bottom,
      transform: 'translate(-50%, 50%)'
    };
  };

  // Player Card Component
  const PlayerCard = ({ player, isBench = false }) => {
    if (!player) return null;

    const displayName = player.name || 'Unknown';
    let playerPoints = 0;

    if (player.points !== undefined && player.points !== null) {
      playerPoints = player.points;
    } else if (player.eventPoints !== undefined && player.eventPoints !== null) {
      playerPoints = player.eventPoints;
    }

    if (player.isCaptain && player.multiplier && player.multiplier > 1) {
      playerPoints = playerPoints * player.multiplier;
    }

    const isInjured = player.isInjured;
    const isDoubtful = player.isDoubtful;

    return (
      <div className={`relative ${isBench ? 'w-12 h-14' : 'w-16 h-20'}`}>
        {/* Captain/Vice-Captain indicators */}
        {player.isCaptain && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center z-10">
            <Crown size={8} className="text-white" />
          </div>
        )}
        {player.isViceCaptain && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center z-10">
            <Star size={6} className="text-white" />
          </div>
        )}

        {/* Main player card */}
        <div className={`
          w-full h-full rounded-xl flex flex-col items-center justify-center relative
          ${getPositionColorClass(player.positionType)}
          ${isBench ? 'opacity-75' : 'shadow-lg'}
        `}>
          {/* Position badge */}
          <div className={`
            absolute -top-1 left-1/2 transform -translate-x-1/2 
            px-1.5 py-0.5 rounded-full text-xs font-bold
            ${isBench ? 'bg-white/20 text-white' : 'bg-white/90 text-gray-900'}
          `}>
            {player.positionType}
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
      {/* Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[95vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-2 text-white relative flex-shrink-0">
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
              <div className="text-xs text-purple-200">Active: {teamData.activeChip}</div>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="p-2 border-b flex-shrink-0">
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

        {/* Content - FIXED: Removed overflow-hidden and added proper flex structure */}
        <div className="flex-1 min-h-0">
          {viewMode === 'pitch' ? (
            // PITCH VIEW
            <div className="bg-gradient-to-b from-green-400 to-green-600 h-full overflow-y-auto">
              <div className="relative">
                {/* Football pitch */}
                <div className="relative h-[420px] mx-2 mt-2">
                  {/* Pitch markings */}
                  <div className="absolute inset-0 bg-green-500 rounded-2xl overflow-hidden">
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

                {/* Substitutes */}
                {teamData?.bench && teamData.bench.length > 0 && (
                  <div className="mx-4 mb-6">
                    <div className="text-center mb-2">
                      <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Substitutes
                      </span>
                    </div>
                    <div className="flex justify-center gap-2">
                      {teamData.bench.map((player, index) => (
                        <div key={player?.id || index} className="scale-75 text-center">
                          <PlayerCard player={player} isBench={true} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // LIST VIEW - FIXED: Proper scrolling container
            <div className="h-full overflow-y-auto bg-gradient-to-b from-green-50 to-green-100">
              <div className="p-3">
                {/* Starting XI */}
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
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-gray-900 text-sm">{player.name}</span>
                                  {player.isCaptain && <Crown size={12} className="text-yellow-500" />}
                                  {player.isViceCaptain && <Star size={10} className="text-gray-400" />}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{player.team}</span>
                                  <span>£{player.price}m</span>
                                  {player.isInjured && <span className="text-red-500 font-semibold">INJ</span>}
                                  {player.isDoubtful && !player.isInjured && <span className="text-yellow-600 font-semibold">DOUBT</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">{displayPoints}</div>
                              <div className="text-xs text-gray-500">pts</div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500">No starting XI data available</div>
                    )}
                  </div>
                </div>

                {/* Bench */}
                {teamData?.bench && teamData.bench.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                      <ArrowUp size={16} className="text-orange-500" />
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
                            className={`p-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors opacity-75 ${
                              index !== teamData.bench.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`
                                w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md
                                ${getPositionColorClass(player.positionType)}
                              `}>
                                {player.positionType || '?'}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-sm">{player.name}</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{player.team}</span>
                                  <span>£{player.price}m</span>
                                  {player.isInjured && <span className="text-red-500 font-semibold">INJ</span>}
                                  {player.isDoubtful && !player.isInjured && <span className="text-yellow-600 font-semibold">DOUBT</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-700">{displayPoints}</div>
                              <div className="text-xs text-gray-500">pts</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Add extra padding at bottom for safe scrolling */}
                <div className="h-4"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamView;