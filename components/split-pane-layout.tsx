"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageSquare, FileText, GripVertical } from 'lucide-react';
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
  const [activePane, setActivePane] = useState<'chat' | 'document'>('document'); // Mobile: which pane is active
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const collapsed = onToggleCollapse ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => {
    setIsAnimating(true);
    setInternalCollapsed(!internalCollapsed);
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300);
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

  // ResizablePanelGroup handles all drag interactions automatically

  return (
    <div className={`h-screen flex flex-col bg-gray-50 transition-all duration-300 ease-in-out ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300 bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-gray-900">Ask AI Legal™</h1>
              <p className="text-xs text-gray-500">Where Law Meets Intelligence</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
            <FileText className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{rightTitle}</span>
          </div>
          
          {/* Mobile: Tab buttons for switching between panes */}
          {isMobile ? (
            <div className="flex bg-gray-100 rounded-lg p-1 ml-4">
              <Button
                variant={activePane === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePane('chat')}
                className="px-3 py-1 text-xs"
              >
                Chat
              </Button>
              <Button
                variant={activePane === 'document' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePane('document')}
                className="px-3 py-1 text-xs"
              >
                Document
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCollapse}
              className="ml-4 border-gray-300 hover:bg-gray-50"
            >
              {collapsed ? (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Expand Chat
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Collapse Chat
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-50">
        {isMobile ? (
          /* Mobile: Show only active pane */
          <>
            {activePane === 'chat' && (
              <div className="w-full h-full bg-white">
                <div className="h-full overflow-hidden">
                  {leftContent}
                </div>
              </div>
            )}
            {activePane === 'document' && (
              <div className="w-full h-full bg-white">
                <div className="h-full overflow-y-auto">
                  {rightContent}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop: Resizable panels */
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {!collapsed && (
              <>
                <ResizablePanel defaultSize={50} minSize={20} maxSize={70}>
                  <div className="h-full flex flex-col bg-white shadow-sm">
                    <div className="h-full overflow-hidden">
                      {leftContent}
                    </div>
                  </div>
                </ResizablePanel>
                
                <ResizableHandle className="w-0 bg-transparent hover:bg-gray-200 transition-colors" />
              </>
            )}
            
            <ResizablePanel defaultSize={collapsed ? 100 : 50} minSize={30}>
              <div className="h-full flex flex-col bg-white shadow-sm">
                <div className="h-full overflow-y-auto">
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
