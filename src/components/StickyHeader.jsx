import React, { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, Zap, Clock, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const StickyHeader = ({
  authStatus,
  isRefreshing,
  onRefresh,
  performanceInfo,
  lastUpdated
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isCompact, setIsCompact] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setIsVisible(true);
        setIsCompact(false);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
        setIsCompact(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const getStatusColor = () => {
    if (!authStatus?.authenticated) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 
        bg-base-100/95 backdrop-blur-md border-b border-base-content/10
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        ${isCompact ? 'py-2' : 'py-4'}
      `}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs">BR</span>
              </div>
              {!isCompact && (
                <div>
                  <h1 className="font-bold text-base-content text-lg leading-none">BRO League 4.0</h1>
                  <p className="text-xs text-base-content/60">Fantasy Premier League</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <span className="text-base-content/60 hidden sm:inline">
                {authStatus?.authenticated ? 'Live' : 'Offline'}
              </span>
            </div>

            {performanceInfo && (
              <div className="hidden md:flex items-center gap-1 text-xs text-base-content/50">
                <Zap size={12} />
                <span>{performanceInfo.loadTime}ms</span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-base-200 hover:bg-base-300 text-base-content transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                bg-gradient-to-r from-purple-600 to-blue-600 text-white
                hover:from-purple-700 hover:to-blue-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 text-sm font-medium
                shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
              `}
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>

        {lastUpdated && !isCompact && (
          <div className="flex items-center justify-center mt-2 text-xs text-base-content/40">
            <Clock size={10} className="mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString('en-US', {
              timeZone: 'Asia/Dhaka',
              timeStyle: 'short'
            })} BD
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyHeader;