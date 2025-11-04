"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download, Print, FileText, Loader2, Check, X, Eye, Edit3, Share2, Clock, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SplitPaneDocumentViewerProps {
  documentContent: string;
  documentId: string | null;
  onContentChange: (content: string) => void;
  onSave?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  isSaving?: boolean;
  isDownloading?: boolean;
  className?: string;
}

export function SplitPaneDocumentViewer({
  documentContent,
  documentId,
  onContentChange,
  onSave,
  onDownload,
  onPrint,
  isSaving = false,
  isDownloading = false,
  className = ""
}: SplitPaneDocumentViewerProps) {
  const [localContent, setLocalContent] = useState(documentContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local content when documentContent prop changes
  useEffect(() => {
    setLocalContent(documentContent);
    setHasUnsavedChanges(false);
  }, [documentContent]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && localContent !== documentContent) {
      const autoSaveTimer = setTimeout(() => {
        setIsAutoSaving(true);
        // Simulate auto-save
        setTimeout(() => {
          setIsAutoSaving(false);
          setHasUnsavedChanges(false);
          toast.success("Document auto-saved");
        }, 1000);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [localContent, documentContent, hasUnsavedChanges]);

  const handleContentChange = (value: string) => {
    setLocalContent(value);
    setHasUnsavedChanges(value !== documentContent);
    onContentChange(value);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave();
      setHasUnsavedChanges(false);
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload();
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      // Default print behavior
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Legal Document</title>
              <style>
                body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; }
                h1, h2, h3 { color: #333; }
                .document-content { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <div class="document-content">${localContent}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatWordCount = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    return words;
  };

  const formatPageCount = (text: string) => {
    const words = formatWordCount(text);
    const pages = Math.ceil(words / 250); // Assuming 250 words per page
    return pages;
  };

  const getDocumentStatus = () => {
    if (isAutoSaving) return { text: "Auto-saving...", color: "text-blue-600", icon: Loader2 };
    if (hasUnsavedChanges) return { text: "Unsaved changes", color: "text-orange-600", icon: AlertCircle };
    return { text: "Saved", color: "text-green-600", icon: Check };
  };

  const status = getDocumentStatus();

  return (
    <div className={`h-full flex flex-col bg-gradient-to-br from-white to-gray-50 ${className}`}>
      {/* Enhanced Document Header */}
      <div className="px-6 py-5 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Legal Document
                <FileCheck className="h-4 w-4 text-blue-500" />
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatWordCount(localContent)} words
                </span>
                <span>•</span>
                <span>{formatPageCount(localContent)} pages</span>
                <span>•</span>
                <span className={`flex items-center gap-1 ${status.color}`}>
                  <status.icon className="h-3 w-3" />
                  {status.text}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-9 px-3 border-gray-200 hover:bg-gray-50"
            >
              {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
              {isEditing ? "Preview" : "Edit"}
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="h-9 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
            
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-9 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </Button>
            
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 px-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg shadow-sm"
            >
              <Print className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Document Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {isEditing ? (
              <Textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="h-[calc(100vh-50px)] resize-none border-0 focus:ring-0 p-8 text-sm leading-relaxed font-mono bg-transparent"
                placeholder="Your legal document will appear here..."
                style={{ 
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  lineHeight: '1.6'
                }}
              />
            ) : (
              <div className="p-8 text-sm leading-relaxed font-serif h-[calc(100vh-50px)] overflow-y-auto">
                <div className="whitespace-pre-wrap text-gray-800" style={{ lineHeight: '1.8' }}>
                  {localContent || "Your generated legal document will appear here..."}
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Document Statistics */}
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">ID: {documentId || 'Generating...'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{localContent.length.toLocaleString()} characters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{formatWordCount(localContent).toLocaleString()} words</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{formatPageCount(localContent)} pages</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges ? (
                  <span className="text-orange-600 flex items-center font-medium bg-orange-50 px-3 py-1 rounded-full text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Unsaved
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center font-medium bg-green-50 px-3 py-1 rounded-full text-sm">
                    <Check className="w-4 h-4 mr-2" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

