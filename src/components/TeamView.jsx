// TeamView.jsx - PREMIUM UI VERSION
import React, { useState, useEffect } from 'react';
import { Users, X, AlertCircle, Crown, Star, Shirt, ChevronRight } from 'lucide-react';

const TeamView = ({ managerId, managerName, teamName, gameweekInfo, onClose }) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('pitch');

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

        // Use internal API proxy
        const response = await fetch(`/api/team-picks?managerId=${managerId}&eventId=${currentGameweek}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch team data: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load team data');
        }

        // Process data
        const processedTeam = {
          ...result.data,
          startingXI: result.data.startingXI.map(p => ({
            ...p,
            positionType: p.positionType === 'GKP' ? 'GK' : p.positionType,
            price: p.nowCost / 10,
            isInjured: p.status === 'i',
            isDoubtful: p.status === 'd'
          })),
          bench: result.data.bench.map(p => ({
            ...p,
            positionType: p.positionType === 'GKP' ? 'GK' : p.positionType,
            price: p.nowCost / 10,
            isInjured: p.status === 'i',
            isDoubtful: p.status === 'd'
          }))
        };

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

  // Helper: Get position styles for pitch view
  const getPlayerPosition = (player, index, startingXI) => {
    // Standard coordinates for 4-4-2 fallback
    const defaultCoords = { left: '50%', bottom: '50%' };

    if (!startingXI) return { ...defaultCoords, transform: 'translate(-50%, 50%)' };

    // Group players by position
    const gks = startingXI.filter(p => p.positionType === 'GK');
    const defs = startingXI.filter(p => p.positionType === 'DEF');
    const mids = startingXI.filter(p => p.positionType === 'MID');
    const fwds = startingXI.filter(p => p.positionType === 'FWD');

    let row = [];
    let rowIndex = 0;
    let rowTotal = 0;

    // Determine which row this player belongs to
    if (player.positionType === 'GK') {
      row = gks;
      rowIndex = row.findIndex(p => p.id === player.id);
      rowTotal = row.length;
      return {
        left: '50%',
        bottom: '5%',
        transform: 'translate(-50%, 0)'
      };
    } else if (player.positionType === 'DEF') {
      row = defs;
      rowIndex = row.findIndex(p => p.id === player.id);
      rowTotal = row.length;
      // Spread defenders across the back line
      const spacing = 100 / (rowTotal + 1);
      return {
        left: `${spacing * (rowIndex + 1)}%`,
        bottom: '22%',
        transform: 'translate(-50%, 0)'
      };
    } else if (player.positionType === 'MID') {
      row = mids;
      rowIndex = row.findIndex(p => p.id === player.id);
      rowTotal = row.length;
      // Spread midfielders
      const spacing = 100 / (rowTotal + 1);
      return {
        left: `${spacing * (rowIndex + 1)}%`,
        bottom: '45%',
        transform: 'translate(-50%, 0)'
      };
    } else { // FWD
      row = fwds;
      rowIndex = row.findIndex(p => p.id === player.id);
      rowTotal = row.length;
      // Spread forwards
      const spacing = 100 / (rowTotal + 1);
      return {
        left: `${spacing * (rowIndex + 1)}%`,
        bottom: '70%',
        transform: 'translate(-50%, 0)'
      };
    }
  };

  const getKitColor = (teamCode) => {
    // Simple mapping for kit colors based on team short name or code could go here
    // For now, returning a default style class
    return "from-gray-700 to-gray-900";
  };

  // Component: Pitch Player Card
  const PitchPlayer = ({ player, isBench = false }) => {
    if (!player) return null;

    const isCaptain = player.isCaptain;
    const isVice = player.isViceCaptain;
    const points = player.points * (player.multiplier || 1);

    return (
      <div className="flex flex-col items-center w-20 group cursor-pointer">
        {/* Shirt / Icon */}
        <div className="relative mb-1 transition-transform transform group-hover:scale-110">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white
            bg-gradient-to-br ${player.positionType === 'GK' ? 'from-yellow-400 to-yellow-600' : 'from-red-500 to-red-700'}
          `}>
            <Shirt size={20} className="text-white opacity-90" />
          </div>

          {/* Badges */}
          {isCaptain && (
            <div className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
              C
            </div>
          )}
          {isVice && (
            <div className="absolute -top-1 -right-1 bg-gray-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
              V
            </div>
          )}
          {player.isInjured && (
            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center border border-white">
              <AlertCircle size={10} />
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-md overflow-hidden shadow-lg w-full max-w-[72px]">
          <div className="bg-white/10 px-1 py-0.5 text-center">
            <p className="text-[10px] font-bold text-white truncate leading-tight">
              {player.name}
            </p>
          </div>
          <div className="bg-white px-1 py-0.5 text-center flex items-center justify-center gap-1">
            <span className="text-xs font-extrabold text-gray-900">{points}</span>
            {/* <span className="text-[8px] text-gray-500 uppercase">{player.positionType}</span> */}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Scouting team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Team</h3>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[85vh] md:h-[800px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={100} />
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  GW {currentGameweek}
                </span>
                {teamData?.activeChip && (
                  <span className="bg-yellow-400/90 text-yellow-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {teamData.activeChip}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold leading-tight">{managerName}</h2>
              <p className="text-purple-200 text-sm font-medium">{teamName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stats Summary */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-purple-200 text-xs">Points</div>
              <div className="text-xl font-bold">{teamData?.entryHistory?.points || 0}</div>
            </div>
            <div>
              <div className="text-purple-200 text-xs">Rank</div>
              <div className="text-xl font-bold">#{teamData?.entryHistory?.rank?.toLocaleString() || '-'}</div>
            </div>
            <div>
              <div className="text-purple-200 text-xs">Total</div>
              <div className="text-xl font-bold">{teamData?.entryHistory?.totalPoints?.toLocaleString() || 0}</div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="p-2 bg-gray-50 border-b shrink-0">
          <div className="flex bg-gray-200/50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('pitch')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'pitch'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Pitch View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'list'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 relative">
          {viewMode === 'pitch' ? (
            <div className="min-h-full flex flex-col">
              {/* Pitch Container */}
              <div className="relative flex-1 m-2 mb-0">
                {/* Pitch Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-600 to-green-700 rounded-t-2xl border-x-2 border-t-2 border-white/20 shadow-inner overflow-hidden">
                  {/* Grass Pattern */}
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #000 20px, #000 40px)' }}>
                  </div>

                  {/* Pitch Lines */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/30 rounded-b-lg"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/30 rounded-t-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
                </div>

                {/* Players on Pitch */}
                <div className="absolute inset-0">
                  {teamData?.startingXI?.map((player, index) => (
                    <div
                      key={player.id}
                      className="absolute transition-all duration-500"
                      style={getPlayerPosition(player, index, teamData.startingXI)}
                    >
                      <PitchPlayer player={player} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bench Section */}
              <div className="bg-white border-t p-4 pb-8 z-10">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Substitutes</div>
                <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                  {teamData?.bench?.map((player) => (
                    <PitchPlayer key={player.id} player={player} isBench={true} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // List View
            <div className="p-4 space-y-6 pb-10">
              {/* Starting XI List */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Starting XI</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {teamData?.startingXI?.map((player, idx) => (
                    <div key={player.id} className={`
                      flex items-center justify-between p-3 hover:bg-gray-50 transition-colors
                      ${idx !== teamData.startingXI.length - 1 ? 'border-b border-gray-100' : ''}
                    `}>
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold
                          ${player.positionType === 'GK' ? 'bg-yellow-500' :
                            player.positionType === 'DEF' ? 'bg-blue-500' :
                              player.positionType === 'MID' ? 'bg-green-500' : 'bg-red-500'}
                        `}>
                          {player.positionType}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                            {player.name}
                            {player.isCaptain && <span className="bg-black text-white text-[9px] px-1 rounded">C</span>}
                            {player.isViceCaptain && <span className="bg-gray-200 text-gray-600 text-[9px] px-1 rounded">V</span>}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{player.team}</span>
                            {player.isInjured && <span className="text-red-500 font-medium">Injured</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{player.points * (player.multiplier || 1)}</div>
                        <div className="text-[10px] text-gray-400">pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bench List */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Bench</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden opacity-75">
                  {teamData?.bench?.map((player, idx) => (
                    <div key={player.id} className={`
                      flex items-center justify-between p-3 hover:bg-gray-50 transition-colors
                      ${idx !== teamData.bench.length - 1 ? 'border-b border-gray-100' : ''}
                    `}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                          {player.positionType}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{player.name}</div>
                          <div className="text-xs text-gray-500">{player.team}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{player.points}</div>
                        <div className="text-[10px] text-gray-400">pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamView;