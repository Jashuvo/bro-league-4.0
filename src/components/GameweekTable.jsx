import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Trophy, TrendingUp, Users, Zap, Clock, Target, Crown, Medal, Award } from 'lucide-react';

const GameweekTable = ({ gameweekTable, currentGameweek, loading, bootstrap }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek || 3);

  const availableGameweeks = useMemo(() => {
    const weeks = new Set();
    gameweekTable?.forEach(gw => weeks.add(gw.gameweek));
    return Array.from(weeks).sort((a, b) => b - a);
  }, [gameweekTable]);

  const currentGameweekData = useMemo(() => {
    return gameweekTable?.find(gw => gw.gameweek === selectedGameweek);
  }, [selectedGameweek, gameweekTable]);

  const sortedManagers = useMemo(() => {
    if (!currentGameweekData?.managers) return [];
    return [...currentGameweekData.managers]
      .map(manager => {
        const rawPoints = manager.gameweekPoints || manager.points || 0;
        
        // Check ALL possible transfer cost field names
        const transfersCost = manager.transfersCost || 
                             manager.event_transfers_cost || 
                             manager.transferCost || 
                             manager.transfers_cost ||
                             manager.penalty ||
                             manager.hit ||
                             0;

        const netPoints = rawPoints - transfersCost;

        // Enhanced debugging for transfer costs
        if (transfersCost > 0) {
          console.log(`💰 Gameweek ${selectedGameweek} ${manager.managerName || manager.manager_name}: ${rawPoints} pts - ${transfersCost} cost = ${netPoints}`);
        }

        return {
          ...manager,
          rawPoints: rawPoints,
          transfersCost: transfersCost,
          netPoints: netPoints,
          gameweekPoints: rawPoints, // Keep original for display
          finalScore: netPoints // What we sort by
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [currentGameweekData, selectedGameweek]);

  const gameweekStats = useMemo(() => {
    if (!sortedManagers.length) return {};
    
    const netPoints = sortedManagers.map(m => m.finalScore);
    const rawPoints = sortedManagers.map(m => m.rawPoints);
    const totalPenalties = sortedManagers.reduce((sum, m) => sum + m.transfersCost, 0);
    
    return {
      highest: Math.max(...netPoints),
      lowest: Math.min(...netPoints),
      average: Math.round(netPoints.reduce((sum, p) => sum + p, 0) / netPoints.length),
      totalManagers: sortedManagers.length,
      highestRaw: Math.max(...rawPoints),
      totalPenalties: totalPenalties,
      managersWithPenalties: sortedManagers.filter(m => m.transfersCost > 0).length
    };
  }, [sortedManagers]);

  const handlePrevious = () => {
    const currentIndex = availableGameweeks.indexOf(selectedGameweek);
    if (currentIndex < availableGameweeks.length - 1) {
      setSelectedGameweek(availableGameweeks[currentIndex + 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = availableGameweeks.indexOf(selectedGameweek);
    if (currentIndex > 0) {
      setSelectedGameweek(availableGameweeks[currentIndex - 1]);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={18} />;
    if (rank === 2) return <Medal className="text-gray-400" size={18} />;
    if (rank === 3) return <Award className="text-orange-400" size={18} />;
    return <span className="text-gray-600 font-bold text-sm">{rank}</span>;
  };

  if (loading || !gameweekTable?.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Gameweek Data...</h3>
          <p className="text-gray-500">Fetching historical gameweek performance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Calendar size={20} />
            Gameweek Analysis
          </h2>
          <div className="text-blue-100 text-sm">
            {availableGameweeks.length} gameweeks available
          </div>
        </div>
      </div>

      {/* Gameweek Navigator */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={availableGameweeks.indexOf(selectedGameweek) >= availableGameweeks.length - 1}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">
              Gameweek {selectedGameweek}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedGameweek === currentGameweek ? 'Current' : 
               selectedGameweek < currentGameweek ? 'Completed' : 'Upcoming'}
            </p>
          </div>

          <button
            onClick={handleNext}
            disabled={availableGameweeks.indexOf(selectedGameweek) <= 0}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {gameweekStats.highest && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="font-bold text-xl text-green-600">{gameweekStats.highest}</div>
              <div className="text-xs text-gray-500">Highest Net</div>
              {gameweekStats.highestRaw !== gameweekStats.highest && (
                <div className="text-xs text-gray-400">({gameweekStats.highestRaw} raw)</div>
              )}
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-blue-600">{gameweekStats.average}</div>
              <div className="text-xs text-gray-500">Average Net</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-red-600">-{gameweekStats.totalPenalties}</div>
              <div className="text-xs text-gray-500">Total Penalties</div>
              <div className="text-xs text-gray-400">{gameweekStats.managersWithPenalties} managers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-purple-600">{gameweekStats.totalManagers}</div>
              <div className="text-xs text-gray-500">Total Managers</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-hidden">
        {sortedManagers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Manager</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Raw Points</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Penalties</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Net Score</th>
                  <th className="text-center p-4 font-semibold text-gray-700 hidden md:table-cell">Prize</th>
                </tr>
              </thead>
              <tbody>
                {sortedManagers.map((manager, index) => {
                  const rank = index + 1;
                  const prize = rank === 1 ? 30 : 0;
                  const isWinner = rank === 1;

                  return (
                    <tr
                      key={manager.id || manager.entry || index}
                      className={`
                        border-b border-gray-100 hover:bg-gray-50 transition-colors
                        ${isWinner ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                      `}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(rank)}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">
                          {manager.managerName || manager.manager_name || `Manager ${manager.id || manager.entry}`}
                        </div>
                        {manager.teamName && (
                          <div className="text-sm text-gray-500">{manager.teamName}</div>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-bold text-lg text-blue-600">{manager.rawPoints}</span>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`font-semibold ${manager.transfersCost > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {manager.transfersCost > 0 ? `-${manager.transfersCost}` : '0'}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <div className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold
                          ${isWinner ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}
                        `}>
                          <Zap size={12} />
                          {manager.finalScore}
                        </div>
                        {manager.transfersCost > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {manager.rawPoints} - {manager.transfersCost} = {manager.finalScore}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-center hidden md:table-cell">
                        <span className={`font-bold text-lg ${prize > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {prize > 0 ? `৳${prize}` : '--'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              Gameweek {selectedGameweek} data not yet available
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              Live gameweek data • Winner gets ৳30 • Transfer penalties deducted • 
              Last updated: {new Date().toLocaleString('en-US', { 
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

export default GameweekTable;