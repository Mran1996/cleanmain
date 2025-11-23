"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

export function ServiceBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Check localStorage for banner visibility preference
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    try {
    const bannerHidden = localStorage.getItem('service-banner-hidden')
    if (bannerHidden === 'true') {
      setIsVisible(false)
      }
    } catch (error) {
      console.error('Failed to access localStorage:', error)
    }
  }, [])

  const handleHide = () => {
    setIsVisible(false)
    if (typeof window !== 'undefined') {
      try {
    localStorage.setItem('service-banner-hidden', 'true')
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    }
  }

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white relative overflow-hidden max-w-full">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10"></div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-2 md:px-4 py-3 max-w-full">
          <div className="flex items-center justify-between gap-2">
            {/* Main content */}
            <div className="flex-1 text-center min-w-0">
              <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 flex-wrap">
                <span className="text-amber-300 font-bold text-sm md:text-lg">✨</span>
                <span className="font-bold text-sm md:text-lg">Let us handle it for you!</span>
                <span className="text-amber-300 font-bold text-sm md:text-lg">✨</span>
              </div>
              
              {!isCollapsed && (
                <div className="text-xs md:text-sm text-slate-200 px-1">
                  We now offer a <span className="font-semibold text-amber-300">full service option</span> - 
                  document preparation, legal analysis, and more - 
                  <span className="font-bold text-amber-300"> starting at $499</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {!isCollapsed && (
                <Link href="/learn-more">
                  <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm transition-colors whitespace-nowrap">
                    Learn More
                  </button>
                </Link>
              )}
              
              {/* Toggle collapse button */}
              <button
                onClick={handleToggle}
                className="p-1 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                aria-label={isCollapsed ? "Expand banner" : "Collapse banner"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              
              {/* Close button */}
              <button
                onClick={handleHide}
                className="p-1 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                aria-label="Hide banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
