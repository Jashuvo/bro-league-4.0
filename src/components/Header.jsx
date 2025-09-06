// src/components/Header.jsx
import { RefreshCw, Trophy } from 'lucide-react'

const Header = ({ onRefresh, authStatus }) => {
  return (
    <header className="navbar bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="navbar-start">
        <a className="btn btn-ghost text-xl text-white font-bold">
          <Trophy className="text-yellow-400" size={28} />
          <span className="hidden sm:block">BRO League 4.0</span>
          <span className="sm:hidden">BRO 4.0</span>
        </a>
      </div>
      
      <div className="navbar-end gap-2">
        {/* API Status */}
        <div className={`
          badge badge-sm gap-1 hidden sm:flex
          ${authStatus?.authenticated ? 'badge-success' : 'badge-warning'}
        `}>
          <span className="text-xs">
            {authStatus?.authenticated ? '🟢 Live' : '🟡 Demo'}
          </span>
        </div>
        
        <button 
          className="btn btn-primary btn-sm" 
          onClick={onRefresh}
        >
          <RefreshCw size={16} />
          <span className="hidden sm:block">Refresh</span>
        </button>
      </div>
    </header>
  )
}

export default Header