import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, ArrowLeftRight, History as HistoryIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { Jersey, Ball, PitchGraphic, Confetti } from './ui/Doodles';
import fplApi from '../services/fplApi';
import PlayerDetail from './PlayerDetail';

const TeamView = ({ managerId, managerName, teamName, gameweekInfo, onClose }) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('pitch');
  const [careerHistory, setCareerHistory] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const currentGameweek = gameweekInfo?.current || 1;

  useEffect(() => {
    if (!managerId) return;
    // Independent of the picks fetch below — a slow/failed history lookup
    // shouldn't block the pitch/list view, so this doesn't share loading
    // or error state with it.
    fplApi.getManagerHistory(managerId).then(setCareerHistory);
  }, [managerId]);

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

        // Everything client-side goes through the single data layer
        // (src/services/fplApi.js) — it owns the timeout, the retry/backoff,
        // the concurrency limit and the 5-minute picks cache. This component
        // used to `fetch('/api/team-picks')` directly, which bypassed all of
        // it and broke the one-data-layer rule in CLAUDE.md.
        const data = await fplApi.getTeamPicks(managerId, currentGameweek);

        // getTeamPicks swallows its own errors and resolves null rather than
        // throwing, so a null here is the "couldn't load it" case.
        if (!data) {
          throw new Error('Team picks are not available for this gameweek yet.');
        }

        // Process data
        const processedTeam = {
          ...data,
          startingXI: data.startingXI.map(p => ({
            ...p,
            positionType: p.positionType === 'GKP' ? 'GK' : p.positionType,
            price: p.nowCost / 10,
            isInjured: p.status === 'i',
            isDoubtful: p.status === 'd'
          })),
          bench: data.bench.map(p => ({
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

  // Component: Pitch Player Card — a flat drawn kit with a paper name plate
  // under it. Same outline/fill language as the rest of the illustration set.
  const PitchPlayer = ({ player }) => {
    if (!player) return null;

    const isCaptain = player.isCaptain;
    const isVice = player.isViceCaptain;
    // player.points already has the captain multiplier baked in by the
    // API (api/team-picks.js) — multiplying again here double-counts it.
    const points = player.points;

    const kitTone =
      player.positionType === 'GK' ? 'fill-sunflower' :
        player.positionType === 'DEF' ? 'fill-sky' :
          player.positionType === 'MID' ? 'fill-mint' :
            'fill-coral';

    return (
      <motion.button
        type="button"
        onClick={() => setSelectedPlayer(player)}
        className={`flex flex-col items-center w-[74px] group ${player.wasSubbedOut ? 'opacity-60' : ''}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: player.wasSubbedOut ? 0.6 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        title={player.wasSubbedOut ? 'Substituted out automatically' : `View ${player.name}'s details`}
      >
        {/* Kit */}
        <div className="relative transition-transform duration-200 group-hover:scale-110">
          <Jersey size={40} tone={kitTone} />

          {/* Badges */}
          {isCaptain && (
            <span className="absolute -top-1 -right-1 bg-ink text-surface text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface-alt">
              C
            </span>
          )}
          {isVice && !isCaptain && (
            <span className="absolute -top-1 -right-1 bg-silver text-ink text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface-alt">
              V
            </span>
          )}
          {player.isInjured && (
            <span className="absolute -bottom-1 -right-1 bg-coral text-ink w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface-alt">
              <AlertCircle size={9} />
            </span>
          )}
          {player.wasSubbedIn && (
            <span
              className="absolute -bottom-1 -left-1 bg-pitch text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface-alt"
              title="Came on as an automatic substitute"
            >
              <ArrowLeftRight size={8} />
            </span>
          )}
        </div>

        {/* Name plate */}
        <div className="-mt-1 w-full rounded-lg overflow-hidden border-2 border-ink/85 bg-surface-alt">
          <p className="text-[10px] font-bold text-ink truncate leading-tight text-center px-1 py-0.5">
            {player.name}
          </p>
          <div className="bg-ink text-center py-0.5">
            <span className="text-xs font-display font-bold text-surface">{points}</span>
          </div>
        </div>
      </motion.button>
    );
  };

  // Rendered via a portal straight to document.body: a fixed-position
  // element is normally positioned relative to the viewport, but that
  // breaks the moment any ancestor has a CSS transform (Layout.jsx's
  // <motion.main> animates its own y position, and framer-motion leaves
  // that transform in the inline style even at rest) — a transformed
  // ancestor becomes the containing block instead, so the modal ends up
  // sized/positioned against <main>'s box and stacked inside its
  // context rather than covering the real screen. Escaping to
  // document.body sidesteps that entirely.
  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-scrim/70 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-alt rounded-3xl p-8 flex flex-col items-center border-2 border-ink/85 shadow-pop"
        >
          <Ball size={44} className="animate-roll mb-4" />
          <p className="text-ink font-display font-bold">Scouting team...</p>
        </motion.div>
      </div>,
      document.body
    );
  }

  if (error) {
    return createPortal(
      <div className="fixed inset-0 bg-scrim/70 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-alt rounded-3xl p-6 max-w-sm w-full text-center border-2 border-ink/85 shadow-pop"
        >
          <div className="w-14 h-14 bg-coral/15 border-2 border-ink/85 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-coral-ink" size={26} />
          </div>
          <h3 className="text-lg font-display font-bold text-ink mb-2">Unable to Load Team</h3>
          <p className="text-ink-soft text-sm font-medium mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full justify-center"
          >
            Close
          </Button>
        </motion.div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-scrim/70 flex items-center justify-center z-50 p-3 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-surface rounded-3xl w-full max-w-lg h-[88vh] md:h-[800px] flex flex-col overflow-hidden border-2 border-ink/85 shadow-pop-lg"
      >

        {/* Header */}
        <div className="bg-violet p-4 text-white shrink-0 relative overflow-hidden border-b-2 border-ink/85">
          <Confetti className="absolute inset-x-0 -top-1 h-12 opacity-80 pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="bg-surface-alt text-ink">
                  GW {currentGameweek}
                </Badge>
                {teamData?.activeChip && (
                  <Badge variant="gold">
                    {teamData.activeChip}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-display font-bold leading-tight truncate">{managerName}</h2>
              <p className="text-white/80 text-sm font-semibold truncate">{teamName}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 shrink-0 bg-surface-alt text-ink border-2 border-ink/85 rounded-full flex items-center justify-center hover:bg-coral hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stats Summary */}
          <div className="relative grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Points', value: teamData?.entryHistory?.points || 0 },
              { label: 'Rank', value: `#${teamData?.entryHistory?.rank?.toLocaleString() || '-'}` },
              { label: 'Total', value: teamData?.entryHistory?.totalPoints?.toLocaleString() || 0 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-surface-alt border-2 border-ink/85 px-2 py-1.5 text-center">
                <div className="text-[9px] font-bold uppercase tracking-wider text-ink-soft">{stat.label}</div>
                <div className="text-lg font-display font-bold text-ink leading-tight truncate">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="p-2 bg-surface-alt border-b-2 border-ink/85 shrink-0">
          <div className="flex gap-1.5">
            {[
              { id: 'pitch', label: 'Pitch View' },
              { id: 'list', label: 'List View' },
              { id: 'history', label: 'Career' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex-1 py-2 rounded-xl border-2 border-ink/85 text-sm font-display font-bold transition-colors duration-200 ${viewMode === mode.id
                  ? 'bg-sunflower text-ink shadow-pop-sm'
                  : 'bg-surface-sunk text-ink-soft hover:text-ink'
                  }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Automatic Substitutions */}
        {teamData?.automaticSubs?.length > 0 && (
          <div className="px-4 pt-3 shrink-0">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-mint/20 border-2 border-ink/85 text-sm">
              <ArrowLeftRight size={16} className="text-pitch-ink mt-0.5 shrink-0" />
              <div className="text-ink font-medium">
                <span className="font-bold">Auto-subs: </span>
                {teamData.automaticSubs.map((sub, i) => (
                  <span key={i}>
                    {sub.playerOut} → {sub.playerIn}{i < teamData.automaticSubs.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-surface relative">
          {viewMode === 'history' ? (
            <div className="p-4">
              {!careerHistory || careerHistory.seasonHistory?.length === 0 ? (
                <div className="text-center py-16">
                  <HistoryIcon className="w-12 h-12 mx-auto mb-3 text-ink/20" />
                  <p className="font-bold text-ink-soft">{careerHistory ? 'No previous seasons on record' : 'Loading career history…'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-display font-bold text-ink-soft uppercase tracking-[0.16em] mb-3 ml-1">Past Seasons</h3>
                  {careerHistory.seasonHistory.map((season) => (
                    <div
                      key={season.season}
                      className="flex items-center justify-between p-3 bg-surface-alt rounded-2xl border-2 border-ink/85 shadow-card"
                    >
                      <span className="font-display font-bold text-ink">{season.season}</span>
                      <div className="text-right">
                        <div className="font-display font-bold text-ink">{season.totalPoints?.toLocaleString()} pts</div>
                        <div className="text-xs font-semibold text-ink-soft">Rank #{season.rank?.toLocaleString() || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'pitch' ? (
            <div className="min-h-full flex flex-col">
              {/* Pitch — a flat drawn diagram (thin lines, one flat green
                  wash), never a grass texture. */}
              <div className="relative flex-1 m-2 mb-0 min-h-[420px]">
                <PitchGraphic className="absolute inset-0 w-full h-full" />

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
              <div className="bg-surface-alt border-t-2 border-ink/85 p-4 pb-8 z-10">
                <div className="text-[10px] font-display font-bold text-ink-soft uppercase tracking-[0.16em] mb-3 text-center">Substitutes</div>
                {/* Wraps rather than scrolls — four bench players at 390px
                    overflowed the row, and a bench you have to swipe to see is
                    a bench you never see. */}
                <div className="flex flex-wrap justify-center gap-2 pb-2">
                  {teamData?.bench?.map((player) => (
                    <PitchPlayer key={player.id} player={player} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // List View
            <div className="p-4 space-y-6 pb-10">
              {/* Starting XI List */}
              <div>
                <h3 className="text-[10px] font-display font-bold text-ink-soft uppercase tracking-[0.16em] mb-3 ml-1">Starting XI</h3>
                <div className="bg-surface-alt rounded-2xl border-2 border-ink/85 shadow-card overflow-hidden">
                  {teamData?.startingXI?.map((player, idx) => (
                    <motion.button
                      type="button"
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`
                        w-full flex items-center justify-between gap-2 p-3 hover:bg-surface-sunk transition-colors text-left
                        ${idx !== teamData.startingXI.length - 1 ? 'border-b border-ink/10' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`
                          w-9 h-9 shrink-0 rounded-xl border-2 border-ink/85 flex items-center justify-center text-ink text-[10px] font-display font-bold
                          ${player.positionType === 'GK' ? 'bg-sunflower' :
                            player.positionType === 'DEF' ? 'bg-sky' :
                              player.positionType === 'MID' ? 'bg-mint' : 'bg-coral'}
                        `}>
                          {player.positionType}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-ink text-sm flex items-center gap-1.5 flex-wrap">
                            {player.name}
                            {player.isCaptain && <span className="bg-ink text-surface text-[9px] px-1.5 rounded-full font-bold">C</span>}
                            {player.isViceCaptain && <span className="bg-silver text-ink text-[9px] px-1.5 rounded-full font-bold">V</span>}
                            {player.wasSubbedIn && <span className="bg-pitch text-white text-[9px] px-1.5 rounded-full font-bold">IN</span>}
                          </div>
                          <div className="text-xs font-medium text-ink-soft flex items-center gap-2">
                            <span>{player.team}</span>
                            {player.isInjured && <span className="text-coral-ink font-bold">Injured</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-bold text-ink">{player.points}</div>
                        <div className="text-[10px] font-bold uppercase text-ink-soft">pts</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Bench List */}
              <div>
                <h3 className="text-[10px] font-display font-bold text-ink-soft uppercase tracking-[0.16em] mb-3 ml-1">Bench</h3>
                <div className="bg-surface-alt rounded-2xl border-2 border-dashed border-ink/40 overflow-hidden">
                  {teamData?.bench?.map((player, idx) => (
                    <motion.button
                      type="button"
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (idx + 11) * 0.05 }}
                      className={`
                        w-full flex items-center justify-between gap-2 p-3 hover:bg-surface-sunk transition-colors text-left
                        ${idx !== teamData.bench.length - 1 ? 'border-b border-ink/10' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-surface-sunk border-2 border-ink/30 flex items-center justify-center text-ink-soft text-[10px] font-display font-bold">
                          {player.positionType}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-ink text-sm flex items-center gap-1.5">
                            {player.name}
                            {player.wasSubbedOut && <span className="bg-ink/15 text-ink text-[9px] px-1.5 rounded-full font-bold">OUT</span>}
                          </div>
                          <div className="text-xs font-medium text-ink-soft">{player.team}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-bold text-ink">{player.points}</div>
                        <div className="text-[10px] font-bold uppercase text-ink-soft">pts</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Sibling to the card rather than nested inside it, so it can cover
          the full screen (including the header) at its own z-index — a
          player's detail is its own layer, not scoped to whichever view
          (pitch/list) was showing when it was tapped. Safe to wrap in
          AnimatePresence here, unlike InsightsFAB's sheet: this whole tree
          is already INSIDE the createPortal call, so AnimatePresence's
          direct child is a plain motion component, not a Portal object. */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerDetail player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default TeamView;