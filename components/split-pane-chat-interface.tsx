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
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-300 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-gray-900">Chat</span>
            <p className="text-xs text-gray-500">AI Legal Assistant</p>
          </div>
        </div>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                message.sender === "user"
                  ? "bg-emerald-500 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {message.sender === "assistant" && (
                <div className="flex items-center mb-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold mr-2">
                    K
                  </div>
                  <span className="text-xs font-medium text-emerald-700">Khristian</span>
                </div>
              )}
              {message.sender === "user" && userName && (
                <div className="flex items-center justify-end mb-1">
                  <span className="text-xs font-medium text-white mr-2">{userName}</span>
                  <div className="w-4 h-4 rounded-full bg-white text-emerald-500 flex items-center justify-center text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.text}</div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isWaitingForResponse && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                  K
                </div>
                <span className="text-xs font-medium text-emerald-700">Khristian</span>
              </div>
              <div className="flex items-center space-x-1 mt-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Responses */}
      {suggestedResponses.length > 0 && showSuggestions && !isWaitingForResponse && (
        <div className="px-6 py-3 border-t border-gray-300 bg-gray-50">
          <div className="text-xs text-gray-600 mb-2 font-medium">Suggested responses:</div>
          <div className="flex flex-wrap gap-2">
            {suggestedResponses.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="text-xs h-8 px-3 border-gray-300 hover:bg-gray-100"
              >
                {suggestion.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-300 bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={isWaitingForResponse}
            />
          </div>
          <div className="flex flex-col space-y-1">
            {onDocumentUpload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDocumentUpload}
                className="h-8 w-8 p-0"
                disabled={isWaitingForResponse}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isWaitingForResponse}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isWaitingForResponse ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

