// src/components/GameweekTable.jsx - Complete Optimized Version
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Trophy, TrendingUp, Users, Zap, Clock } from 'lucide-react'
import fplApi from '../services/fplApi'

const GameweekTable = ({ gameweekTable, currentGameweek, loading, bootstrap }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek || 3)
  const [futureGameweekCache, setFutureGameweekCache] = useState(new Map())

  // Optimized loading message
  if (!gameweekTable || gameweekTable.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Optimized Gameweek History...</h3>
          <p className="text-gray-500">Fetching data for current gameweeks only (optimized for performance).</p>
        </div>
      </div>
    )
  }

  // Memoized available gameweeks to prevent unnecessary recalculations
  const availableGameweeks = useMemo(() => {
    const weeks = new Set();
    
    // Add loaded gameweeks
    gameweekTable.forEach(gw => weeks.add(gw.gameweek));
    
    // Add future gameweeks up to total if user navigates to them
    const totalGameweeks = bootstrap?.totalGameweeks || 38;
    if (selectedGameweek > currentGameweek) {
      for (let i = currentGameweek + 1; i <= Math.min(selectedGameweek + 2, totalGameweeks); i++) {
        weeks.add(i);
      }
    }
    
    return Array.from(weeks).sort((a, b) => b - a);
  }, [gameweekTable, currentGameweek, selectedGameweek, bootstrap?.totalGameweeks]);

  // Get or generate gameweek data (optimized)
  const getCurrentGameweekData = useMemo(() => {
    // Try to find in loaded data first
    let gameweekData = gameweekTable.find(gw => gw.gameweek === selectedGameweek);
    
    // If not found and it's a future gameweek, generate on-demand
    if (!gameweekData && selectedGameweek > currentGameweek) {
      // Check cache first
      if (futureGameweekCache.has(selectedGameweek)) {
        gameweekData = futureGameweekCache.get(selectedGameweek);
      } else {
        // Generate future gameweek data (empty state)
        gameweekData = {
          gameweek: selectedGameweek,
          status: 'upcoming',
          managers: []
        };
        
        // Cache it
        setFutureGameweekCache(prev => new Map(prev).set(selectedGameweek, gameweekData));
      }
    }
    
    return gameweekData;
  }, [selectedGameweek, gameweekTable, currentGameweek, futureGameweekCache]);

  const currentGameweekData = getCurrentGameweekData;

  const goToPreviousGameweek = () => {
    const currentIndex = availableGameweeks.indexOf(selectedGameweek)
    if (currentIndex < availableGameweeks.length - 1) {
      setSelectedGameweek(availableGameweeks[currentIndex + 1])
    }
  }

  const goToNextGameweek = () => {
    const currentIndex = availableGameweeks.indexOf(selectedGameweek)
    if (currentIndex > 0) {
      setSelectedGameweek(availableGameweeks[currentIndex - 1])
    }
  }

  const getPointsBadgeClass = (points) => {
    if (points >= 80) return 'bg-green-100 text-green-800'
    if (points >= 60) return 'bg-yellow-100 text-yellow-800'
    if (points >= 40) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getTransferDisplay = (transfers, transferCost) => {
    if (transfers === 0) {
      return { text: '0', style: 'text-blue-600', note: '(saved)' }
    } else if (transfers === 1 && transferCost === 0) {
      return { text: '1', style: 'text-green-600', note: '(free)' }
    } else if (transferCost > 0) {
      return { text: transfers.toString(), style: 'text-red-600', note: `(-${transferCost})` }
    }
    return { text: transfers.toString(), style: 'text-gray-600', note: '' }
  }

  // Get gameweek info from bootstrap data
  const gameweekInfo = bootstrap?.gameweeks?.find(gw => gw.id === selectedGameweek)
  const deadline = gameweekInfo?.deadline_time ? 
    new Date(gameweekInfo.deadline_time).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : null

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-lg p-3">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Gameweek {selectedGameweek}</h2>
              <div className="flex items-center gap-4 text-purple-100 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {deadline || 'TBD'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {currentGameweekData?.managers?.length || 0} managers
                </span>
                {selectedGameweek <= currentGameweek && (
                  <span className="bg-green-400/20 px-2 py-1 rounded-full text-xs font-medium">
                    {selectedGameweek === currentGameweek ? 'CURRENT' : 'COMPLETED'}
                  </span>
                )}
                {selectedGameweek > currentGameweek && (
                  <span className="bg-yellow-400/20 px-2 py-1 rounded-full text-xs font-medium">
                    UPCOMING
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={goToPreviousGameweek}
              disabled={availableGameweeks.indexOf(selectedGameweek) >= availableGameweeks.length - 1}
              className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <select 
                value={selectedGameweek}
                onChange={(e) => setSelectedGameweek(Number(e.target.value))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {Array.from({length: bootstrap?.totalGameweeks || 38}, (_, i) => i + 1).map(gw => (
                  <option key={gw} value={gw} className="text-gray-900">
                    GW {gw} {gw === currentGameweek ? '(Current)' : gw < currentGameweek ? '(Completed)' : '(Upcoming)'}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={goToNextGameweek}
              disabled={availableGameweeks.indexOf(selectedGameweek) <= 0}
              className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {currentGameweekData && currentGameweekData.managers && currentGameweekData.managers.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.max(...currentGameweekData.managers.map(m => m.points))}</div>
              <div className="text-purple-200 text-sm">Highest Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(currentGameweekData.managers.reduce((sum, m) => sum + m.points, 0) / currentGameweekData.managers.length)}
              </div>
              <div className="text-purple-200 text-sm">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.min(...currentGameweekData.managers.map(m => m.points))}</div>
              <div className="text-purple-200 text-sm">Lowest Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{currentGameweekData.managers.length}</div>
              <div className="text-purple-200 text-sm">Total Managers</div>
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      {currentGameweekData && currentGameweekData.managers && currentGameweekData.managers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} />
                    Rank
                  </div>
                </th>
                <th className="p-4 text-left font-semibold text-gray-900">Manager</th>
                <th className="p-4 text-left font-semibold text-gray-900 hidden md:table-cell">Team</th>
                <th className="p-4 text-center font-semibold text-gray-900">
                  <div className="flex items-center justify-center gap-2">
                    <Zap size={16} />
                    GW Points
                  </div>
                </th>
                <th className="p-4 text-center font-semibold text-gray-900 hidden sm:table-cell">Transfers</th>
                <th className="p-4 text-center font-semibold text-gray-900 hidden lg:table-cell">Bench</th>
                <th className="p-4 text-center font-semibold text-gray-900">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp size={16} />
                    Total
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentGameweekData.managers.map((manager, index) => {
                const transferInfo = getTransferDisplay(manager.transfers, manager.transferCost)
                
                return (
                  <tr 
                    key={manager.id}
                    className={`
                      border-b border-gray-100 hover:bg-gray-50/50 transition-colors
                      ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    `}
                  >
                    {/* Rank */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`
                          font-bold text-lg
                          ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : index === 2 ? 'text-orange-600' : 'text-gray-700'}
                        `}>
                          {manager.gameweekRank}
                        </span>
                        {index === 0 && <Trophy size={16} className="text-yellow-600" />}
                      </div>
                    </td>

                    {/* Manager */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {manager.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{manager.managerName}</div>
                          <div className="text-sm text-gray-500 md:hidden">{manager.teamName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Team Name */}
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-gray-700">{manager.teamName}</span>
                    </td>

                    {/* Points */}
                    <td className="p-4 text-center">
                      <div className={`
                        inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm
                        ${getPointsBadgeClass(manager.points)}
                      `}>
                        {manager.points >= 80 && <Zap size={12} />}
                        {manager.points}
                      </div>
                    </td>

                    {/* Transfers */}
                    <td className="p-4 text-center hidden sm:table-cell">
                      <div className="flex flex-col items-center">
                        <span className={`font-medium ${transferInfo.style}`}>
                          {transferInfo.text}
                        </span>
                        <span className="text-xs text-gray-500">{transferInfo.note}</span>
                      </div>
                    </td>

                    {/* Bench */}
                    <td className="p-4 text-center hidden lg:table-cell">
                      <span className={`
                        ${manager.bench > 10 ? 'text-red-600 font-semibold' : 'text-gray-600'}
                      `}>
                        {manager.bench}
                      </span>
                    </td>

                    {/* Total Points */}
                    <td className="p-4 text-center">
                      <span className="font-bold text-lg text-gray-900">
                        {manager.totalPoints?.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {selectedGameweek > currentGameweek ? 'Future Gameweek' : 'No Data Available'}
          </h3>
          <p className="text-gray-500">
            {selectedGameweek > currentGameweek 
              ? `Gameweek ${selectedGameweek} hasn't started yet.`
              : `No data available for Gameweek ${selectedGameweek}.`
            }
          </p>
        </div>
      )}

      {/* Optimized Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <Users size={16} />
            <span>
              OPTIMIZED data from FPL API • 
              {gameweekTable.length} gameweeks loaded (up to GW {currentGameweek}) • 
              GW {selectedGameweek} {selectedGameweek <= currentGameweek ? 'completed' : 'upcoming'}
              {selectedGameweek > currentGameweek && ' (generated on-demand)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameweekTable