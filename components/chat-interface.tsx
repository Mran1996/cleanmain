"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Send, Lock, User } from "lucide-react"
import { sanitizeHTML } from "@/lib/validation"
import { useTranslation } from "@/utils/translations"

interface Message {
  id: string
  content: string
  sender: "khristian" | "user"
  timestamp: Date
}

export function ChatInterface() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi there 👋 I'm Khristian, your AI legal guide. Let's start by understanding what you're dealing with.",
      sender: "khristian",
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    },
    {
      id: "2",
      content: "Hi, I need help with a legal issue...",
      sender: "user",
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
    },
    {
      id: "3",
      content:
        "I understand. Do you have any documents related to this issue? I noticed you didn't upload anything earlier, but you can add more if you'd like.",
      sender: "khristian",
      timestamp: new Date(), // now
    },
  ])

  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedResponses = [
    { emoji: "📄", text: t('suggestion_contract_dispute') },
    { emoji: "📁", text: t('suggestion_legal_notice_received') },
    { emoji: "✍️", text: t('suggestion_file_legal_document') },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Show AI typing indicator
    setIsTyping(true)

    try {
      // Prepare messages for API call
      const messagesForAPI = [
        { role: "system", content: "You are Khristian, a legal assistant who helps users create professional, court-ready documents. Ask one smart question at a time. Be calm, clear, and professional." },
        ...messages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content
        })),
        { role: "user", content }
      ]

      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAPI
        }),
      })

      if (!response.ok) {
        let serverErr = "";
        try { 
          const errorData = await response.json();
          serverErr = errorData?.error ?? ""; 
        } catch {
          // Error parsing JSON response, continue with empty serverErr
        }
        
        // Handle rate limit errors specifically
        if (response.status === 429) {
          const errorMessage = "I'm receiving a lot of requests right now. Please wait a moment before asking your next question.";
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            content: errorMessage,
            sender: "khristian",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, assistantMessage])
          setIsTyping(false)
          return;
        }
        
        throw new Error(`API error ${response.status} ${serverErr}`);
      }

      const data = await response.json()
      const assistantResponse = data.choices?.[0]?.message?.content || data.message || data.content || "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: assistantResponse,
        sender: "khristian",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I apologize, but I'm having trouble connecting right now. Please try again.",
        sender: "khristian",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('chat_with_khristian_header')}</h1>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> {t('secure_confidential')}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{t('chat_strategy_subtext')}</p>
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-6 h-[400px] overflow-y-auto p-2">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            sender={message.sender}
            text={message.content}
            time={formatTime(message.timestamp)}
          />
        ))}

        {/* AI typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2 max-w-[75%]">
              <div className="bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                K
              </div>
              <div>
                <div className="rounded-xl px-4 py-2 text-sm bg-gray-100 text-gray-900 rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Responses */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">{t('suggested_responses_label')}</p>
        <div className="flex flex-wrap gap-2">
          {suggestedResponses.map((response, index) => (
            <button
              key={index}
              className="px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm flex items-center border border-emerald-200"
              onClick={() => handleSendMessage(response.text)}
            >
              <span className="mr-1">{response.emoji}</span> {response.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage(inputValue)
            }
          }}
          placeholder={t('input_placeholder_describe_issue')}
          className="w-full border rounded-full px-4 py-3 pr-24 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-500"
          style={{
            color: '#111827 !important',
            backgroundColor: '#ffffff !important'
          }}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim()}
            className="rounded-full w-10 h-10 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
          <button className="rounded-full w-10 h-10 flex items-center justify-center bg-emerald-500 text-white" aria-label={t('start_voice_input_title')} title={t('start_voice_input_title')}>
            <Mic className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ sender, text, time }: { sender: "khristian" | "user"; text: string; time: string }) {
  const isUser = sender === "user"
  const bubbleClasses = isUser
    ? "bg-emerald-500 text-white rounded-br-none"
    : "bg-gray-100 text-gray-900 rounded-bl-none"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end gap-2 max-w-[75%]`}>
        {!isUser && (
          <div className="bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
            K
          </div>
        )}
        <div>
          <div 
            className={`rounded-xl px-4 py-2 text-sm ${bubbleClasses}`} 
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(text) }}
          ></div>
          <div className="text-[10px] text-gray-400 mt-1 text-right">{time}</div>
        </div>
        {isUser && (
          <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
