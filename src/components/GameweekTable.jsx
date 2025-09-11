import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Trophy, TrendingUp, Users, Zap, Clock, Crown, Medal, Award, ExternalLink } from 'lucide-react';

const GameweekTable = ({ gameweekTable, currentGameweek, loading, bootstrap }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek || 3);

  const availableGameweeks = useMemo(() => {
    const weeks = new Set();
    gameweekTable.forEach(gw => weeks.add(gw.gameweek));
    
    for (let i = 1; i <= (currentGameweek || 3); i++) {
      weeks.add(i);
    }
    
    return Array.from(weeks).sort((a, b) => b - a);
  }, [gameweekTable, currentGameweek]);

  const getCurrentGameweekData = useMemo(() => {
    let gameweekData = gameweekTable.find(gw => gw.gameweek === selectedGameweek);
    
    if (!gameweekData && selectedGameweek <= (currentGameweek || 3)) {
      gameweekData = {
        gameweek: selectedGameweek,
        status: 'loading',
        managers: []
      };
    }
    
    return gameweekData;
  }, [selectedGameweek, gameweekTable, currentGameweek]);

  const currentGameweekData = getCurrentGameweekData;

  const navigateGameweek = (direction) => {
    const currentIndex = availableGameweeks.indexOf(selectedGameweek);
    if (direction === 'prev' && currentIndex < availableGameweeks.length - 1) {
      setSelectedGameweek(availableGameweeks[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedGameweek(availableGameweeks[currentIndex - 1]);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={16} />;
    if (rank === 2) return <Medal className="text-gray-400" size={16} />;
    if (rank === 3) return <Award className="text-orange-400" size={16} />;
    return <span className="text-gray-600 font-bold text-sm">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading gameweek history...</p>
        </div>
      </div>
    );
  }

  if (!gameweekTable || gameweekTable.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Gameweek History Available</h3>
          <p className="text-gray-500">Gameweek data will appear here as matches are played.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Mobile-Optimized Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Calendar size={20} />
            Gameweek History
          </h2>
          <div className="text-blue-100 text-sm">
            {availableGameweeks.length} gameweeks
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateGameweek('prev')}
            disabled={availableGameweeks.indexOf(selectedGameweek) >= availableGameweeks.length - 1}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">GW {selectedGameweek}</div>
              <div className="text-xs text-gray-500">
                {selectedGameweek === currentGameweek ? 'Current' : 
                 selectedGameweek > currentGameweek ? 'Upcoming' : 'Completed'}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigateGameweek('next')}
            disabled={availableGameweeks.indexOf(selectedGameweek) <= 0}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Mobile-Optimized Quick Stats */}
      {currentGameweekData && currentGameweekData.managers && currentGameweekData.managers.length > 0 && (
        <div className="bg-blue-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="font-bold text-lg text-blue-600">
                {Math.max(...currentGameweekData.managers.map(m => m.gameweekPoints || 0))}
              </div>
              <div className="text-xs text-gray-500">Highest Score</div>
            </div>
            <div>
              <div className="font-bold text-lg text-green-600">
                {Math.round(currentGameweekData.managers.reduce((sum, m) => sum + (m.gameweekPoints || 0), 0) / currentGameweekData.managers.length)}
              </div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
            <div>
              <div className="font-bold text-lg text-orange-600">
                {Math.min(...currentGameweekData.managers.map(m => m.gameweekPoints || 0))}
              </div>
              <div className="text-xs text-gray-500">Lowest Score</div>
            </div>
            <div>
              <div className="font-bold text-lg text-purple-600">
                {currentGameweekData.managers.length}
              </div>
              <div className="text-xs text-gray-500">Managers</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Table */}
      <div className="overflow-hidden">
        {currentGameweekData && currentGameweekData.managers && currentGameweekData.managers.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {currentGameweekData.managers
              .sort((a, b) => (b.gameweekPoints || 0) - (a.gameweekPoints || 0))
              .map((manager, index) => (
                <div
                  key={manager.id}
                  className={`
                    border-b border-gray-100 last:border-b-0 p-4
                    ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-white'}
                    hover:bg-gray-50 transition-colors
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getRankIcon(index + 1)}
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
                        <div className="font-bold text-lg text-blue-600">
                          {manager.gameweekPoints || 0}
                        </div>
                        <div className="text-xs text-gray-500">pts</div>
                      </div>
                      
                      {manager.transfers > 0 && (
                        <div className="text-right hidden sm:block">
                          <div className="text-sm text-red-600">
                            -{manager.transfersCost || 0}
                          </div>
                          <div className="text-xs text-gray-500">hits</div>
                        </div>
                      )}

                      <a
                        href={`https://fantasy.premierleague.com/entry/${manager.entry}/event/${selectedGameweek}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              {selectedGameweek > currentGameweek 
                ? `Gameweek ${selectedGameweek} hasn't started yet.`
                : `No data available for Gameweek ${selectedGameweek}.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Mobile-Friendly Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              Live gameweek data • Last updated: {new Date().toLocaleString('en-US', { 
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