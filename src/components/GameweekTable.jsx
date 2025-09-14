// src/components/GameweekTable.jsx - Updated to match League Table UI design + Current GW Rank
import React, { useState, useMemo } from 'react';
import { 
  Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, ChevronRight, 
  ChevronLeft, Calendar, Target, Zap, Users, Star 
} from 'lucide-react';

const GameweekTable = ({ gameweekTable = [], currentGameweek = 3, loading = false, bootstrap = {} }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek);
  const [expandedRow, setExpandedRow] = useState(null);

  // Toggle row expansion
  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  // Enhanced gameweek status determination
  const getGameweekStatus = (gameweekId) => {
    const gameweekData = bootstrap?.gameweeks?.find(gw => gw.id === gameweekId);
    
    if (gameweekData?.finished) return 'completed';
    if (gameweekData?.is_current) return 'current';
    if (gameweekData?.is_next) return 'next';
    if (gameweekId < currentGameweek) return 'completed';
    if (gameweekId === currentGameweek) return 'current';
    return 'upcoming';
  };

  const selectedGameweekStatus = getGameweekStatus(selectedGameweek);

  // Calculate gameweek data and rankings
  const gameweekData = useMemo(() => {
    const gw = gameweekTable.find(g => g.gameweek === selectedGameweek);
    if (!gw?.managers) return [];

    // Calculate net points and rank managers for THIS gameweek
    const managersWithNetPoints = gw.managers
      .filter(m => m.points > 0)
      .map(manager => {
        const rawPoints = manager.gameweekPoints || manager.points || 0;
        const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || 0;
        const netPoints = rawPoints - transfersCost;

        return {
          ...manager,
          rawPoints,
          transfersCost,
          netPoints,
          overallRank: manager.rank || manager.overall_rank || 0 // Overall rank for this gameweek
        };
      })
      .sort((a, b) => b.netPoints - a.netPoints);

    // Add current gameweek ranking
    return managersWithNetPoints.map((manager, index) => ({
      ...manager,
      currentGWRank: index + 1 // Current gameweek rank
    }));
  }, [gameweekTable, selectedGameweek]);

  // Calculate gameweek stats
  const gameweekStats = useMemo(() => {
    if (gameweekData.length === 0) return {};
    
    const netScores = gameweekData.map(m => m.netPoints);
    const rawScores = gameweekData.map(m => m.rawPoints);
    const penalties = gameweekData.map(m => m.transfersCost).filter(p => p > 0);
    
    return {
      highest: Math.max(...netScores),
      highestRaw: Math.max(...rawScores),
      average: Math.round(netScores.reduce((sum, score) => sum + score, 0) / netScores.length),
      totalPenalties: penalties.reduce((sum, penalty) => sum + penalty, 0),
      managersWithPenalties: penalties.length,
      totalManagers: gameweekData.length
    };
  }, [gameweekData]);

  // Position styling (same as League Table)
  const getPositionStyling = (position) => {
    if (position === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg';
    if (position === 2) return 'bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-md';
    if (position === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md';
    if (position <= 5) return 'bg-gradient-to-br from-green-500 to-green-600 text-white';
    if (position <= 10) return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  // Position icons (same as League Table)
  const getPositionIcon = (position) => {
    if (position === 1) return <Crown className="text-yellow-300" size={16} />;
    if (position === 2) return <Medal className="text-gray-300" size={16} />;
    if (position === 3) return <Award className="text-orange-300" size={16} />;
    return null;
  };

  // Points color class
  const getPointsColorClass = (points) => {
    if (points >= 80) return 'text-green-600';
    if (points >= 60) return 'text-blue-600';
    if (points >= 40) return 'text-gray-700';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            {Array(5).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header - Same style as League Table */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Gameweek History</h2>
              <p className="text-purple-100">
                GW {selectedGameweek} • {gameweekData.length} Managers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
            <Target size={16} />
            <span className="text-sm">
              {selectedGameweekStatus === 'completed' ? 'Completed' : 
               selectedGameweekStatus === 'current' ? 'Live' : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* Quick Stats - Same as League Table */}
        {gameweekStats.highest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{gameweekStats.highest}</div>
              <div className="text-sm opacity-80">Highest Net</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{gameweekStats.average}</div>
              <div className="text-sm opacity-80">Average</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">-{gameweekStats.totalPenalties}</div>
              <div className="text-sm opacity-80">Penalties</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{gameweekStats.totalManagers}</div>
              <div className="text-sm opacity-80">Managers</div>
            </div>
          </div>
        )}
      </div>

      {/* Gameweek Navigation */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
            disabled={selectedGameweek <= 1}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <div className="text-center">
            <div className="font-bold text-lg text-gray-900">Gameweek {selectedGameweek}</div>
            <div className="text-sm text-gray-600">
              {selectedGameweekStatus === 'completed' && '✅ Completed'}
              {selectedGameweekStatus === 'current' && '🔄 Current'}
              {selectedGameweekStatus === 'upcoming' && '⏳ Upcoming'}
            </div>
          </div>
          
          <button
            onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
            disabled={selectedGameweek >= 38}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Table Content - Same style as League Table */}
      <div className="overflow-x-auto">
        {!gameweekData || gameweekData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for Gameweek {selectedGameweek}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {gameweekData.map((manager, index) => {
              const position = manager.currentGWRank; // Use current GW rank
              const prize = position === 1 && selectedGameweekStatus === 'completed' ? 30 : 0;

              return (
                <div key={manager.id || manager.entry} className="hover:bg-gray-50 transition-colors">
                  {/* Main Row - Same layout as League Table */}
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleRowExpansion(manager.id || manager.entry)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Position - Same styling as League Table */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                        ${getPositionStyling(position)}
                      `}>
                        {getPositionIcon(position) || position}
                      </div>

                      {/* Manager Info - Same layout as League Table */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {manager.managerName || manager.name}
                          </h3>
                          {position <= 3 && (
                            <div className="flex">
                              {getPositionIcon(position)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {manager.teamName || manager.entry_name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>GW Rank: #{position}</span>
                          <span>•</span>
                          <span>Overall: #{manager.overallRank?.toLocaleString() || 'N/A'}</span>
                          {prize > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-semibold">৳{prize} Won!</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Points Display - Same layout as League Table */}
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          {/* Raw Points */}
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {manager.rawPoints}
                            </div>
                            <div className="text-xs text-gray-500">Raw</div>
                          </div>

                          {/* Penalties */}
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              manager.transfersCost > 0 ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              -{manager.transfersCost}
                            </div>
                            <div className="text-xs text-gray-500">Penalty</div>
                          </div>

                          {/* Net Points */}
                          <div className="text-center">
                            <div className={`text-xl font-bold ${getPointsColorClass(manager.netPoints)}`}>
                              {manager.netPoints}
                            </div>
                            <div className="text-xs text-gray-500">Net</div>
                          </div>

                          {/* Expand Arrow */}
                          <div className="ml-2">
                            <ChevronRight 
                              className={`text-gray-400 transition-transform ${
                                expandedRow === (manager.id || manager.entry) ? 'rotate-90' : ''
                              }`} 
                              size={20} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row - Same style as League Table */}
                  {expandedRow === (manager.id || manager.entry) && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 animate-fade-in-up">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-purple-600">#{position}</div>
                          <div className="text-xs text-gray-600">GW Rank</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-blue-600">#{manager.overallRank?.toLocaleString() || 'N/A'}</div>
                          <div className="text-xs text-gray-600">Overall Rank</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-green-600">{manager.transfers || 0}</div>
                          <div className="text-xs text-gray-600">Transfers</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-orange-600">{manager.benchPoints || 0}</div>
                          <div className="text-xs text-gray-600">Bench Points</div>
                        </div>
                      </div>

                      {prize > 0 && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <Trophy size={16} />
                            <span className="font-semibold">Weekly Winner - ৳{prize} Prize!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Same style as League Table */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              Gameweek rankings based on net points (raw points - penalties) • Last updated: {new Date().toLocaleString('en-US', { 
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