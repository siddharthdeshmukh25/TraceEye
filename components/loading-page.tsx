"use client";

import { useEffect } from "react";

export default function LoadingPage() {
  useEffect(() => {
    // Add loading animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .loading-ring {
        animation: spin 1.5s linear infinite;
      }
      
      .loading-favicon {
        animation: pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
      <div className="relative flex items-center justify-center">
        {/* Outer loading ring */}
        <div className="loading-ring absolute w-32 h-32 border-4 border-emerald-200 rounded-full"></div>
        
        {/* Inner loading ring */}
        <div className="loading-ring absolute w-24 h-24 border-4 border-emerald-400 rounded-full border-t-transparent"></div>
        
        {/* Favicon in center */}
        <div className="loading-favicon relative z-10">
          <img 
            src="/images/favicon.png" 
            alt="Loading..." 
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="absolute bottom-20 text-center">
        <p className="text-sm font-semibold text-emerald-700 animate-pulse">
          Loading your workspace...
        </p>
      </div>
    </div>
  );
}