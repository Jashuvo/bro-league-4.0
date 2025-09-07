// src/components/AchievementBadges.jsx - Manager Achievement System
import React, { useState } from 'react';
import { 
  Trophy,
  Star,
  Crown,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Award,
  Medal,
  Flame,
  Gem,
  Rocket,
  Lock,
  CheckCircle,
  X
} from 'lucide-react';

const AchievementBadges = ({ 
  standings = [], 
  gameweekInfo = {}, 
  gameweekTable = [],
  leagueStats = {}
}) => {
  const [selectedManager, setSelectedManager] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const currentGW = gameweekInfo.current || 3;

  // Define all possible achievements
  const achievementDefinitions = {
    // Weekly Performance Badges
    centuryMaker: {
      id: 'centuryMaker',
      name: 'Century Maker',
      description: 'Score 100+ points in a single gameweek',
      icon: Trophy,
      color: 'yellow',
      rarity: 'legendary',
      category: 'weekly'
    },
    doubleDigits: {
      id: 'doubleDigits',
      name: 'Double Digits',
      description: 'Score 80+ points in a gameweek',
      icon: Target,
      color: 'blue',
      rarity: 'rare',
      category: 'weekly'
    },
    weeklyWinner: {
      id: 'weeklyWinner',
      name: 'Weekly Champion',
      description: 'Win a gameweek',
      icon: Crown,
      color: 'purple',
      rarity: 'epic',
      category: 'weekly'
    },
    backToBack: {
      id: 'backToBack',
      name: 'Back to Back',
      description: 'Win consecutive gameweeks',
      icon: Flame,
      color: 'orange',
      rarity: 'legendary',
      category: 'weekly'
    },
    
    // Transfer & Strategy Badges
    transferMaster: {
      id: 'transferMaster',
      name: 'Transfer Master',
      description: 'Go 5+ gameweeks without taking hits',
      icon: Shield,
      color: 'green',
      rarity: 'rare',
      category: 'strategy'
    },
    hitKing: {
      id: 'hitKing',
      name: 'Hit King',
      description: 'Take 20+ point hits in a gameweek',
      icon: Zap,
      color: 'red',
      rarity: 'rare',
      category: 'strategy'
    },
    
    // Ranking Badges
    leagueLeader: {
      id: 'leagueLeader',
      name: 'League Leader',
      description: 'Reach #1 in the league',
      icon: Crown,
      color: 'yellow',
      rarity: 'epic',
      category: 'ranking'
    },
    climber: {
      id: 'climber',
      name: 'The Climber',
      description: 'Gain 5+ ranks in a single gameweek',
      icon: TrendingUp,
      color: 'green',
      rarity: 'common',
      category: 'ranking'
    },
    globalElite: {
      id: 'globalElite',
      name: 'Global Elite',
      description: 'Reach top 100k overall rank',
      icon: Star,
      color: 'purple',
      rarity: 'legendary',
      category: 'ranking'
    },
    
    // Milestone Badges
    veteran: {
      id: 'veteran',
      name: 'League Veteran',
      description: 'Played from gameweek 1',
      icon: Medal,
      color: 'gray',
      rarity: 'common',
      category: 'milestone'
    },
    thousandClub: {
      id: 'thousandClub',
      name: '1000 Club',
      description: 'Reach 1000+ total points',
      icon: Gem,
      color: 'blue',
      rarity: 'rare',
      category: 'milestone'
    },
    earlyLeader: {
      id: 'earlyLeader',
      name: 'Early Leader',
      description: 'Lead after gameweek 1',
      icon: Rocket,
      color: 'orange',
      rarity: 'rare',
      category: 'milestone'
    }
  };

  // Calculate achievements for each manager
  const calculateAchievements = (manager) => {
    const achievements = [];
    const managerHistory = manager.historyData || [];
    
    // Weekly performance achievements
    managerHistory.forEach((gw, index) => {
      const netPoints = gw.points - (gw.transferCost || 0);
      
      // Century Maker
      if (netPoints >= 100) {
        achievements.push({
          ...achievementDefinitions.centuryMaker,
          earned: true,
          gameweek: gw.gameweek,
          details: `${netPoints} points in GW${gw.gameweek}`
        });
      }
      
      // Double Digits
      if (netPoints >= 80 && netPoints < 100) {
        achievements.push({
          ...achievementDefinitions.doubleDigits,
          earned: true,
          gameweek: gw.gameweek,
          details: `${netPoints} points in GW${gw.gameweek}`
        });
      }
    });

    // Weekly winner achievements
    const weeklyWins = gameweekTable
      .filter(gwData => {
        if (!gwData.managers || gwData.managers.length === 0) return false;
        
        // Find winner after applying transfer costs
        const managersWithNetPoints = gwData.managers.map(m => ({
          ...m,
          netPoints: (m.points || 0) - (m.transfersCost || m.transferCost || 0)
        })).sort((a, b) => b.netPoints - a.netPoints);
        
        const winner = managersWithNetPoints[0];
        return winner && winner.id === manager.id;
      });

    if (weeklyWins.length > 0) {
      achievements.push({
        ...achievementDefinitions.weeklyWinner,
        earned: true,
        count: weeklyWins.length,
        details: `Won ${weeklyWins.length} gameweek${weeklyWins.length > 1 ? 's' : ''}`
      });

      // Check for back-to-back wins
      for (let i = 0; i < weeklyWins.length - 1; i++) {
        if (weeklyWins[i].gameweek === weeklyWins[i + 1].gameweek - 1) {
          achievements.push({
            ...achievementDefinitions.backToBack,
            earned: true,
            details: `GW${weeklyWins[i + 1].gameweek - 1} & GW${weeklyWins[i + 1].gameweek}`
          });
          break;
        }
      }
    }

    // Transfer master - 5+ GWs without hits
    let consecutiveNoHits = 0;
    let maxConsecutiveNoHits = 0;
    managerHistory.forEach(gw => {
      const transferCost = gw.transferCost || 0;
      if (transferCost === 0) {
        consecutiveNoHits++;
        maxConsecutiveNoHits = Math.max(maxConsecutiveNoHits, consecutiveNoHits);
      } else {
        consecutiveNoHits = 0;
      }
    });

    if (maxConsecutiveNoHits >= 5) {
      achievements.push({
        ...achievementDefinitions.transferMaster,
        earned: true,
        details: `${maxConsecutiveNoHits} gameweeks without hits`
      });
    }

    // Hit King - 20+ point hits
    const bigHits = managerHistory.filter(gw => (gw.transferCost || 0) >= 20);
    if (bigHits.length > 0) {
      achievements.push({
        ...achievementDefinitions.hitKing,
        earned: true,
        count: bigHits.length,
        details: `${bigHits.length} big hit${bigHits.length > 1 ? 's' : ''} taken`
      });
    }

    // League Leader
    if (manager.rank === 1) {
      achievements.push({
        ...achievementDefinitions.leagueLeader,
        earned: true,
        details: 'Current league leader'
      });
    }

    // Global Elite
    if (manager.overallRank && manager.overallRank <= 100000) {
      achievements.push({
        ...achievementDefinitions.globalElite,
        earned: true,
        details: `${manager.overallRank.toLocaleString()} overall rank`
      });
    }

    // Veteran
    if (manager.startedEvent === 1) {
      achievements.push({
        ...achievementDefinitions.veteran,
        earned: true,
        details: 'Playing since gameweek 1'
      });
    }

    // 1000 Club
    if (manager.totalPoints >= 1000) {
      achievements.push({
        ...achievementDefinitions.thousandClub,
        earned: true,
        details: `${manager.totalPoints.toLocaleString()} total points`
      });
    }

    return achievements;
  };

  // Get achievement counts by rarity
  const getAchievementStats = () => {
    const stats = { legendary: 0, epic: 0, rare: 0, common: 0 };
    
    standings.forEach(manager => {
      const achievements = calculateAchievements(manager);
      achievements.forEach(achievement => {
        if (achievement.earned) {
          stats[achievement.rarity]++;
        }
      });
    });
    
    return stats;
  };

  const achievementStats = getAchievementStats();

  // Rarity colors
  const rarityColors = {
    legendary: 'from-yellow-400 to-orange-500',
    epic: 'from-purple-400 to-pink-500',
    rare: 'from-blue-400 to-cyan-500',
    common: 'from-gray-400 to-gray-500'
  };

  const rarityTextColors = {
    legendary: 'text-yellow-600',
    epic: 'text-purple-600',
    rare: 'text-blue-600',
    common: 'text-gray-600'
  };

  const showManagerAchievements = (manager) => {
    setSelectedManager(manager);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Achievement Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="text-yellow-500" size={24} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Achievement System</h2>
            <p className="text-gray-600">Celebrate your FPL milestones and accomplishments</p>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Gem className="text-white" size={20} />
            </div>
            <p className="font-bold text-yellow-600 text-lg">{achievementStats.legendary}</p>
            <p className="text-yellow-700 text-sm">Legendary</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Crown className="text-white" size={20} />
            </div>
            <p className="font-bold text-purple-600 text-lg">{achievementStats.epic}</p>
            <p className="text-purple-700 text-sm">Epic</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="text-white" size={20} />
            </div>
            <p className="font-bold text-blue-600 text-lg">{achievementStats.rare}</p>
            <p className="text-blue-700 text-sm">Rare</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Medal className="text-white" size={20} />
            </div>
            <p className="font-bold text-gray-600 text-lg">{achievementStats.common}</p>
            <p className="text-gray-700 text-sm">Common</p>
          </div>
        </div>
      </div>

      {/* Manager Achievement Grid */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Manager Achievements</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {standings.map(manager => {
            const achievements = calculateAchievements(manager);
            const earnedAchievements = achievements.filter(a => a.earned);
            
            return (
              <div 
                key={manager.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                onClick={() => showManagerAchievements(manager)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {manager.avatar || manager.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{manager.teamName}</h4>
                    <p className="text-gray-600 text-sm">{manager.managerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{earnedAchievements.length}</p>
                    <p className="text-gray-500 text-xs">badges</p>
                  </div>
                </div>

                {/* Achievement Badges Preview */}
                <div className="flex flex-wrap gap-1">
                  {earnedAchievements.slice(0, 6).map((achievement, index) => {
                    const IconComponent = achievement.icon;
                    return (
                      <div 
                        key={`${achievement.id}-${index}`}
                        className={`w-8 h-8 bg-gradient-to-r ${rarityColors[achievement.rarity]} rounded-full flex items-center justify-center shadow-sm`}
                        title={achievement.name}
                      >
                        <IconComponent className="text-white" size={14} />
                      </div>
                    );
                  })}
                  {earnedAchievements.length > 6 && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                      +{earnedAchievements.length - 6}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement Modal */}
      {showModal && selectedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedManager.avatar || selectedManager.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedManager.teamName}</h3>
                    <p className="text-gray-600">{selectedManager.managerName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {Object.values(achievementDefinitions).map(achievementDef => {
                  const managerAchievements = calculateAchievements(selectedManager);
                  const earned = managerAchievements.find(a => a.id === achievementDef.id && a.earned);
                  const IconComponent = achievementDef.icon;

                  return (
                    <div 
                      key={achievementDef.id}
                      className={`p-4 rounded-lg border transition-all ${
                        earned 
                          ? `bg-gradient-to-r from-${achievementDef.color}-50 to-${achievementDef.color}-100 border-${achievementDef.color}-200` 
                          : 'bg-gray-50 border-gray-200 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          earned 
                            ? `bg-gradient-to-r ${rarityColors[achievementDef.rarity]}` 
                            : 'bg-gray-300'
                        }`}>
                          {earned ? (
                            <IconComponent className="text-white" size={20} />
                          ) : (
                            <Lock className="text-gray-500" size={20} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-bold ${earned ? rarityTextColors[achievementDef.rarity] : 'text-gray-500'}`}>
                              {achievementDef.name}
                            </h4>
                            {earned && <CheckCircle className="text-green-500" size={16} />}
                          </div>
                          <p className="text-gray-600 text-sm mb-1">{achievementDef.description}</p>
                          {earned && earned.details && (
                            <p className="text-green-600 text-sm font-medium">{earned.details}</p>
                          )}
                          <p className={`text-xs capitalize ${rarityTextColors[achievementDef.rarity]}`}>
                            {achievementDef.rarity} • {achievementDef.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementBadges;