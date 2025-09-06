// src/components/Header.jsx
import { RefreshCw, Trophy, Zap, Globe } from 'lucide-react'

const Header = ({ onRefresh, authStatus, loading }) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Trophy className="text-white" size={20} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <Zap size={8} className="text-yellow-800" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">BRO League 4.0</span>
                <span className="sm:hidden">BRO 4.0</span>
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Fantasy Premier League</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* API Status */}
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              ${authStatus?.authenticated 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'}
            `}>
              <div className={`
                w-2 h-2 rounded-full
                ${authStatus?.authenticated 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-yellow-500'}
              `}></div>
              <Globe size={14} />
              <span className="hidden sm:inline">
                {authStatus?.authenticated ? 'Live Data' : 'Demo Mode'}
              </span>
              <span className="sm:hidden">
                {authStatus?.authenticated ? 'Live' : 'Demo'}
              </span>
            </div>
            
            {/* Refresh Button */}
            <button 
              className={`
                flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 
                text-white rounded-lg hover:from-purple-700 hover:to-blue-700 
                transition-all duration-200 font-medium shadow-md hover:shadow-lg
                ${loading ? 'opacity-75 cursor-not-allowed' : ''}
              `}
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw 
                size={16} 
                className={loading ? 'animate-spin' : ''} 
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