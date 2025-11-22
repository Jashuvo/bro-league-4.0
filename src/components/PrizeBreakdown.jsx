import React from 'react';
import { X, Trophy, Calendar, Zap, DollarSign, Award, Medal, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';

const PrizeBreakdown = ({ managerName, teamName, prizeData, onClose }) => {
  if (!prizeData) return null;

  const { weeklyWins = [], monthlyWins = [], totalPrizes = 0 } = prizeData;

  const getMonthName = (monthNum) => {
    const monthNames = [
      'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5',
      'Month 6', 'Month 7', 'Month 8', 'Month 9 (Final)'
    ];
    return monthNames[monthNum - 1] || `Month ${monthNum}`;
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <Crown size={18} className="text-yellow-400 fill-yellow-400" />;
    if (position === 2) return <Medal size={18} className="text-gray-300 fill-gray-300" />;
    if (position === 3) return <Award size={18} className="text-orange-400 fill-orange-400" />;
    return null;
  };

  const getPositionLabel = (position) => {
    if (position === 1) return '1st Place';
    if (position === 2) return '2nd Place';
    if (position === 3) return '3rd Place';
    return `${position}th Place`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-bro-primary to-bro-secondary p-6 text-white sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Trophy size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold">{managerName}</h2>
                    <p className="text-white/80 text-sm">{teamName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Total Summary */}
              <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-3">
                  <DollarSign size={24} />
                  <div>
                    <div className="text-sm text-white/80">Total Prizes Won</div>
                    <div className="text-3xl font-bold">৳{totalPrizes}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/80">Wins</div>
                  <div className="text-2xl font-bold">{weeklyWins.length + monthlyWins.length}</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* No Prizes Message */}
              {weeklyWins.length === 0 && monthlyWins.length === 0 && (
                <div className="text-center py-12">
                  <Trophy size={48} className="text-bro-muted mx-auto mb-4 opacity-50" />
                  <p className="text-bro-muted text-lg">No prizes won yet</p>
                  <p className="text-bro-muted text-sm mt-2">Keep playing to win weekly and monthly prizes!</p>
                </div>
              )}

              {/* Weekly Prizes */}
              {weeklyWins.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Zap className="text-blue-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-base-content">Weekly Prizes</h3>
                      <p className="text-bro-muted text-sm">{weeklyWins.length} gameweek{weeklyWins.length !== 1 ? 's' : ''} won • ৳{weeklyWins.reduce((sum, w) => sum + w.prize, 0)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {weeklyWins.map((win, index) => (
                      <motion.div
                        key={`weekly-${win.gameweek}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-base-content/5 border border-base-content/10 hover:bg-base-content/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="primary" className="text-xs">
                            GW {win.gameweek}
                          </Badge>
                          <Trophy size={14} className="text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="text-sm text-bro-muted mb-1">{win.points} points</div>
                        <div className="text-xl font-bold text-green-400">৳{win.prize}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Prizes */}
              {monthlyWins.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Calendar className="text-green-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-base-content">Monthly Prizes</h3>
                      <p className="text-bro-muted text-sm">{monthlyWins.length} month{monthlyWins.length !== 1 ? 's' : ''} won • ৳{monthlyWins.reduce((sum, w) => sum + w.prize, 0)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {monthlyWins.map((win, index) => (
                      <motion.div
                        key={`monthly-${win.month}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-5 rounded-xl bg-base-content/5 border border-base-content/10 hover:bg-base-content/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="success" className="text-xs">
                              {getMonthName(win.month)}
                            </Badge>
                            {getPositionIcon(win.position)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-bro-muted mb-1">{getPositionLabel(win.position)}</div>
                            <div className="text-sm text-base-content">{win.points} points</div>
                          </div>
                          <div className="text-2xl font-bold text-green-400">৳{win.prize}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrizeBreakdown;
