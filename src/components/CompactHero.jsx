import React, { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, Zap, Clock } from 'lucide-react';

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
    if (!authStatus.authenticated) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!authStatus.authenticated) return <WifiOff size={12} />;
    return <Wifi size={12} />;
  };

  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-50 
        bg-white/95 backdrop-blur-md border-b border-gray-200
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        ${isCompact ? 'py-3' : 'py-4'}
      `}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BR</span>
              </div>
              {!isCompact && (
                <div>
                  <h1 className="font-bold text-gray-900 text-lg">BRO League 4.0</h1>
                  <p className="text-xs text-gray-500">Fantasy Premier League</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <span className="text-gray-600 hidden sm:inline">
                {authStatus.authenticated ? 'Live' : 'Offline'}
              </span>
            </div>

            {performanceInfo && (
              <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
                <Zap size={12} />
                <span>{performanceInfo.loadTime}ms</span>
              </div>
            )}

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                bg-gradient-to-r from-purple-600 to-blue-600 text-white
                hover:from-purple-700 hover:to-blue-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 text-sm font-medium
                shadow-lg hover:shadow-xl
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
          <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
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