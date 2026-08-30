import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, Sparkles } from 'lucide-react';
import { Jersey } from './ui/Doodles';
import { cn } from '../utils/cn';

// Same crest CDN FixturesView points at, keyed by team.code — see
// api/fixtures.js for where this pattern first got verified.
const crestUrl = (teamCode) =>
  teamCode ? `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png` : null;

// One player, tapped from either the pitch or the list view in TeamView.
// Every field here already rides through api/team-picks.js's enrichedPick —
// news/form/selectedByPercent/pointsPerGame/season totals were all sitting
// unread on the same bootstrap element that was already being fetched for
// the player's name and price.
const PlayerDetail = ({ player, onClose }) => {
  const [crestFailed, setCrestFailed] = useState(false);

  if (!player) return null;

  const kitTone =
    player.positionType === 'GK' ? 'fill-sunflower' :
      player.positionType === 'DEF' ? 'fill-sky' :
        player.positionType === 'MID' ? 'fill-mint' :
          'fill-coral';

  const crestSrc = !crestFailed ? crestUrl(player.teamCode) : null;

  const hasFlag = player.status !== 'a' || player.news;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-scrim/75"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
        className="relative w-full md:max-w-sm max-h-[85vh] md:max-h-[600px] overflow-y-auto bg-surface rounded-t-3xl md:rounded-3xl border-2 border-ink/85 shadow-pop-lg"
      >
        <div className="sticky top-0 bg-violet text-white p-4 border-b-2 border-ink/85 flex items-start gap-3">
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center overflow-hidden">
            {crestSrc ? (
              <img
                src={crestSrc}
                alt=""
                className="w-8 h-8 object-contain"
                onError={() => setCrestFailed(true)}
              />
            ) : (
              <Jersey size={30} tone={kitTone} />
            )}
          </span>
          <div className="min-w-0 flex-grow">
            <h2 className="font-display font-bold text-lg leading-tight truncate">{player.fullName || player.name}</h2>
            <p className="text-white/80 text-sm font-semibold truncate">
              {player.teamName || player.team} · {player.positionType} · £{(player.price ?? player.nowCost / 10).toFixed(1)}m
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close player detail"
            className="w-8 h-8 shrink-0 bg-surface-alt text-ink border-2 border-ink/85 rounded-full flex items-center justify-center hover:bg-coral transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {hasFlag && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-coral/20 border-2 border-ink/85">
              <AlertCircle size={16} className="text-coral-ink mt-0.5 shrink-0" />
              <p className="text-[13px] font-bold text-ink leading-snug">
                {player.news || (player.status === 'i' ? 'Injured' : player.status === 'd' ? 'Doubtful' : 'Not fully available')}
                {typeof player.chanceOfPlaying === 'number' && player.chanceOfPlaying < 100 && (
                  <span className="text-ink-soft"> — {player.chanceOfPlaying}% chance of playing</span>
                )}
              </p>
            </div>
          )}

          {player.inDreamTeam && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-sunflower/30 border-2 border-ink/85">
              <Sparkles size={16} className="text-sunflower-ink shrink-0" />
              <p className="text-[13px] font-bold text-ink">In this gameweek&rsquo;s official Dream Team</p>
            </div>
          )}

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft mb-2">This gameweek</div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Points" value={player.points} tone="bg-tile-lilac" />
              <Stat label="Minutes" value={player.minutes ?? 0} />
              <Stat label="Bonus" value={player.bonus ?? 0} />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft mb-2">Season</div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Total pts" value={player.totalPoints ?? 0} tone="bg-tile-sage" />
              <Stat label="Pts / game" value={player.pointsPerGame ?? '—'} />
              <Stat label="Form" value={player.form ?? '—'} />
              <Stat label="Goals" value={player.goalsScored ?? 0} />
              <Stat label="Assists" value={player.assists ?? 0} />
              <Stat label="Clean sheets" value={player.cleanSheets ?? 0} />
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.1em]">Owned by</span>
            <span className="font-display font-bold text-ink">{player.selectedByPercent ?? '—'}% of FPL</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Stat = ({ label, value, tone = 'bg-surface-alt' }) => (
  <div className={cn('rounded-xl px-2 py-2 text-center border-2 border-ink/15', tone)}>
    <div className="font-display font-bold text-ink text-base leading-none tabular-nums">{value}</div>
    <div className="text-[9px] font-bold uppercase tracking-wider text-ink-soft mt-1 leading-tight">{label}</div>
  </div>
);

export default PlayerDetail;
