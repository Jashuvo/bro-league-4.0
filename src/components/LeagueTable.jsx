import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, ExternalLink, ChevronRight } from 'lucide-react';

const LeagueTable = ({ standings = [], loading = false, authStatus = {}, gameweekInfo = {}, leagueStats = {}, gameweekTable = [] }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const calculateTotalPrizesWon = (managerId) => {
    let totalWon = 0;
    const currentGW = gameweekInfo.current || 3;

    if (gameweekTable.length === 0) return 0;

    for (let gw = 1; gw <= currentGW; gw++) {
      const gameweekData = gameweekTable.find(g => g.gameweek === gw);
      if (!gameweekData?.managers) continue;
      
      const sortedManagers = [...gameweekData.managers]
        .sort((a, b) => (b.gameweekPoints - b.transfersCost || 0) - (a.gameweekPoints - a.transfersCost || 0));
      
      const managerRank = sortedManagers.findIndex(m => m.id === managerId) + 1;
      
      if (managerRank === 1) totalWon += 30;
    }

    const monthlyGameweeks = {
      1: { start: 1, end: 5, prize: 750 },
      2: { start: 6, end: 9, prize: 750 }
    };

    Object.values(monthlyGameweeks).forEach(month => {
      if (currentGW >= month.end) {
        const monthlyData = gameweekTable
          .filter(gw => gw.gameweek >= month.start && gw.gameweek <= month.end)
          .reduce((acc, gw) => {
            const manager = gw.managers?.find(m => m.id === managerId);
            if (manager) {
              acc.totalPoints += (manager.gameweekPoints || 0) - (manager.transfersCost || 0);
            }
            return acc;
          }, { totalPoints: 0 });

        const allMonthlyScores = gameweekTable
          .filter(gw => gw.gameweek >= month.start && gw.gameweek <= month.end)
          .reduce((scores, gw) => {
            gw.managers?.forEach(manager => {
              if (!scores[manager.id]) scores[manager.id] = 0;
              scores[manager.id] += (manager.gameweekPoints || 0) - (manager.transfersCost || 0);
            });
            return scores;
          }, {});

        const sortedScores = Object.entries(allMonthlyScores)
          .sort(([,a], [,b]) => b - a)
          .map(([id]) => parseInt(id));

        const monthlyRank = sortedScores.indexOf(managerId) + 1;
        if (monthlyRank === 1) totalWon += month.prize;
      }
    });

    return totalWon;
  };

  const enrichedStandings = useMemo(() => {
    return standings.map(manager => ({
      ...manager,
      totalPrizesWon: calculateTotalPrizesWon(manager.id)
    }));
  }, [standings, gameweekTable, gameweekInfo.current]);

  const getRankIcon = (rank, change) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={18} />;
    if (rank === 2) return <Medal className="text-gray-400" size={18} />;
    if (rank === 3) return <Award className="text-orange-400" size={18} />;
    return <span className="text-gray-600 font-bold text-sm">{rank}</span>;
  };

  const getRankChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="text-green-500" size={14} />;
    if (change < 0) return <TrendingDown className="text-red-500" size={14} />;
    return <Minus className="text-gray-400" size={14} />;
  };

  const handleRowClick = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading league table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Trophy size={20} />
            League Table
          </h2>
          <div className="text-purple-100 text-sm">
            {standings.length} managers
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        {enrichedStandings.map((manager, index) => (
          <div
            key={manager.id}
            className={`
              border-b border-gray-100 last:border-b-0
              ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-white'}
              hover:bg-gray-50 transition-all duration-200
              cursor-pointer active:scale-[0.99]
            `}
            onClick={() => handleRowClick(manager.id)}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {getRankIcon(manager.rank)}
                  {manager.rankChange !== undefined && (
                    <div className="flex items-center">
                      {getRankChangeIcon(manager.rankChange)}
                    </div>
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">
                    {manager.managerName}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {manager.teamName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold text-lg text-purple-600">
                    {manager.totalPoints}
                  </div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
                
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-green-600">
                    ৳{manager.totalPrizesWon}
                  </div>
                  <div className="text-xs text-gray-500">won</div>
                </div>

                <ChevronRight 
                  className={`
                    text-gray-400 transition-transform duration-200
                    ${expandedRow === manager.id ? 'rotate-90' : ''}
                  `} 
                  size={16} 
                />
              </div>
            </div>

            {expandedRow === manager.id && (
              <div className="bg-gray-50 px-4 pb-4 border-t border-gray-100 animate-fade-in-up">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-600">
                      {manager.gameweekPoints || 0}
                    </div>
                    <div className="text-xs text-gray-500">GW Points</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold text-lg text-purple-600">
                      {manager.totalPoints}
                    </div>
                    <div className="text-xs text-gray-500">Total Points</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-600">
                      ৳{manager.totalPrizesWon}
                    </div>
                    <div className="text-xs text-gray-500">Prizes Won</div>
                  </div>
                  
                  <div className="text-center">
                    <a
                      href={`https://fantasy.premierleague.com/entry/${manager.entry}/event/${gameweekInfo.current}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                      View Team
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              Live data from FPL API • Last updated: {new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Dhaka',
                dateStyle: 'medium',
                timeStyle: 'short'
              })} (BD)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueTable;