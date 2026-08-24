import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Card from '../ui/Card';
import ProgressCard from './ProgressCard';
import { Whistle, Jersey, Coins, RankBadge } from '../ui/Doodles';
import { prizeStructure } from '../../data/leagueData';

// The Weekly segment of the Prizes destination. Everything shown here comes
// off `usePrizeStats` — the weekly progress figures and the wins-per-manager
// leaderboard that Prize Distribution used to render, plus the per-gameweek
// roll of honour that the same single pass now produces.
const WeeklyPrizes = ({ stats }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ProgressCard
        art={<Whistle size={24} />}
        title="Weekly Pot"
        badge={`৳${prizeStructure.weekly.total}`}
        badgeVariant="info"
        amountLabel="Per Week"
        amountValue={`৳${prizeStructure.weekly.perWeek}`}
        amountColor="text-sky-ink"
        amountTone="bg-sky/12"
        countLabel="GWs Done"
        countValue={stats.completedGameweeks}
        progress={stats.weeklyProgress}
        progressColor="bg-sky"
        progressTextColor="text-sky-ink"
      />

      {/* Top Weekly Winners */}
      <Card className="h-full">
        <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2 mb-5">
          <Star className="text-violet-ink fill-violet" size={20} />
          Most Weekly Wins
        </h3>
        {stats.topWeeklyWinners.length === 0 ? (
          <p className="text-sm font-semibold text-ink-soft">No gameweek has been won yet this season.</p>
        ) : (
          <div className="space-y-2.5">
            {stats.topWeeklyWinners.map((winner, index) => (
              <div
                key={winner.name}
                className="bg-surface-sunk rounded-2xl px-3 py-2 flex items-center justify-between gap-2 border-2 border-ink/15"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Jersey size={28} number={index + 1} tone={index === 0 ? 'fill-sunflower' : 'fill-violet'} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-ink truncate">{winner.name}</div>
                    <div className="text-xs font-semibold text-ink-soft">{winner.wins} win{winner.wins !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="text-pitch-ink font-display font-bold shrink-0">৳{winner.totalWon}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>

    {/* Gameweek roll of honour */}
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b-2 border-ink/85 bg-surface-sunk">
        <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
          <Coins size={24} />
          Gameweek Winners
        </h3>
        <span className="text-right">
          <span className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
            ৳{stats.weeklyDistributed} paid out
          </span>
          {!stats.currentGameweekFinished && (
            <span className="block text-[10.5px] font-bold text-ink-soft/80 mt-0.5">
              GW{stats.currentGameweek} confirms when it closes
            </span>
          )}
        </span>
      </div>

      {stats.winnersByGameweek.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-lg font-bold text-ink-soft">No gameweek has closed yet</p>
          <p className="text-sm font-semibold text-ink-soft/80 mt-1.5">
            Weekly prizes are confirmed once FPL finishes a gameweek and bonus points are locked in.
          </p>
        </div>
      ) : (
        <div className="divide-y-2 divide-dashed divide-ink/10">
          {stats.winnersByGameweek.map((week) => {
            // The in-progress gameweek still has a leader, but not a winner —
            // show who's top without claiming the money has been paid.
            const isProvisional = week.gameweek === stats.currentGameweek && !stats.currentGameweekFinished;

            return (
            <div key={week.gameweek} className="px-4 py-2.5 flex items-center gap-3">
              <span className="shrink-0 w-12 text-center">
                <span className="block font-display font-bold text-ink leading-none">GW{week.gameweek}</span>
              </span>
              <RankBadge rank={1} size={30} className="shrink-0" />
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-ink truncate leading-tight">{week.name}</span>
                  {isProvisional && (
                    <span className="shrink-0 rounded-full bg-tile-gold px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-sunflower-ink">
                      Live
                    </span>
                  )}
                </div>
                {isProvisional ? (
                  <div className="text-[11px] font-semibold text-ink-soft truncate">
                    leading — prize confirms when GW{week.gameweek} closes
                  </div>
                ) : week.runnerUp && (
                  <div className="text-[11px] font-semibold text-ink-soft truncate">
                    beat {week.runnerUp.name} by {Math.max(0, week.points - week.runnerUp.points)}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display font-bold text-violet-ink leading-none tabular-nums">{week.points}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">pts</div>
              </div>
              <div className={`shrink-0 font-display font-bold tabular-nums w-12 text-right ${isProvisional ? 'text-ink-soft' : 'text-pitch-ink'}`}>
                {isProvisional ? '৳—' : `৳${week.prize}`}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </Card>
  </motion.div>
);

export default WeeklyPrizes;
