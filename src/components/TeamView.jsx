import React, { useState, useEffect } from 'react';
import { Users, X, AlertCircle, Shirt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

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
          if (response.status === 404) {
            throw new Error('Team picks are not available for this gameweek yet.');
          }
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

  // Component: Pitch Player Card
  const PitchPlayer = ({ player, isBench = false }) => {
    if (!player) return null;

    const isCaptain = player.isCaptain;
    const isVice = player.isViceCaptain;
    const points = player.points * (player.multiplier || 1);

    return (
      <motion.div
        className="flex flex-col items-center w-20 group cursor-pointer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
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
        <div className="bg-bro-card/90 backdrop-blur-sm rounded-md overflow-hidden shadow-lg w-full max-w-[72px] border border-white/10">
          <div className="bg-white/10 px-1 py-0.5 text-center">
            <p className="text-[10px] font-bold text-white truncate leading-tight">
              {player.name}
            </p>
          </div>
          <div className="bg-bro-dark px-1 py-0.5 text-center flex items-center justify-center gap-1">
            <span className="text-xs font-extrabold text-white">{points}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-base-200 rounded-2xl p-8 flex flex-col items-center shadow-2xl border border-base-content/10"
        >
          <div className="w-10 h-10 border-4 border-bro-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-medium">Scouting team...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-base-200 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-base-content/10"
        >
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Unable to Load Team</h3>
          <p className="text-bro-muted text-sm mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full justify-center"
          >
            Close
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-base-100 rounded-3xl w-full max-w-lg h-[85vh] md:h-[800px] flex flex-col shadow-2xl overflow-hidden border border-base-content/10"
      >

        {/* Header */}
        <div className="bg-gradient-to-r from-bro-primary to-bro-secondary p-4 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={100} />
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="bg-white/20 text-white border-none">
                  GW {currentGameweek}
                </Badge>
                {teamData?.activeChip && (
                  <Badge variant="warning" className="bg-yellow-400/90 text-yellow-900 border-none">
                    {teamData.activeChip}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold leading-tight">{managerName}</h2>
              <p className="text-white/80 text-sm font-medium">{teamName}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close team view"
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stats Summary */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-white/60 text-xs">Points</div>
              <div className="text-xl font-bold">{teamData?.entryHistory?.points || 0}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs">Rank</div>
              <div className="text-xl font-bold">#{teamData?.entryHistory?.rank?.toLocaleString() || '-'}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs">Total</div>
              <div className="text-xl font-bold">{teamData?.entryHistory?.totalPoints?.toLocaleString() || 0}</div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="p-2 bg-base-200 border-b border-base-content/5 shrink-0">
          <div className="flex bg-base-300 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('pitch')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'pitch'
                ? 'bg-bro-primary text-white shadow-sm'
                : 'text-bro-muted hover:text-white'
                }`}
            >
              Pitch View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'list'
                ? 'bg-bro-primary text-white shadow-sm'
                : 'text-bro-muted hover:text-white'
                }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-base-100 relative">
          {viewMode === 'pitch' ? (
            <div className="min-h-full flex flex-col">
              {/* Pitch Container */}
              <div className="relative flex-1 m-2 mb-0">
                {/* Pitch Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-800 to-green-900 rounded-t-2xl border-x-2 border-t-2 border-white/10 shadow-inner overflow-hidden">
                  {/* Grass Pattern */}
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #000 20px, #000 40px)' }}>
                  </div>

                  {/* Pitch Lines */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/20 rounded-b-lg"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/20 rounded-t-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20"></div>
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
              <div className="bg-base-200 border-t border-base-content/5 p-4 pb-8 z-10">
                <div className="text-xs font-bold text-bro-muted uppercase tracking-wider mb-3 text-center">Substitutes</div>
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
                <h3 className="text-xs font-bold text-bro-muted uppercase tracking-wider mb-3 ml-1">Starting XI</h3>
                <div className="bg-base-200 rounded-xl shadow-sm border border-base-content/5 overflow-hidden">
                  {teamData?.startingXI?.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`
                        flex items-center justify-between p-3 hover:bg-base-content/5 transition-colors
                        ${idx !== teamData.startingXI.length - 1 ? 'border-b border-base-content/5' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold
                          ${player.positionType === 'GK' ? 'bg-yellow-600' :
                            player.positionType === 'DEF' ? 'bg-blue-600' :
                              player.positionType === 'MID' ? 'bg-green-600' : 'bg-red-600'}
                        `}>
                          {player.positionType}
                        </div>
                        <div>
                          <div className="font-semibold text-base-content text-sm flex items-center gap-1.5">
                            {player.name}
                            {player.isCaptain && <span className="bg-bro-primary text-white text-[9px] px-1 rounded">C</span>}
                            {player.isViceCaptain && <span className="bg-bro-muted text-white text-[9px] px-1 rounded">V</span>}
                          </div>
                          <div className="text-xs text-bro-muted flex items-center gap-2">
                            <span>{player.team}</span>
                            {player.isInjured && <span className="text-red-500 font-medium">Injured</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base-content">{player.points * (player.multiplier || 1)}</div>
                        <div className="text-[10px] text-bro-muted">pts</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bench List */}
              <div>
                <h3 className="text-xs font-bold text-bro-muted uppercase tracking-wider mb-3 ml-1">Bench</h3>
                <div className="bg-base-200 rounded-xl shadow-sm border border-base-content/5 overflow-hidden opacity-75">
                  {teamData?.bench?.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (idx + 11) * 0.05 }}
                      className={`
                        flex items-center justify-between p-3 hover:bg-base-content/5 transition-colors
                        ${idx !== teamData.bench.length - 1 ? 'border-b border-base-content/5' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-base-content/10 flex items-center justify-center text-bro-muted text-xs font-bold">
                          {player.positionType}
                        </div>
                        <div>
                          <div className="font-semibold text-base-content text-sm">{player.name}</div>
                          <div className="text-xs text-bro-muted">{player.team}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base-content">{player.points}</div>
                        <div className="text-[10px] text-bro-muted">pts</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TeamView;