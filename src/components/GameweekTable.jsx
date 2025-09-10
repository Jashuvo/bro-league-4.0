// src/components/GameweekTable.jsx - Gameweek History Table
import React from 'react';
import { Calendar, Trophy, TrendingUp, Users, Crown, Award } from 'lucide-react';

const GameweekTable = ({ gameweekTable = [], standings = [], currentGameweek = 3, loading = false }) => {
  if (loading) {
    return (
      <div className="card bg-white shadow-xl">
        <div className="card-body text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="text-gray-500 mt-4">Loading gameweek data...</p>
        </div>
      </div>
    );
  }

  if (!gameweekTable || gameweekTable.length === 0) {
    return (
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Gameweek Data Available</h3>
            <p className="text-gray-500">
              Gameweek history will appear here as the season progresses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Process gameweek data for display
  const processedGameweeks = gameweekTable.map(gw => {
    const managers = gw.managers || [];
    const sortedManagers = [...managers].sort((a, b) => b.points - a.points);
    
    return {
      ...gw,
      winner: sortedManagers[0],
      runnerUp: sortedManagers[1],
      third: sortedManagers[2],
      averageScore: managers.length > 0 
        ? Math.round(managers.reduce((sum, m) => sum + m.points, 0) / managers.length)
        : 0,
      participantCount: managers.length
    };
  });

  return (
    <div className="card bg-white shadow-xl">
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-purple-600" size={24} />
            Gameweek History
            <div className="badge badge-primary">GW 1-{currentGameweek}</div>
          </h3>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-green-500/20 text-gray-700 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live Data</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left">GW</th>
                <th className="text-left">Winner</th>
                <th className="text-center">Points</th>
                <th className="text-left hidden md:table-cell">Runner-up</th>
                <th className="text-center hidden md:table-cell">Points</th>
                <th className="text-center">Avg</th>
                <th className="text-center hidden sm:table-cell">Players</th>
              </tr>
            </thead>
            <tbody>
              {processedGameweeks.map((gw, index) => (
                <tr key={gw.gameweek} className="hover">
                  <td className="font-bold">
                    <div className="flex items-center gap-2">
                      {gw.gameweek === currentGameweek && (
                        <div className="badge badge-success badge-sm">Current</div>
                      )}
                      GW{gw.gameweek}
                    </div>
                  </td>
                  <td>
                    {gw.winner ? (
                      <div className="flex items-center gap-2">
                        <Crown className="text-yellow-500" size={16} />
                        <span className="font-semibold">{gw.winner.name || gw.winner.managerName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    {gw.winner ? (
                      <span className="font-bold text-green-600">{gw.winner.points}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell">
                    {gw.runnerUp ? (
                      <div className="flex items-center gap-2">
                        <Award className="text-gray-400" size={16} />
                        <span>{gw.runnerUp.name || gw.runnerUp.managerName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-center hidden md:table-cell">
                    {gw.runnerUp ? (
                      <span className="text-blue-600">{gw.runnerUp.points}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="text-gray-600">{gw.averageScore || 0}</span>
                  </td>
                  <td className="text-center hidden sm:table-cell">
                    <span className="text-gray-500">{gw.participantCount}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...processedGameweeks.map(gw => gw.winner?.points || 0))}
              </div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(
                  processedGameweeks.reduce((sum, gw) => sum + (gw.averageScore || 0), 0) / 
                  (processedGameweeks.length || 1)
                )}
              </div>
              <div className="text-sm text-gray-600">Overall Average</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {processedGameweeks.length}
              </div>
              <div className="text-sm text-gray-600">Gameweeks Played</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {38 - processedGameweeks.length}
              </div>
              <div className="text-sm text-gray-600">Gameweeks Remaining</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameweekTable;