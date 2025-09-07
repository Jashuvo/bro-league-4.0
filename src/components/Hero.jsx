// src/components/Hero.jsx - Enhanced Hero Section with League Highlights
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Clock, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  Star,
  Calendar,
  Award,
  ChevronRight
} from 'lucide-react';

const Hero = ({ 
  standings = [], 
  gameweekInfo = {}, 
  leagueStats = {}, 
  bootstrap = {}, 
  authStatus = {} 
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  const leagueName = import.meta.env.VITE_LEAGUE_NAME || "BRO League 4.0";
  const currentGW = gameweekInfo.current || 3;
  const totalGW = gameweekInfo.total || 38;
  
  // Get current leader
  const currentLeader = standings.length > 0 ? standings[0] : null;
  
  // Get next deadline
  const nextGameweek = bootstrap.gameweeks?.find(gw => 
    gw.id === currentGW + 1 || (gw.id === currentGW && !gw.finished)
  );
  const nextDeadline = nextGameweek?.deadline_time;
  
  // League progress
  const progress = (currentGW / totalGW) * 100;
  
  // Global vs League comparison
  const globalAverage = nextGameweek?.average_entry_score || 48;
  const leagueAverage = leagueStats.averageGameweek || 45;
  const isLeagueAboveAverage = leagueAverage > globalAverage;
  
  // Countdown timer
  useEffect(() => {
    if (!nextDeadline) return;
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadline = new Date(nextDeadline).getTime();
      const difference = deadline - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      } else {
        setTimeLeft('Deadline passed');
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [nextDeadline]);

  return (
    <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          {/* League Title */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-4">
              <Trophy className="text-yellow-400" size={20} />
              <span className="text-yellow-300 font-semibold text-sm">Fantasy Premier League</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {leagueName.split(' ').slice(0, 2).join(' ')}
            </span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {leagueName.split(' ').slice(2).join(' ')}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-xl mx-auto">
            {leagueStats.totalManagers || 15} Managers • {totalGW} Gameweeks • £{(import.meta.env.VITE_TOTAL_PRIZE_POOL || 12000).toLocaleString()} Prize Pool
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Leader */}
          {currentLeader && authStatus?.authenticated && (
            <div className="lg:col-span-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-300/30 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {currentLeader.avatar || currentLeader.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <Crown size={12} className="text-yellow-800" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-yellow-300 text-sm font-semibold flex items-center gap-1">
                    <Trophy size={14} />
                    Current Leader
                  </p>
                  <h3 className="text-white font-bold text-xl">{currentLeader.teamName}</h3>
                  <p className="text-blue-200">{currentLeader.managerName}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="bg-white/20 rounded-lg px-3 py-1">
                      <span className="text-white font-bold text-lg">{currentLeader.totalPoints?.toLocaleString()}</span>
                      <span className="text-blue-200 text-sm ml-1">pts</span>
                    </div>
                    <div className="bg-white/20 rounded-lg px-3 py-1">
                      <span className="text-white font-bold">{currentLeader.gameweekPoints}</span>
                      <span className="text-blue-200 text-sm ml-1">GW{currentGW}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Deadline */}
          {nextDeadline && authStatus?.authenticated && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-300/30 rounded-xl p-6">
              <div className="text-center">
                <Clock className="mx-auto text-red-300 mb-2" size={24} />
                <p className="text-red-300 text-sm font-semibold">Next Deadline</p>
                <p className="text-white font-bold text-lg">{timeLeft}</p>
                <p className="text-blue-200 text-sm">GW{currentGW + 1}</p>
              </div>
            </div>
          )}

          {/* League vs Global */}
          <div className={`backdrop-blur-md border rounded-xl p-6 ${
            isLeagueAboveAverage 
              ? 'bg-green-500/20 border-green-300/30' 
              : 'bg-blue-500/20 border-blue-300/30'
          }`}>
            <div className="text-center">
              <TrendingUp className={`mx-auto mb-2 ${isLeagueAboveAverage ? 'text-green-300' : 'text-blue-300'}`} size={24} />
              <p className={`text-sm font-semibold ${isLeagueAboveAverage ? 'text-green-300' : 'text-blue-300'}`}>
                {isLeagueAboveAverage ? 'Above Average' : 'League Average'}
              </p>
              <p className="text-white font-bold text-lg">{leagueAverage}</p>
              <p className="text-blue-200 text-sm">vs {globalAverage} global</p>
            </div>
          </div>
        </div>

        {/* Season Progress */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-300" size={20} />
              <div>
                <h3 className="text-white font-semibold">Season Progress</h3>
                <p className="text-blue-200 text-sm">Gameweek {currentGW} of {totalGW}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-xl">{progress.toFixed(1)}%</p>
              <p className="text-blue-200 text-sm">Complete</p>
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-blue-300 mt-2">
            <span>GW1</span>
            <span className="font-semibold text-white">GW{currentGW}</span>
            <span>GW{totalGW}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <Users className="mx-auto text-blue-300 mb-2" size={20} />
            <p className="text-white font-bold text-lg">{leagueStats.totalManagers || 15}</p>
            <p className="text-blue-200 text-sm">Managers</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <Target className="mx-auto text-purple-300 mb-2" size={20} />
            <p className="text-white font-bold text-lg">{leagueStats.highestTotal || 0}</p>
            <p className="text-blue-200 text-sm">Highest Total</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <Zap className="mx-auto text-yellow-300 mb-2" size={20} />
            <p className="text-white font-bold text-lg">{leagueStats.highestGameweek || 0}</p>
            <p className="text-blue-200 text-sm">Best GW</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <Star className="mx-auto text-orange-300 mb-2" size={20} />
            <p className="text-white font-bold text-lg">{leagueStats.veteranManagers || 0}</p>
            <p className="text-blue-200 text-sm">Veterans</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            authStatus.authenticated 
              ? 'bg-green-500/20 border border-green-300/30' 
              : 'bg-red-500/20 border border-red-300/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              authStatus.authenticated ? 'bg-green-400' : 'bg-red-400'
            } animate-pulse`}></div>
            <span className={`text-sm font-medium ${
              authStatus.authenticated ? 'text-green-300' : 'text-red-300'
            }`}>
              {authStatus.message || 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;