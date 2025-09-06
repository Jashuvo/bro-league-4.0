// src/components/Header.jsx
import { RefreshCw, Menu, Trophy, Wifi, WifiOff } from 'lucide-react'

const Header = ({ onRefresh, authStatus }) => {
  return (
    <header className="navbar bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden text-white">
            <Menu size={24} />
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><a href="#standings">🏆 Standings</a></li>
            <li><a href="#prizes">💰 Prizes</a></li>
            <li><a href="#monthly">📅 Monthly</a></li>
            <li><a href="#weekly">⚡ Weekly</a></li>
          </ul>
        </div>
        <a className="btn btn-ghost text-xl text-white font-bold">
          <Trophy className="text-yellow-400" size={28} />
          <span className="hidden sm:block">BRO League 4.0</span>
          <span className="sm:hidden">BRO 4.0</span>
        </a>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 text-white">
          <li><a href="#standings" className="hover:text-bro-secondary">🏆 Standings</a></li>
          <li><a href="#prizes" className="hover:text-bro-secondary">💰 Prizes</a></li>
          <li><a href="#monthly" className="hover:text-bro-secondary">📅 Monthly</a></li>
          <li><a href="#weekly" className="hover:text-bro-secondary">⚡ Weekly</a></li>
        </ul>
      </div>
      
      <div className="navbar-end gap-2">
        {/* API Status Indicator */}
        <div className={`
          badge badge-sm gap-1 hidden sm:flex
          ${authStatus?.authenticated ? 'badge-success' : 'badge-warning'}
        `}>
          {authStatus?.authenticated ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="text-xs">
            {authStatus?.authenticated ? 'Live' : 'Demo'}
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