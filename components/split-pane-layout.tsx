"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageSquare, FileText, GripVertical, Bot, FileCheck, Maximize2, Minimize2 } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface SplitPaneLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftTitle?: string;
  rightTitle?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function SplitPaneLayout({
  leftContent,
  rightContent,
  leftTitle = "Ask AI Legal",
  rightTitle = "Legal Document",
  isCollapsed = false,
  onToggleCollapse,
  className = ""
}: SplitPaneLayoutProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(isCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [activePane, setActivePane] = useState<'chat' | 'document'>('chat'); // Mobile: default to chat
  const [leftPanelSize, setLeftPanelSize] = useState(45); // Track panel sizes
  const containerRef = useRef<HTMLDivElement>(null);
  
  const collapsed = onToggleCollapse ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => {
    setInternalCollapsed(!internalCollapsed);
  });

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`min-h-full flex flex-col bg-white transition-all duration-300 ease-in-out ${className}`}>
      {/* Improved Header - Cleaner and more functional */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white z-10">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              Ask AI Legal™
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">Where Law Meets Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* Status Indicators - Cleaner design */}
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-2.5 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-700">AI Active</span>
              </div>
            </div>
          )}
          
          {/* Mobile: Tab buttons for switching between panes */}
          {isMobile ? (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActivePane('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activePane === 'chat'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActivePane('document')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activePane === 'document'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Document</span>
              </button>
            </div>
          ) : (
            // Desktop: Toggle button with better visibility
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCollapse}
              className="border-gray-300 hover:bg-gray-50 hover:border-emerald-300 rounded-lg px-3 py-1.5 transition-all"
              title={collapsed ? "Expand chat panel" : "Collapse chat panel"}
            >
              {collapsed ? (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Show Chat</span>
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Hide Chat</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Main Content Area with better visual separation */}
      <div ref={containerRef} className="flex-1 bg-gray-50">
        {isMobile ? (
          /* Mobile: Show only active pane with full screen experience */
          <>
            {activePane === 'chat' && (
              <div className="w-full min-h-full bg-white">
                <div className="min-h-full">
                  {leftContent}
                </div>
              </div>
            )}
            {activePane === 'document' && (
              <div className="w-full min-h-full bg-white">
                <div className="min-h-full">
                  {rightContent}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop: Enhanced Resizable panels with better visual separation */
          <ResizablePanelGroup 
            direction="horizontal" 
            className="min-h-full"
            onLayout={(sizes) => {
              if (sizes.length > 0 && !collapsed) {
                setLeftPanelSize(sizes[0]);
              }
            }}
          >
            {!collapsed && (
              <>
                <ResizablePanel 
                  defaultSize={45} 
                  minSize={30} 
                  maxSize={70}
                  className="min-w-[320px]"
                >
                  <div className="min-h-full flex flex-col bg-white border-r border-gray-200">
                    <div className="flex-1">
                      {leftContent}
                    </div>
                  </div>
                </ResizablePanel>
                
                {/* Enhanced Resizable Handle - More visible and interactive */}
                <ResizableHandle className="w-2 bg-gray-100 hover:bg-emerald-100 group transition-colors relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-12 bg-gray-300 group-hover:bg-emerald-400 rounded-full transition-colors"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-5 w-5 text-emerald-600" />
                  </div>
                </ResizableHandle>
              </>
            )}
            
            <ResizablePanel 
              defaultSize={collapsed ? 100 : 55} 
              minSize={30} 
              maxSize={collapsed ? 100 : 70}
            >
              <div className="min-h-full flex flex-col bg-white">
                <div className="flex-1">
                  {rightContent}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
