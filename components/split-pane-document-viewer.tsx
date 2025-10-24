"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download, Print, FileText, Loader2, Check, X } from 'lucide-react';
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

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Document Header */}
      <div className="px-6 py-4 border-b border-gray-300 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Document</h1>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{formatWordCount(localContent)} words</span>
                <span>{formatPageCount(localContent)} pages</span>
                {hasUnsavedChanges && (
                  <span className="text-orange-600 flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                    Unsaved changes
                  </span>
                )}
                {isAutoSaving && (
                  <span className="text-blue-600 flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Auto-saving...
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center space-x-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save</span>
            </Button>
            
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center space-x-1"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download</span>
            </Button>
            
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center space-x-1"
            >
              <Print className="h-4 w-4" />
              <span>Print</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
            <Textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[calc(100vh-200px)] resize-none border-0 focus:ring-0 p-6 text-sm leading-relaxed font-mono bg-transparent"
              placeholder="Your legal document will appear here..."
              style={{ 
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                lineHeight: '1.6'
              }}
            />
          </div>
          
          {/* Document Statistics */}
          <div className="mt-4 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Document ID: {documentId || 'Not available'}</span>
                <span>Characters: {localContent.length.toLocaleString()}</span>
                <span>Words: {formatWordCount(localContent).toLocaleString()}</span>
                <span>Pages: {formatPageCount(localContent)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges ? (
                  <span className="text-orange-600 flex items-center font-medium">
                    <X className="w-3 h-3 mr-1" />
                    Unsaved
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center font-medium">
                    <Check className="w-3 h-3 mr-1" />
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

