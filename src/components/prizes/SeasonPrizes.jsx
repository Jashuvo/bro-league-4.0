import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Activity } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { TrophyCup, Jersey, Medal } from '../ui/Doodles';
import { prizeStructure } from '../../data/leagueData';

// The Season segment of the Prizes destination: the end-of-season podium
// (with whoever currently occupies each place), the season superlatives, and
// the souvenir budget. Lifted wholesale from the old Prize Distribution tab —
// same logic, same tokens, now one third of a merged destination instead of a
// top-level tab of its own.
const SeasonPrizes = ({ stats, standings = [] }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      {/* Season End Prizes */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2">
              <TrophyCup size={26} />
              Season End Championships
            </h3>
            <Badge variant="gold">৳{prizeStructure.season.total}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prizeStructure.season.prizes.map((prize) => (
              <div
                key={prize.position}
                className="rounded-2xl p-5 bg-surface-sunk border-2 border-ink/85 shadow-card"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Medal size={36} tone={prize.tone} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-ink truncate">{prize.label}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Position #{prize.position}</div>
                    </div>
                  </div>
                  <div className={`text-xl font-display font-bold shrink-0 ${prize.color}`}>
                    ৳{prize.amount}
                  </div>
                </div>

                {/* Current leader for this position */}
                {standings[prize.position - 1] && (
                  <div className="p-3 rounded-xl bg-surface-alt border-2 border-ink/15">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-0.5">Current Leader</div>
                    <div className="font-bold text-ink truncate">
                      {standings[prize.position - 1].managerName || standings[prize.position - 1].player_name}
                    </div>
                    <div className="text-sm font-bold text-violet">
                      {(standings[prize.position - 1].totalPoints || standings[prize.position - 1].total)?.toLocaleString()} pts
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Season Awards */}
      {(stats.topWeeklyWinners[0] || stats.biggestRiser || stats.bestAverage) && (
        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2 mb-6">
              <TrophyCup size={26} />
              Season Form
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.topWeeklyWinners[0] && (
                <AwardCard
                  icon={Star}
                  color="text-violet"
                  bgColor="bg-violet/15"
                  title="Most Weekly Wins"
                  name={stats.topWeeklyWinners[0].name}
                  detail={`${stats.topWeeklyWinners[0].wins} gameweek win${stats.topWeeklyWinners[0].wins !== 1 ? 's' : ''}`}
                />
              )}
              {stats.biggestRiser && (
                <AwardCard
                  icon={TrendingUp}
                  color="text-pitch"
                  bgColor="bg-pitch/15"
                  title="Biggest Riser"
                  name={stats.biggestRiser.managerName || stats.biggestRiser.player_name}
                  detail={`Up ${stats.biggestRiser.rankChange} place${stats.biggestRiser.rankChange !== 1 ? 's' : ''} since last GW`}
                />
              )}
              {stats.bestAverage && (
                <AwardCard
                  icon={Activity}
                  color="text-sky"
                  bgColor="bg-sky/15"
                  title="Best Average"
                  name={stats.bestAverage.managerName || stats.bestAverage.player_name}
                  detail={`${stats.bestAverage.average} pts/GW`}
                />
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Souvenirs */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2">
              <Jersey size={26} tone="fill-bubblegum" />
              Souvenirs &amp; Swag
            </h3>
            <Badge variant="accent">৳{prizeStructure.souvenirs.total}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {prizeStructure.souvenirs.items.map((item, index) => (
              <div key={item} className="bg-surface-sunk rounded-2xl p-4 text-center border-2 border-ink/15">
                <div className="flex justify-center mb-2">
                  {index === 0 ? <Jersey size={38} tone="fill-coral" />
                    : index === 1 ? <Medal size={38} tone="fill-sky" />
                      : index === 2 ? <Medal size={38} tone="fill-mint" />
                        : <TrophyCup size={38} />}
                </div>
                <div className="text-sm font-bold text-ink">{item}</div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const AwardCard = ({ icon: Icon, color, bgColor, title, name, detail }) => (
  <div className="bg-surface-sunk rounded-2xl p-4 flex items-center gap-3 border-2 border-ink/15">
    <div className={`w-11 h-11 rounded-2xl ${bgColor} border-2 border-ink/85 flex items-center justify-center flex-shrink-0`}>
      <Icon className={color} size={20} />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">{title}</div>
      <div className="font-display font-bold text-ink truncate">{name}</div>
      <div className={`text-xs font-bold ${color}`}>{detail}</div>
    </div>
  </div>
);

export default SeasonPrizes;
