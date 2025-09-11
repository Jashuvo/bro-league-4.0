import React, { useEffect, useRef } from 'react';

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  const tabRefs = useRef({});
  const indicatorRef = useRef(null);

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    const indicator = indicatorRef.current;
    
    if (activeTabElement && indicator) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      indicator.style.transform = `translateX(${offsetLeft}px)`;
      indicator.style.width = `${offsetWidth}px`;
    }
  }, [activeTab]);

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    
    // Add haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 -mx-4 px-4 py-3">
      <div className="relative">
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 relative overflow-hidden">
          <div
            ref={indicatorRef}
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
            style={{ left: 0, width: 0 }}
          />
          
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => tabRefs.current[tab.id] = el}
              onClick={() => handleTabClick(tab.id)}
              className={`
                relative z-10 flex-1 px-2 md:px-3 py-2 text-sm font-medium rounded-lg
                transition-all duration-300 ease-out
                ${activeTab === tab.id 
                  ? 'text-purple-600' 
                  : 'text-gray-600 hover:text-gray-900'
                }
                active:scale-95 select-none
              `}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base">{tab.icon}</span>
                {/* Desktop: Full name */}
                <span className="hidden lg:inline">{tab.name}</span>
                {/* Tablet: Short name */}
                <span className="hidden sm:inline lg:hidden">{tab.shortName}</span>
                {/* Mobile: Icon only - no text */}
              </div>
              
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg opacity-50" />
              )}
            </button>
          ))}
        </div>
        
        {/* Mobile: Show active tab name below the tabs */}
        <div className="sm:hidden mt-2 text-center">
          <span className="text-xs font-medium text-purple-600">
            {tabs.find(tab => tab.id === activeTab)?.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;