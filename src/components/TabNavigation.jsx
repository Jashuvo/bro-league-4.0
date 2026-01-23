import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  const [hoveredTab, setHoveredTab] = useState(null);

  return (
    <div className="sticky top-20 z-40 bg-base-100/80 backdrop-blur-xl border-b border-base-content/5 -mx-4 px-4 py-3 transition-colors duration-300">
      <div className="relative max-w-4xl mx-auto">
        <div className="flex space-x-1 bg-base-200/50 rounded-xl p-1 relative overflow-hidden border border-base-content/5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                aria-label={tab.name}
                className={`
                  relative z-10 flex-1 px-2 md:px-4 py-2.5 text-sm font-medium rounded-lg
                  transition-colors duration-200 ease-out flex items-center justify-center gap-2
                  ${isActive ? 'text-white' : 'text-bro-muted hover:text-white'}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-bro-primary
                `}
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-bro-primary rounded-lg shadow-lg shadow-bro-primary/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Hover Effect */}
                {isHovered && !isActive && (
                  <motion.div
                    layoutId="hoverTab"
                    className="absolute inset-0 bg-white/5 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                <span className="relative z-10 text-lg">{tab.icon}</span>
                <span className="relative z-10 hidden md:inline">{tab.name}</span>
                <span className="relative z-10 hidden sm:inline md:hidden">{tab.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile: Show active tab name below the tabs */}
        <div className="sm:hidden mt-2 text-center">
          <motion.span
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-bro-primary uppercase tracking-wider"
          >
            {tabs.find(tab => tab.id === activeTab)?.name}
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;