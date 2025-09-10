// src/components/PerformanceMonitor.jsx - Performance Monitoring Component
import React, { useState } from 'react';
import { Activity, Database, Zap, Clock, Server, HardDrive } from 'lucide-react';

const PerformanceMonitor = ({ performanceInfo, dataSource, cacheStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getSourceColor = () => {
    switch (dataSource) {
      case 'cache': return 'text-green-600';
      case 'fresh': return 'text-blue-600';
      case 'stale': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getSourceIcon = () => {
    switch (dataSource) {
      case 'cache': return <HardDrive className="w-4 h-4" />;
      case 'fresh': return <Server className="w-4 h-4" />;
      case 'stale': return <Clock className="w-4 h-4" />;
      case 'error': return <Activity className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-black/90 text-white text-xs rounded-lg shadow-2xl backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div 
          className="p-3 cursor-pointer hover:bg-black/95 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="font-semibold">Performance Monitor</span>
            <span className={`ml-auto ${getSourceColor()}`}>
              {getSourceIcon()}
            </span>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>{performanceInfo?.loadTime || 0}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Server className="w-3 h-3 text-blue-400" />
              <span>{performanceInfo?.serverTime || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3 text-purple-400" />
              <span>{performanceInfo?.managersLoaded || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-700 p-3 space-y-3">
            {/* Data Source */}
            <div>
              <div className="text-gray-400 mb-1">Data Source</div>
              <div className={`font-mono ${getSourceColor()}`}>
                {dataSource.toUpperCase()}
                {performanceInfo?.cacheAge && (
                  <span className="text-gray-400 ml-2">
                    (age: {performanceInfo.cacheAge}s)
                  </span>
                )}
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div>
              <div className="text-gray-400 mb-1">Performance</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Client Load:</span>
                  <span className="font-mono">{performanceInfo?.loadTime || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Server Process:</span>
                  <span className="font-mono">{performanceInfo?.serverTime || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Complete:</span>
                  <span className="font-mono">{performanceInfo?.dataCompleteness || 0}%</span>
                </div>
              </div>
            </div>
            
            {/* Cache Status */}
            {cacheStatus && (
              <div>
                <div className="text-gray-400 mb-1">Cache Status</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Valid Caches:</span>
                    <span className="font-mono">{cacheStatus.validCaches?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Size:</span>
                    <span className="font-mono">{cacheStatus.totalSize || 0}</span>
                  </div>
                  {cacheStatus.performance && (
                    <>
                      <div className="flex justify-between">
                        <span>Avg Response:</span>
                        <span className="font-mono">{cacheStatus.performance.averageDuration}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-mono">{cacheStatus.performance.successRate}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Client Metrics */}
            {performanceInfo?.clientMetrics?.performanceStats && (
              <div>
                <div className="text-gray-400 mb-1">Client Stats</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Avg Duration:</span>
                    <span className="font-mono">
                      {performanceInfo.clientMetrics.performanceStats.averageDuration}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-mono">
                      {performanceInfo.clientMetrics.performanceStats.successRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Requests:</span>
                    <span className="font-mono">
                      {performanceInfo.clientMetrics.performanceStats.totalRequests}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Debug Actions */}
            <div className="pt-2 border-t border-gray-700">
              <button
                onClick={() => {
                  console.log('📊 Performance Info:', performanceInfo);
                  console.log('💾 Cache Status:', cacheStatus);
                  console.log('🔍 Data Source:', dataSource);
                }}
                className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
              >
                Log to Console
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;