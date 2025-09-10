// src/components/LoadingSpinner.jsx - Loading Spinner Component
import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'default' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-16 h-16'
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200`}></div>
        
        {/* Spinning ring */}
        <div 
          className={`absolute top-0 left-0 ${sizeClasses[size]} rounded-full border-4 border-purple-600 border-t-transparent animate-spin`}
        ></div>
        
        {/* Inner pulse */}
        <div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-600 rounded-full animate-pulse`}
        ></div>
      </div>
      
      {message && (
        <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
      
      {/* Loading dots */}
      <div className="flex gap-1 mt-2">
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;