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
    <div className={`min-h-full flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50/20 to-blue-50/10 transition-all duration-300 ease-in-out ${className}`}>
      {/* Modern Header - Removed for cleaner split pane design */}
      
      {/* Enhanced Main Content Area with modern styling and green outlines */}
      <div ref={containerRef} className="flex-1">
        {isMobile ? (
          /* Mobile: Show only active pane with full screen experience */
          <>
            {activePane === 'chat' && (
              <div className="w-full min-h-full bg-white/95 backdrop-blur-xl border-2 border-emerald-200/60 rounded-2xl shadow-lg">
                <div className="min-h-full">
                  {leftContent}
                </div>
              </div>
            )}
            {activePane === 'document' && (
              <div className="w-full min-h-full bg-white/95 backdrop-blur-xl border-2 border-emerald-200/60 rounded-2xl shadow-lg">
                <div className="min-h-full">
                  {rightContent}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop: Enhanced Resizable panels with modern styling and green outlines */
          <ResizablePanelGroup 
            direction="horizontal" 
            className="min-h-full gap-2 p-2"
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
                  <div className="min-h-full flex flex-col bg-white/95 backdrop-blur-xl border-2 border-emerald-200/60 rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex-1">
                      {leftContent}
                    </div>
                  </div>
                </ResizablePanel>
                
                {/* Enhanced Resizable Handle - Modern green styling */}
                <ResizableHandle className="w-3 bg-transparent hover:bg-emerald-50/50 group transition-colors relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-16 bg-emerald-300/40 group-hover:bg-emerald-400 rounded-full transition-colors"></div>
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
              <ResizablePanelGroup 
                direction="vertical" 
                className="min-h-full"
              >
                <ResizablePanel 
                  defaultSize={100} 
                  minSize={30} 
                  maxSize={100}
                >
                  <div className="min-h-full flex flex-col bg-white/95 backdrop-blur-xl border-2 border-emerald-200/60 rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex-1">
                      {rightContent}
                    </div>
                  </div>
                </ResizablePanel>
                
                {/* Vertical Resizable Handle for document pane */}
                <ResizableHandle className="h-3 bg-transparent hover:bg-emerald-50/50 group transition-colors relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-1 w-16 bg-emerald-300/40 group-hover:bg-emerald-400 rounded-full transition-colors"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-5 w-5 text-emerald-600 rotate-90" />
                  </div>
                </ResizableHandle>
                
                <ResizablePanel 
                  defaultSize={0} 
                  minSize={0} 
                  maxSize={70}
                >
                  <div className="min-h-full bg-transparent"></div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
