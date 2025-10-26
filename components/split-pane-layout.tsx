"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageSquare, FileText, GripVertical, Sparkles, Bot, FileCheck, Users, Zap } from 'lucide-react';
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
    <div className={`h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-300 ease-in-out ${className}`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/60 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900">
              Ask AI Legal™
            </h1>
            <p className="text-sm text-gray-600">Where Law Meets Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Status Indicators */}
        <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">AI Assistant</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <FileCheck className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{rightTitle}</span>
            </div>
          </div>
          
          {/* Mobile: Tab buttons for switching between panes */}
          {isMobile ? (
            <div className="flex bg-gray-100 rounded-xl p-1 ml-4 shadow-sm">
              <Button
                variant={activePane === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePane('chat')}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button
                variant={activePane === 'document' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePane('document')}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              >
                <FileText className="h-4 w-4 mr-2" />
                Document
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCollapse}
              className="ml-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg px-4 py-2 transition-all duration-200"
            >
              {collapsed ? (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Expand Chat
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Collapse Chat
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Main Content Area */}
      <div ref={containerRef} className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {isMobile ? (
          /* Mobile: Show only active pane with enhanced styling */
          <>
            {activePane === 'chat' && (
              <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 shadow-lg">
                <div className="h-full overflow-hidden">
                  {leftContent}
                </div>
              </div>
            )}
            {activePane === 'document' && (
              <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 shadow-lg">
                <div className="h-full overflow-y-auto">
                  {rightContent}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop: Enhanced Resizable panels */
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {!collapsed && (
              <>
                <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                  <div className="h-full flex flex-col bg-gradient-to-br from-white to-gray-50 shadow-lg border-r border-gray-200/60">
                    <div className="h-full overflow-hidden">
                      {leftContent}
                    </div>
                  </div>
                </ResizablePanel>
                
                <ResizableHandle className="w-1 bg-gradient-to-b from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all duration-200 group">
                  <div className="w-full h-full flex items-center justify-center">
                    <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </ResizableHandle>
              </>
            )}
            
            <ResizablePanel defaultSize={collapsed ? 100 : 50} minSize={30} maxSize={70}>
              <div className="h-full flex flex-col bg-gradient-to-br from-white to-gray-50 shadow-lg">
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

