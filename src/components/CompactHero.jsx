import React from 'react';
import { Trophy, Users, Calendar, Target, Crown, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';

const CompactHero = ({ standings, gameweekInfo, authStatus, leagueStats, bootstrap }) => {
  const totalPrizePool = import.meta.env.VITE_TOTAL_PRIZE_POOL || 12000;
  const leagueName = import.meta.env.VITE_LEAGUE_NAME || "BRO League 4.0";

  const totalManagers = standings?.length || 0;
  const gameweeksLeft = gameweekInfo?.total ? gameweekInfo.total - (gameweekInfo.current || 0) : 0;
  const currentLeader = standings?.find(manager => manager.rank === 1);

  const nextGameweekData = bootstrap?.gameweeks?.find(gw => gw.id === (gameweekInfo.current + 1));
  const nextDeadline = nextGameweekData?.deadline_time ? new Date(nextGameweekData.deadline_time) : null;

  const topPerformers = standings
    ?.filter(m => m.gameweekPoints > 0)
    ?.sort((a, b) => b.gameweekPoints - a.gameweekPoints)
    ?.slice(0, 3) || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="relative overflow-hidden bg-base-100 pt-12 pb-8">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-10 left-10 w-72 h-72 bg-bro-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-bro-secondary/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* League Title */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 mb-4 bg-gradient-to-br from-bro-primary to-bro-secondary rounded-2xl shadow-lg shadow-bro-primary/25">
              <Crown className="text-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-base-content mb-2 tracking-tight">
              {leagueName}
            </h1>
            <p className="text-bro-muted text-lg">Fantasy Premier League Championship</p>
          </motion.div>

          {/* Main Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-8">
            <StatCard
              icon={Users}
              value={totalManagers}
              label="Managers"
              color="text-green-400"
              bgColor="bg-green-500/10"
            />
            <StatCard
              icon={Calendar}
              value={`GW ${gameweekInfo?.current || '-'}`}
              label="Current"
              color="text-blue-400"
              bgColor="bg-blue-500/10"
            />
            <StatCard
              icon={Target}
              value={gameweeksLeft}
              label="GWs Left"
              color="text-purple-400"
              bgColor="bg-purple-500/10"
            />
            <StatCard
              icon={Trophy}
              value={`৳${(totalPrizePool / 1000).toFixed(0)}K`}
              label="Prize Pool"
              color="text-yellow-400"
              bgColor="bg-yellow-500/10"
            />
          </motion.div>

          {/* Leader & Deadline Section */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Current Leader */}
            {currentLeader && (
              <Card className="flex items-center justify-between p-4 border-l-4 border-l-yellow-400">
                <div>
                  <div className="text-bro-muted text-xs uppercase tracking-wider font-bold mb-1">Current Leader</div>
                  <div className="text-base-content font-bold text-lg">{currentLeader.managerName}</div>
                  <div className="text-yellow-400 text-sm font-medium">{currentLeader.totalPoints} pts</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-400/10 flex items-center justify-center">
                  <Crown className="text-yellow-400" size={24} />
                </div>
              </Card>
            )}

            {/* Next Deadline */}
            {nextDeadline && (
              <Card className="flex items-center justify-between p-4 border-l-4 border-l-bro-primary">
                <div>
                  <div className="text-bro-muted text-xs uppercase tracking-wider font-bold mb-1">Next Deadline</div>
                  <div className="text-base-content font-bold text-lg">
                    {nextDeadline.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-bro-primary text-sm font-medium">
                    {nextDeadline.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-bro-primary/10 flex items-center justify-center">
                  <Clock className="text-bro-primary" size={24} />
                </div>
              </Card>
            )}
          </motion.div>

          {/* Top Performers */}
          {topPerformers.length > 0 && authStatus?.authenticated && (
            <motion.div variants={itemVariants} className="w-full max-w-4xl mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="text-yellow-400" size={18} />
                <h3 className="text-base-content font-bold">Gameweek Heroes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformers.map((manager, index) => (
                  <Card key={manager.id} className="flex items-center gap-3 p-3 hover:bg-base-content/10 transition-colors">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-900' :
                          'bg-orange-400 text-orange-900'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base-content font-medium truncate">{manager.managerName}</div>
                      <div className="text-bro-muted text-xs">{manager.teamName}</div>
                    </div>
                    <Badge variant="success">
                      {manager.gameweekPoints} pts
                    </Badge>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label, color, bgColor }) => (
  <Card className="flex flex-col items-center justify-center p-4 text-center hover:scale-105 transition-transform duration-300">
    <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-2`}>
      <Icon className={color} size={20} />
    </div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    <div className="text-bro-muted text-xs font-medium uppercase tracking-wide">{label}</div>
  </Card>
);

export default CompactHero;