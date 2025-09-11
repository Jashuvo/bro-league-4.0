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
                relative z-10 flex-1 px-3 py-2 text-sm font-medium rounded-lg
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
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.shortName}</span>
              </div>
              
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg opacity-50" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;