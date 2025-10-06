"use client";

import { useEffect, useState } from 'react';

export function CookieCleaner() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Only run if there are actual authentication errors in console
    const hasAuthErrors = () => {
      // Check if there are recent console errors related to cookie parsing
      return window.console && 
             document.cookie.includes('sb-') && 
             localStorage.getItem('auth_error_detected') === 'true';
    };

    const cleanCorruptedCookies = () => {
      try {
        // Check if there are any corrupted Supabase cookies
        const cookies = document.cookie.split(';');
        let hasCorruptedCookies = false;

        cookies.forEach(cookie => {
          const [name, value] = cookie.split('=');
          const cookieName = name?.trim();
          
          if (cookieName && cookieName.includes('sb-') && value) {
            try {
              // Try to decode the cookie value
              const decodedValue = decodeURIComponent(value);
              
              // Only check for specific corruption patterns
              if (decodedValue.startsWith('base64-')) {
                const base64Data = decodedValue.substring(7);
                try {
                  const decoded = atob(base64Data);
                  // Only flag as corrupted if it's supposed to be JSON but isn't
                  if (decoded.startsWith('{') || decoded.startsWith('[')) {
                    JSON.parse(decoded);
                  }
                } catch (parseError: any) {
                  // Only flag if it's actually a JSON parsing error
                  if (parseError?.message?.includes('Unexpected token')) {
                    console.log('🧹 Found corrupted base64 cookie:', cookieName, parseError.message);
                    hasCorruptedCookies = true;
                  }
                }
              } else if (decodedValue.startsWith('{') || decodedValue.startsWith('[')) {
                // Only check JSON if it looks like JSON
                try {
                  JSON.parse(decodedValue);
                } catch (parseError: any) {
                  if (parseError?.message?.includes('Unexpected token')) {
                    console.log('🧹 Found corrupted JSON cookie:', cookieName, parseError.message);
                    hasCorruptedCookies = true;
                  }
                }
              }
              // Don't flag other cookie formats as corrupted
            } catch (error: any) {
              // Only flag URL decode errors, not other types
              if (error?.message?.includes('URI malformed')) {
                console.log('🧹 Found malformed cookie:', cookieName);
                hasCorruptedCookies = true;
              }
            }
          }
        });

        if (hasCorruptedCookies) {
          console.log('🧹 Cleaning corrupted Supabase cookies...');
          
          // Clear all Supabase-related cookies
          cookies.forEach(cookie => {
            const [name] = cookie.split('=');
            const cookieName = name?.trim();
            
            if (cookieName && (cookieName.includes('sb-') || cookieName.includes('supabase'))) {
              // Clear with multiple configurations to ensure removal
              const clearConfigs = [
                '',
                '; path=/',
                '; path=/; domain=' + window.location.hostname,
                '; path=/; domain=.' + window.location.hostname
              ];
              
              clearConfigs.forEach(config => {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${config}`;
              });
            }
          });

          // Clear localStorage and sessionStorage
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
              localStorage.removeItem(key);
            }
          });

          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
              sessionStorage.removeItem(key);
            }
          });

          console.log('✅ Corrupted cookies cleaned. Please refresh and log in again.');
          
          // Show modal instead of browser alert
          setShowModal(true);
        }
      } catch (error) {
        console.error('Error cleaning cookies:', error);
      }
    };

    // Only run cleanup if there are detected auth errors
    if (hasAuthErrors()) {
      cleanCorruptedCookies();
    } else {
      console.log('🔍 No authentication errors detected, skipping cookie cleanup');
    }
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in duration-200">
            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Authentication Data Cleaned
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                We've detected and cleaned corrupted authentication data. Please refresh the page and log in again for the best experience.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRefresh}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Refresh Page
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
