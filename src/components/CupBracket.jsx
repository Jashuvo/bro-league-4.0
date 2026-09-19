import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import Card from './ui/Card';
import SectionBanner from './ui/SectionBanner';
import { TrophyCup } from './ui/Doodles';
import { buildCupBracket } from '../utils/cupBracket';

// A season-long knockout cup built on the league's own data — the bracket
// is fully derived in utils/cupBracket.js (seeding, round scheduling,
// net-points scoring, tiebreaks), so this component is presentation only.
// Rounds fill in as their gameweeks complete; the final is always played
// on the season's last gameweek. `embedded` skips the page banner when
// rendered inside MoreHub (see MoreHub.jsx).
const CupBracket = ({ standings = [], gameweekTable = [], gameweekInfo = {}, loading = false, embedded = false }) => {
  const cup = useMemo(
    () => buildCupBracket(standings, gameweekTable, {
      totalGameweeks: gameweekInfo.total || 38,
      startGameweek: 8
    }),
    [standings, gameweekTable, gameweekInfo.total]
  );

  if (loading && standings.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (cup.rounds.length === 0) {
    return (
      <div className="p-12 text-center">
        <Trophy className="w-14 h-14 mx-auto mb-4 text-ink/20" />
        <p className="text-lg font-bold text-ink-soft">The cup needs at least two managers</p>
      </div>
    );
  }

  const champion = cup.champion;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {!embedded && (
        <SectionBanner
          tone="sky"
          art={<TrophyCup size={20} />}
          eyebrow="Season-long knockout"
          title="The Cup"
          subtitle="Straight knockout — each round played on one gameweek, net of hits"
        />
      )}

      {champion && (
        <Card tone="sunflower" className="p-4 flex items-center gap-3">
          <TrophyCup size={26} />
          <div className="min-w-0">
            <div className="text-[10px] text-ink-soft uppercase tracking-[0.12em] font-bold">Cup champion</div>
            <div className="font-display font-bold text-ink truncate">{champion.name}</div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cup.rounds.map((round, rIndex) => (
          <div key={round.name} className="space-y-2">
            <div className="flex items-baseline justify-between px-1">
              <h3 className="font-display font-bold text-ink text-sm">{round.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">GW{round.gameweek}</span>
            </div>
            {round.matches.map((match, mIndex) => {
              const slots = [match.a, match.b];
              const pts = [match.aPts, match.bPts];
              return (
                <Card key={mIndex} className="p-2.5 space-y-1.5" tone={match.decided ? 'mint' : undefined}>
                  {slots.map((player, sIndex) => {
                    const isWinner = match.decided && match.winnerId === player?.id;
                    const isLoser = match.decided && match.winnerId !== player?.id;
                    return (
                      <div key={sIndex} className="flex items-center justify-between gap-2 min-w-0">
                        <span
                          className={`text-[12.5px] min-w-0 truncate ${
                            !player ? 'text-ink-soft/60 font-semibold italic' :
                              isWinner ? 'font-bold text-ink' :
                                isLoser ? 'font-semibold text-ink-soft' : 'font-bold text-ink'
                          }`}
                        >
                          {player ? player.name : `Winner of ${cup.rounds[rIndex - 1]?.name || 'previous round'} ${sIndex === 0 ? 'A' : 'B'}`}
                        </span>
                        <span
                          className={`shrink-0 text-sm font-display font-bold tabular-nums ${
                            pts[sIndex] == null ? 'text-ink/25' :
                              isWinner ? 'text-pitch-ink' : 'text-ink-soft'
                          }`}
                        >
                          {pts[sIndex] ?? '–'}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CupBracket;