// src/components/Footer.jsx - Enhanced Footer Component
import React from 'react';
import { Trophy, Star, Clock, Zap } from 'lucide-react';

const Footer = ({ 
  standings = [], 
  gameweekInfo = {}, 
  leagueStats = {},
  lastUpdated = null,
  performanceInfo = null
}) => {
  const leagueName = import.meta.env.VITE_LEAGUE_NAME || "BRO League 4.0";
  const totalPrizePool = import.meta.env.VITE_TOTAL_PRIZE_POOL || 12000;

  return (
    <footer className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* League Info */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <Trophy className="text-yellow-400" size={24} />
              <h3 className="text-2xl font-bold">{leagueName}</h3>
            </div>
            <p className="text-gray-300 mb-4">
              The ultimate Fantasy Premier League competition among friends. 
              {standings.length} bros, one champion, endless memories.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                £{totalPrizePool.toLocaleString()} Prize Pool
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {standings.length} Managers
              </span>
            </div>
          </div>

          {/* Season Stats */}
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-4 text-yellow-300">Season Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Current Gameweek:</span>
                <span className="text-white font-semibold">GW{gameweekInfo.current || 3}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">League Average:</span>
                <span className="text-white font-semibold">{leagueStats.averageScore || 0} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Highest Total:</span>
                <span className="text-white font-semibold">{leagueStats.highestTotal || 0} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Best Gameweek:</span>
                <span className="text-white font-semibold">{leagueStats.highestGameweek || 0} pts</span>
              </div>
            </div>
          </div>

          {/* Tech Info */}
          <div className="text-center md:text-right">
            <h4 className="text-lg font-semibold mb-4 text-yellow-300">Powered By</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>⚡ Vercel Serverless Functions</p>
              <p>🔄 Real-time FPL API</p>
              <p>⚛️ React + Vite</p>
              <p>🎨 Tailwind CSS</p>
            </div>
            {performanceInfo && (
              <div className="mt-4 bg-white/10 rounded-lg p-3">
                <p className="text-xs text-gray-300">
                  ⚡ {performanceInfo.loadTime}ms load time
                  {performanceInfo.cacheHit && ' (cached)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8 text-center">
          <div className="text-sm text-center">
            <span className="text-green-400">Assalamualaikum wa rahmatullahi wa barakatuh</span>
          </div>
          <div className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-2">
            <Clock size={14} />
            <span>
              Last updated: {lastUpdated ? lastUpdated.toLocaleString('en-US', {
                timeZone: 'Asia/Dhaka',
                dateStyle: 'short',
                timeStyle: 'short'
              }) : 'Never'} BD
            </span>
          </div>
        </div>

        {/* Inspirational Quote */}
        <div className="text-center mt-6 p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-400/30">
          <div className="text-sm text-gray-300 mb-2">
            "May your captain always return, your differentials always haul, and your rivals always blank!"
          </div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Star size={12} />
            <span>Ancient FPL Wisdom 🏆⚽</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;