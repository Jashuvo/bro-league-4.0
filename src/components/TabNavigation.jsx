
import React, { useEffect, useRef, useState } from 'react';

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  const tabRefs = useRef({});
  const indicatorRef = useRef(null);
  const [touching, setTouching] = useState(false);
  const touchStartTime = useRef(0);

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    const indicator = indicatorRef.current;
    
    if (activeTabElement && indicator) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      indicator.style.transform = `translateX(${offsetLeft}px)`;
      indicator.style.width = `${offsetWidth}px`;
    }
  }, [activeTab]);

  // 🔧 IMPROVED: Better touch handling
  const handleTabInteraction = (tabId, event) => {
    // Prevent default to avoid any conflicts
    event.preventDefault();
    
    // Change tab
    onTabChange(tabId);
    
    // 🔧 NEW: Haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate([10]); // Short vibration
    }
    
    // 🔧 NEW: Visual feedback for touch
    const target = event.currentTarget;
    target.style.transform = 'scale(0.95)';
    setTimeout(() => {
      target.style.transform = '';
    }, 150);
  };

  // 🔧 NEW: Touch-specific handlers
  const handleTouchStart = (tabId, event) => {
    setTouching(true);
    touchStartTime.current = Date.now();
    
    // Visual feedback
    const target = event.currentTarget;
    target.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
  };

  const handleTouchEnd = (tabId, event) => {
    setTouching(false);
    const touchDuration = Date.now() - touchStartTime.current;
    
    // Only trigger if it's a quick tap (not a long press)
    if (touchDuration < 500) {
      handleTabInteraction(tabId, event);
    }
    
    // Clear visual feedback
    const target = event.currentTarget;
    target.style.backgroundColor = '';
  };

  const handleTouchCancel = (event) => {
    setTouching(false);
    // Clear visual feedback
    const target = event.currentTarget;
    target.style.backgroundColor = '';
  };

  // 🔧 NEW: Handle both click and touch events
  const handleClick = (tabId, event) => {
    // Only handle click if we're not currently handling touch
    if (!touching) {
      handleTabInteraction(tabId, event);
    }
  };

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 -mx-4 px-4 py-3 mobile-sticky">
      <div className="relative">
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 relative overflow-hidden tab-navigation">
          <div
            ref={indicatorRef}
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
            style={{ left: 0, width: 0 }}
          />
          
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => tabRefs.current[tab.id] = el}
              onClick={(e) => handleClick(tab.id, e)}
              onTouchStart={(e) => handleTouchStart(tab.id, e)}
              onTouchEnd={(e) => handleTouchEnd(tab.id, e)}
              onTouchCancel={handleTouchCancel}
              className={`
                relative z-10 flex-1 px-2 md:px-3 py-2 text-sm font-medium rounded-lg
                transition-all duration-300 ease-out
                ${activeTab === tab.id 
                  ? 'text-purple-600' 
                  : 'text-gray-600 hover:text-gray-900'
                }
                tab-button mobile-tap-target touch-feedback
                focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                select-none
              `}
              style={{
                // 🔧 IMPORTANT: Ensure proper touch handling
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base" role="img" aria-hidden="true">
                  {tab.icon}
                </span>
                {/* Desktop: Full name */}
                <span className="hidden lg:inline">{tab.name}</span>
                {/* Tablet: Short name */}
                <span className="hidden sm:inline lg:hidden">
                  {tab.shortName || tab.name.split(' ')[0]}
                </span>
                {/* Mobile: Icon only - no text */}
              </div>
              
              {/* 🔧 IMPROVED: Better active state indicator */}
              {activeTab === tab.id && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg opacity-50"
                  aria-hidden="true"
                />
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