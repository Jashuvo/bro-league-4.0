// src/components/GameweekTable.jsx
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Trophy, TrendingUp, Users } from 'lucide-react'

const GameweekTable = ({ gameweekTable, currentGameweek }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek || 3)

  if (!gameweekTable || gameweekTable.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Gameweek Data Available</h3>
          <p className="text-gray-500">Gameweek history will appear here once data is loaded.</p>
        </div>
      </div>
    )
  }

  const currentGameweekData = gameweekTable.find(gw => gw.gameweek === selectedGameweek)
  const availableGameweeks = gameweekTable.map(gw => gw.gameweek).sort((a, b) => b - a)

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

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Calendar className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Gameweek Points Table</h2>
              <p className="text-indigo-100 text-sm">Weekly performance breakdown</p>
            </div>
          </div>
          
          {/* Gameweek Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousGameweek}
              disabled={availableGameweeks.indexOf(selectedGameweek) === availableGameweeks.length - 1}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all duration-200"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-white font-bold">GW {selectedGameweek}</span>
            </div>
            
            <button
              onClick={goToNextGameweek}
              disabled={availableGameweeks.indexOf(selectedGameweek) === 0}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all duration-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Gameweek Quick Stats */}
      {currentGameweekData && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...currentGameweekData.managers.map(m => m.points))}
              </div>
              <div className="text-sm text-gray-600">Highest Score</div>
              <div className="text-xs text-gray-500">
                {currentGameweekData.managers.find(m => 
                  m.points === Math.max(...currentGameweekData.managers.map(m => m.points))
                )?.managerName}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(currentGameweekData.managers.reduce((sum, m) => sum + m.points, 0) / currentGameweekData.managers.length)}
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
              <div className="text-xs text-gray-500">League average</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.min(...currentGameweekData.managers.map(m => m.points))}
              </div>
              <div className="text-sm text-gray-600">Lowest Score</div>
              <div className="text-xs text-gray-500">
                {currentGameweekData.managers.find(m => 
                  m.points === Math.min(...currentGameweekData.managers.map(m => m.points))
                )?.managerName}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {currentGameweekData.managers.filter(m => m.points >= 60).length}
              </div>
              <div className="text-sm text-gray-600">60+ Points</div>
              <div className="text-xs text-gray-500">Good performances</div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {currentGameweekData ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">GW Rank</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Manager</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm hidden md:table-cell">Team</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">GW Points</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden sm:table-cell">Transfers</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Bench</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {currentGameweekData.managers.map((manager, index) => (
                <tr 
                  key={manager.id}
                  className={`
                    border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150
                    ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  `}
                >
                  {/* GW Rank */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`
                        font-bold text-lg
                        ${index === 0 ? 'text-yellow-600' : 
                          index === 1 ? 'text-gray-600' : 
                          index === 2 ? 'text-orange-600' : 'text-gray-700'}
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

                  {/* GW Points */}
                  <td className="p-4 text-center">
                    <div className={`
                      inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm
                      ${getPointsBadgeClass(manager.points)}
                    `}>
                      {manager.points >= 80 && <TrendingUp size={12} />}
                      {manager.points}
                    </div>
                  </td>

                  {/* Transfers */}
                  <td className="p-4 text-center hidden sm:table-cell">
                    <span className={`
                      font-medium
                      ${manager.transfers > 1 ? 'text-red-600' : 'text-gray-700'}
                    `}>
                      {manager.transfers}
                      {manager.transferCost > 0 && (
                        <span className="text-red-500 text-xs ml-1">(-{manager.transferCost})</span>
                      )}
                    </span>
                  </td>

                  {/* Bench Points */}
                  <td className="p-4 text-center hidden lg:table-cell">
                    <span className="text-gray-600">{manager.bench}</span>
                  </td>

                  {/* Total Points */}
                  <td className="p-4 text-center">
                    <span className="font-bold text-lg text-gray-900">
                      {manager.totalPoints?.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-500">No data available for Gameweek {selectedGameweek}</p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <Users size={16} />
            <span>
              Showing Gameweek {selectedGameweek} results • 
              {availableGameweeks.length} gameweeks available
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameweekTable