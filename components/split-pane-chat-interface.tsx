"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Loader2, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface SplitPaneChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isWaitingForResponse: boolean;
  userName?: string;
  suggestedResponses?: { text: string }[];
  onDocumentUpload?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function SplitPaneChatInterface({
  messages,
  onSendMessage,
  isWaitingForResponse,
  userName = "User",
  suggestedResponses = [],
  onDocumentUpload,
  isCollapsed = false,
  onToggleCollapse,
  className = ""
}: SplitPaneChatInterfaceProps) {
  const formatContent = (content: string) => {
    // Simple formatting for bold, italic, and code
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded text-gray-800">$1</code>') // Code

    return formattedContent
  }
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isWaitingForResponse) return;
    
    onSendMessage(inputValue.trim());
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  if (isCollapsed) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-4 bg-gray-50 ${className}`}>
        <MessageSquare className="h-8 w-8 text-blue-600 mb-2" />
        <span className="text-sm text-gray-600 text-center">Chat</span>
        <div className="mt-2 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-blue-600">{messages.length}</span>
        </div>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="mt-2"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Main Chat Container with improved spacing */}
      <div className="flex-1 flex flex-col px-4 md:px-6 py-4 md:py-6 overflow-hidden">
        {/* Messages Area with better spacing */}
        <div className="flex-1 overflow-y-auto space-y-4 md:space-y-5 mb-4 pr-2 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center px-4">
              <div className="max-w-md">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Legal Consultation</h3>
                <p className="text-sm text-gray-600">
                  Begin by describing your legal matter, and I'll guide you through the process step by step.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                  {/* Avatar - same position for both */}
                  {message.sender === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      K
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                      message.sender === "user"
                        ? "bg-emerald-500 text-white rounded-br-md"
                        : "bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-md"
                    }`}
                  >
                    <div 
                      className={`whitespace-pre-wrap ${message.sender === "user" ? "text-white" : "text-gray-700"}`}
                      dangerouslySetInnerHTML={{ __html: formatContent(message.text) }}
                    ></div>
                  </div>

                  {/* Avatar - same position for both */}
                  {message.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Typing indicator - improved design */}
          {isWaitingForResponse && (
            <div className="flex items-start gap-3 justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                K
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-md p-4 max-w-[85%] md:max-w-[75%] shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Typing</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Responses - improved styling */}
        {suggestedResponses.length > 0 && showSuggestions && !isWaitingForResponse && messages.length > 0 && (
          <div className="py-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-3 font-medium">Suggested responses:</div>
            <div className="flex flex-wrap gap-2">
              {suggestedResponses.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="text-xs h-9 px-4 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                >
                  {suggestion.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area - improved design */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-end gap-2">
            {onDocumentUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDocumentUpload}
                className="h-10 w-10 p-0 border-gray-300 hover:bg-gray-50"
                disabled={isWaitingForResponse}
                title="Upload document"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-[120px] resize-none pr-12 border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 rounded-lg"
                disabled={isWaitingForResponse}
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isWaitingForResponse}
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                title="Send message"
              >
                {isWaitingForResponse ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 px-1">
            AI can search the internet for current case law and legal information.
          </p>
        </div>
      </div>
    </div>
  );
}

