import React from 'react';
import { Trophy, Users, Calendar, Target, Crown, TrendingUp, Zap } from 'lucide-react';

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

  return (
    <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden pt-20 pb-8">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div className="absolute top-20 left-4 w-12 h-12 bg-yellow-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-4 right-4 w-16 h-16 bg-blue-400/10 rounded-full blur-xl"></div>
      
      <div className="relative container mx-auto px-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
                <Crown className="text-white" size={24} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Trophy size={8} className="text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {leagueName.split(' ').slice(0, 2).join(' ')}{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {leagueName.split(' ').slice(2).join(' ')}
            </span>
          </h1>
          
          <p className="text-blue-100 text-sm mb-4">Fantasy Premier League Championship</p>
          
          {currentLeader && authStatus?.authenticated && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 mb-4 mx-auto max-w-sm">
              <div className="flex items-center justify-center gap-2 text-white">
                <Crown className="text-yellow-400" size={16} />
                <span className="font-medium text-sm">Current Leader</span>
              </div>
              <div className="text-yellow-400 font-bold text-lg">{currentLeader.managerName}</div>
              <div className="text-blue-200 text-sm">{currentLeader.totalPoints} pts</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-green-400" size={16} />
              </div>
            </div>
            <div className="text-green-400 text-lg font-bold">{totalManagers}</div>
            <div className="text-white text-xs">Managers</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-400" size={16} />
              </div>
            </div>
            <div className="text-blue-400 text-lg font-bold">GW {gameweekInfo?.current || 3}</div>
            <div className="text-white text-xs">Current</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="text-purple-400" size={16} />
              </div>
            </div>
            <div className="text-purple-400 text-lg font-bold">{gameweeksLeft}</div>
            <div className="text-white text-xs">Left</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="text-yellow-400" size={16} />
              </div>
            </div>
            <div className="text-yellow-400 text-lg font-bold">৳{(totalPrizePool / 1000).toFixed(0)}K</div>
            <div className="text-white text-xs">Prize Pool</div>
          </div>
        </div>

        {nextDeadline && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="text-white font-medium text-sm mb-1">Next Deadline</div>
              <div className="text-yellow-400 font-bold">
                {nextDeadline.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        )}

        {topPerformers.length > 0 && authStatus?.authenticated && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold text-center mb-3 flex items-center justify-center gap-2 text-sm">
              <Zap className="text-yellow-400" size={16} />
              This Gameweek's Heroes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {topPerformers.map((manager, index) => (
                <div key={manager.id} className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {index === 0 && <Crown className="text-yellow-400" size={10} />}
                    {index === 1 && <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                    {index === 2 && <div className="w-2 h-2 bg-orange-400 rounded-full" />}
                    <span className="text-white font-medium text-xs truncate">{manager.managerName}</span>
                  </div>
                  <div className="text-yellow-400 font-bold text-sm">{manager.gameweekPoints} pts</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactHero;