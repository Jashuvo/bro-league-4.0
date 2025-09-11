import React, { useMemo } from 'react';
import { DollarSign, Trophy, Calendar, Zap, Target, Gift, Award, Crown, Medal, TrendingUp, Users, Clock, PieChart } from 'lucide-react';

const PrizeDistribution = ({ gameweekInfo = {}, standings = [], gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3;
  const totalGWs = gameweekInfo.total || 38;

  const prizeStructure = {
    season: {
      total: 1800,
      prizes: [
        { position: 1, amount: 800, emoji: '🥇', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
        { position: 2, amount: 600, emoji: '🥈', color: 'text-gray-600', bgColor: 'bg-gray-50' },
        { position: 3, amount: 400, emoji: '🥉', color: 'text-orange-600', bgColor: 'bg-orange-50' }
      ]
    },
    weekly: {
      perWeek: 30,
      totalWeeks: 38,
      total: 1140
    },
    monthly: {
      regularMonths: 8,
      regularPrizes: [350, 250, 150],
      finalMonth: [500, 400, 250],
      total: 7150
    },
    souvenirs: {
      total: 1910,
      items: ['BRO League Jerseys', 'Certificates', 'Digital Badges', 'Trophy for Winner']
    }
  };

  const grandTotal = 12000;

  const distributionStats = useMemo(() => {
    const weeklyDistributed = Math.max(0, currentGW - 1) * prizeStructure.weekly.perWeek;
    const monthsCompleted = Math.floor(Math.max(0, currentGW - 1) / 4);
    const monthlyDistributed = monthsCompleted * 750;
    
    const totalDistributed = weeklyDistributed + monthlyDistributed;
    const remainingPrizes = grandTotal - prizeStructure.season.total - prizeStructure.souvenirs.total - totalDistributed;
    
    const seasonProgress = Math.min(100, (currentGW / totalGWs) * 100);
    const weeklyProgress = Math.min(100, ((currentGW - 1) / totalGWs) * 100);
    const monthlyProgress = Math.min(100, (monthsCompleted / 9) * 100);

    return {
      weeklyDistributed,
      monthlyDistributed,
      totalDistributed,
      remainingPrizes,
      seasonProgress,
      weeklyProgress,
      monthlyProgress,
      weeklyRemaining: prizeStructure.weekly.total - weeklyDistributed,
      monthlyRemaining: prizeStructure.monthly.total - monthlyDistributed
    };
  }, [currentGW, totalGWs, prizeStructure]);

  const pieChartData = [
    { name: 'Season Prizes', value: prizeStructure.season.total, color: '#fbbf24', distributed: false },
    { name: 'Weekly Prizes', value: distributionStats.weeklyDistributed, color: '#8b5cf6', distributed: true },
    { name: 'Weekly Remaining', value: distributionStats.weeklyRemaining, color: '#e5e7eb', distributed: false },
    { name: 'Monthly Prizes', value: distributionStats.monthlyDistributed, color: '#10b981', distributed: true },
    { name: 'Monthly Remaining', value: distributionStats.monthlyRemaining, color: '#f3f4f6', distributed: false },
    { name: 'Souvenirs', value: prizeStructure.souvenirs.total, color: '#f97316', distributed: false }
  ];

  const currentSeasonStandings = standings.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <DollarSign size={20} />
            Prize Distribution
          </h2>
          <div className="text-yellow-100 text-sm">
            ৳{grandTotal.toLocaleString()} Total Pool
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="font-bold text-2xl text-green-600">৳{distributionStats.totalDistributed}</div>
            <div className="text-xs text-gray-600">Distributed</div>
            <div className="text-xs text-green-600">{Math.round((distributionStats.totalDistributed / grandTotal) * 100)}%</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl text-blue-600">৳{distributionStats.remainingPrizes}</div>
            <div className="text-xs text-gray-600">Remaining</div>
            <div className="text-xs text-blue-600">{Math.round((distributionStats.remainingPrizes / grandTotal) * 100)}%</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl text-purple-600">{currentGW}</div>
            <div className="text-xs text-gray-600">Current GW</div>
            <div className="text-xs text-purple-600">{Math.round((currentGW / totalGWs) * 100)}% Season</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl text-orange-600">{Math.floor((currentGW - 1) / 4)}</div>
            <div className="text-xs text-gray-600">Months Done</div>
            <div className="text-xs text-orange-600">{Math.round((Math.floor((currentGW - 1) / 4) / 9) * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Prize Categories */}
      <div className="p-6 space-y-6">
        {/* Season Prizes */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="text-yellow-600" size={20} />
              Season Finale Prizes
            </h3>
            <div className="text-yellow-600 font-bold">৳{prizeStructure.season.total}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prizeStructure.season.prizes.map((prize, index) => {
              const currentManager = currentSeasonStandings[index];
              return (
                <div key={prize.position} className={`${prize.bgColor} rounded-lg p-4 border border-gray-200`}>
                  <div className="text-center">
                    <div className="text-2xl mb-2">{prize.emoji}</div>
                    <div className={`font-bold text-xl ${prize.color}`}>৳{prize.amount}</div>
                    <div className="text-sm text-gray-600 mb-2">{prize.position === 1 ? '1st' : prize.position === 2 ? '2nd' : '3rd'} Place</div>
                    {currentManager && (
                      <div className="bg-white/70 rounded-lg p-2">
                        <div className="font-semibold text-sm">{currentManager.managerName}</div>
                        <div className="text-xs text-gray-600">{currentManager.totalPoints} pts</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Prizes */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-purple-600" size={20} />
              Weekly Champions
            </h3>
            <div className="text-purple-600 font-bold">৳{prizeStructure.weekly.total}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-center">
                <div className="font-bold text-xl text-purple-600">৳30</div>
                <div className="text-sm text-gray-600">Per Gameweek</div>
                <div className="text-xs text-gray-500">Winner gets all</div>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-center">
                <div className="font-bold text-xl text-green-600">৳{distributionStats.weeklyDistributed}</div>
                <div className="text-sm text-gray-600">Distributed</div>
                <div className="text-xs text-gray-500">{currentGW - 1} gameweeks</div>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-center">
                <div className="font-bold text-xl text-blue-600">৳{distributionStats.weeklyRemaining}</div>
                <div className="text-sm text-gray-600">Remaining</div>
                <div className="text-xs text-gray-500">{totalGWs - (currentGW - 1)} gameweeks</div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Weekly Progress</span>
              <span className="text-sm font-bold text-purple-600">{Math.round(distributionStats.weeklyProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${distributionStats.weeklyProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Monthly Prizes */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-green-600" size={20} />
              Monthly Competitions
            </h3>
            <div className="text-green-600 font-bold">৳{prizeStructure.monthly.total}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Regular Months (1-8)</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>1st Place:</span>
                  <span className="font-bold text-green-600">৳350</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>2nd Place:</span>
                  <span className="font-bold text-green-600">৳250</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>3rd Place:</span>
                  <span className="font-bold text-green-600">৳150</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Per Month:</span>
                  <span className="text-green-600">৳750</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Final Month (9)</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>1st Place:</span>
                  <span className="font-bold text-green-600">৳500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>2nd Place:</span>
                  <span className="font-bold text-green-600">৳400</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>3rd Place:</span>
                  <span className="font-bold text-green-600">৳250</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">৳1,150</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Monthly Progress</span>
              <span className="text-sm font-bold text-green-600">{Math.round(distributionStats.monthlyProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${distributionStats.monthlyProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {Math.floor((currentGW - 1) / 4)} of 9 months completed
            </div>
          </div>
        </div>

        {/* Souvenirs & Extras */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Gift className="text-orange-600" size={20} />
              Souvenirs & Extras
            </h3>
            <div className="text-orange-600 font-bold">৳{prizeStructure.souvenirs.total}</div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {prizeStructure.souvenirs.items.map((item, index) => (
              <div key={index} className="bg-white/70 rounded-lg p-3 text-center">
                <div className="text-2xl mb-2">
                  {index === 0 ? '👕' : index === 1 ? '📜' : index === 2 ? '🏅' : '🏆'}
                </div>
                <div className="text-xs font-medium text-gray-700">{item}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            Physical and digital memorabilia distributed at season end
          </div>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-bold text-gray-900">৳{distributionStats.totalDistributed}</div>
              <div className="text-gray-600">Already Distributed</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">৳{distributionStats.remainingPrizes}</div>
              <div className="text-gray-600">Still Available</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">{Math.round((distributionStats.totalDistributed / grandTotal) * 100)}%</div>
              <div className="text-gray-600">Season Progress</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">৳{grandTotal}</div>
              <div className="text-gray-600">Total Prize Pool</div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            Prize distribution updated live • All amounts in Bangladeshi Taka (৳)
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizeDistribution;