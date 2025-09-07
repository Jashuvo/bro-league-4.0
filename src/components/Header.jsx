// src/components/Header.jsx - Enhanced Header Component
import { RefreshCw, Trophy, Zap, Globe, Clock, TrendingUp } from 'lucide-react'

const Header = ({ onRefresh, authStatus, loading, performanceInfo }) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Enhanced Logo */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Trophy className="text-white" size={24} />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center ring-2 ring-white">
                <Zap size={10} className="text-yellow-800" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="hidden sm:inline">BRO League 4.0</span>
                <span className="sm:hidden">BRO 4.0</span>
                {performanceInfo?.cacheHit && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">⚡ Fast</span>
                )}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Fantasy Premier League Championship</p>
            </div>
          </div>
          
          {/* Enhanced Actions */}
          <div className="flex items-center gap-3">
            {/* Performance Indicator */}
            {performanceInfo && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-gray-700">{performanceInfo.loadTime}ms</span>
              </div>
            )}

            {/* Enhanced API Status */}
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
              ${authStatus?.authenticated 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}
            `}>
              <div className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${authStatus?.authenticated 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-amber-500'}
              `}></div>
              <Globe size={14} />
              <span className="hidden sm:inline">
                {authStatus?.authenticated ? 'Live Data' : 'Demo Mode'}
              </span>
              <span className="sm:hidden">
                {authStatus?.authenticated ? 'Live' : 'Demo'}
              </span>
            </div>
            
            {/* Enhanced Refresh Button */}
            <button 
              className={`
                flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 
                text-white rounded-xl hover:from-purple-700 hover:to-blue-700 
                transition-all duration-300 font-medium shadow-lg hover:shadow-xl
                transform hover:scale-105 active:scale-95
                ${loading ? 'opacity-75 cursor-not-allowed' : ''}
              `}
              onClick={onRefresh}
              disabled={loading}
              title={loading ? 'Refreshing data...' : 'Refresh FPL data'}
            >
              <RefreshCw 
                size={16} 
                className={`transition-transform duration-300 ${loading ? 'animate-spin' : 'hover:rotate-180'}`} 
              />
              <span className="hidden sm:inline">
                {loading ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header