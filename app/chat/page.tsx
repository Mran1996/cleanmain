"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { sanitizeHTML } from "@/lib/validation"
import { Navigation } from "@/components/navigation"
import { SubscriptionGuard } from "@/components/subscription-guard"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileUp,
  Download,
  Save,
  Search,
  Settings,
  ChevronLeft,
  Mic,
  Send,
  Lock,
  User,
  Smile,
  Paperclip,
  MoreHorizontal,
  X,
  Check,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "@/utils/translations"

// Define types
interface Message {
  id: string
  content: string
  sender: "khristian" | "user"
  timestamp: Date
  read: boolean
  reactions: Array<{
    emoji: string
    count: number
    users: string[]
  }>
  attachments?: Array<{
    type: "image" | "document"
    url: string
    name: string
  }>
}

interface ChatInterfaceProps {
  searchOpen?: boolean
  onAttachmentUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
  setSearchOpen?: (open: boolean) => void
  t?: (key: string) => string
}

// Chat Interface Component
function ChatInterface({ searchOpen = false, onAttachmentUpload, setSearchOpen, t }: ChatInterfaceProps) {
  const [messageIdCounter, setMessageIdCounter] = useState(4);
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "1",
      content: "Hi there 👋 I'm Khristian, your AI legal guide. Let's start by understanding what you're dealing with.",
      sender: "khristian",
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      read: true,
      reactions: [],
    },
    {
      id: "2",
      content:
        "Hi, I need help with a legal issue related to my apartment. My landlord is trying to evict me without proper notice.",
      sender: "user",
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      read: true,
      reactions: [{ emoji: "👍", count: 1, users: ["khristian"] }],
    },
    {
      id: "3",
      content:
        "I understand. Eviction without proper notice is a serious issue. Do you have any documents related to this, such as the eviction notice or your lease agreement? I noticed you didn't upload anything earlier, but you can add more if you'd like.",
      sender: "khristian",
      timestamp: new Date(), // now
      read: false,
      reactions: [],
    },
  ])

  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const suggestedResponses = [
    { emoji: "📄", text: t && t("suggestion_have_eviction_notice") || "Yes, I have the eviction notice" },
    { emoji: "📁", text: t && t("suggestion_can_upload_lease") || "I can upload my lease agreement" },
    { emoji: "✍️", text: t && t("suggestion_how_much_time_respond") || "How much time do I have to respond?" },
  ]

  const emojis = ["👍", "❤️", "😂", "😢", "😡", "👏"]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    // Increment counter for new message ID
    setMessageIdCounter(prev => prev + 1);
    
    // Add user message
    const userMessage: Message = {
      id: `user-${messageIdCounter}`,
      content,
      sender: "user",
      timestamp: new Date(),
      read: false,
      reactions: [],
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate AI typing
    setIsTyping(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      // Increment counter again for AI message
      setMessageIdCounter(prev => prev + 1);
      
      const assistantMessage: Message = {
        id: `assistant-${messageIdCounter + 1}`,
        content:
          "Thank you for sharing that. For eviction cases in Washington state, landlords must provide proper notice periods depending on the reason for eviction. Could you tell me what reason was stated on your eviction notice?",
        sender: "khristian",
        timestamp: new Date(),
        read: false,
        reactions: [],
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === messageId) {
          const existingReactionIndex = message.reactions.findIndex((r) => r.emoji === emoji)

          if (existingReactionIndex > -1) {
            // If reaction exists, toggle it
            const updatedReactions = [...message.reactions]
            const reaction = updatedReactions[existingReactionIndex]

            if (reaction.users.includes("user")) {
              // Remove user from reaction
              reaction.users = reaction.users.filter((u) => u !== "user")
              reaction.count--

              // Remove reaction if no users left
              if (reaction.count === 0) {
                updatedReactions.splice(existingReactionIndex, 1)
              }
            } else {
              // Add user to reaction
              reaction.users.push("user")
              reaction.count++
            }

            return {
              ...message,
              reactions: updatedReactions,
            }
          } else {
            // Add new reaction
            return {
              ...message,
              reactions: [...message.reactions, { emoji, count: 1, users: ["user"] }],
            }
          }
        }
        return message
      }),
    )
  }

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
        setUploadDialogOpen(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // In a real app, you would upload the file to a server
      // For now, we'll just simulate adding an attachment to a new message
      Array.from(files).forEach((file) => {
        const isImage = file.type.startsWith("image/")

        const newMessage: Message = {
          id: `user-${Date.now()}-${Math.random()}`,
          content: isImage ? "" : `I'm sharing a document: ${file.name}`,
          sender: "user",
          timestamp: new Date(),
          read: false,
          reactions: [],
          attachments: [
            {
              type: isImage ? "image" : "document",
              url: URL.createObjectURL(file),
              name: file.name,
            },
          ],
        }

        setMessages((prev) => [...prev, newMessage])
      })
    }
    // Reset input so same file can be selected again
    e.target.value = ''
    
    // Also call parent handler if provided
    if (onAttachmentUpload) {
      onAttachmentUpload(e)
    }
  }

  const exportChatHistory = () => {
    const chatHistory = messages
      .map((msg) => {
        return `[${msg.timestamp.toLocaleString()}] ${msg.sender === "user" ? "You" : "Khristian"}: ${msg.content}`
      })
      .join("\n\n")

    const blob = new Blob([chatHistory], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "chat-history.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredMessages = searchQuery
    ? messages.filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  return (
    <div className="w-full mx-auto bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh', minHeight: '650px' }}>
      {/* Header - Redesigned */}
  <div className="border-b-2 border-gray-200 bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 bg-white text-emerald-600 shadow-lg ring-4 ring-white/50">
              <AvatarFallback className="text-xl sm:text-2xl font-bold">K</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Khristian AI</h1>
              <p className="text-xs sm:text-sm text-emerald-50">{t && t("chat_title")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-xs sm:text-sm text-white flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Lock className="w-4 h-4" /> 
              <span className="hidden sm:inline">Secure & Confidential</span>
              <span className="sm:hidden">Secure</span>
            </div>
            {searchOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen && setSearchOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar (conditionally rendered) */}
      {searchOpen && (
        <div className="border-b p-3 sm:p-4 flex items-center gap-2 bg-white shadow-sm">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
          <Input
            placeholder="Search messages..."
            className="border-0 focus-visible:ring-0 bg-transparent text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-gray-100" onClick={() => setSearchQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Messages - Redesigned */}
      <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-gray-50 scroll-smooth">
        {filteredMessages.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
            <Search className="h-12 w-12 mb-4 text-gray-400" />
            <p className="text-base">No messages found for "{searchQuery}"</p>
            <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
          </div>
        )}

        {filteredMessages.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
            <div className="bg-emerald-100 rounded-full p-6 mb-4">
              <Avatar className="h-16 w-16 bg-emerald-500 text-white">
                <AvatarFallback className="text-2xl font-bold">K</AvatarFallback>
              </Avatar>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Your Conversation</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              I'm Khristian, your AI legal assistant. Ask me anything about your legal matter, and I'll help guide you through the process.
            </p>
          </div>
        )}

        <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
          {filteredMessages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              profileImage={profileImage}
              onReaction={(emoji) => handleReaction(message.id, emoji)}
            />
          ))}

          {/* AI typing indicator - Enhanced */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-3 max-w-[75%]">
                <Avatar className="h-10 w-10 sm:h-11 sm:w-11 bg-emerald-500 text-white flex-shrink-0 shadow-md ring-2 ring-emerald-100">
                  <AvatarFallback className="text-base sm:text-lg font-bold">K</AvatarFallback>
                </Avatar>
                <div>
                  <div className="rounded-2xl rounded-bl-md px-5 py-3.5 bg-white border border-gray-200 shadow-sm">
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce"></div>
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400 mt-1.5 ml-1">Khristian is typing...</div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Responses - Redesigned */}
      {suggestedResponses.length > 0 && !isTyping && (
        <div className="border-t-2 border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-emerald-600">💡</span>
            Suggested responses:
          </p>
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            {suggestedResponses.map((response, index) => (
              <button
                key={index}
                className="px-5 py-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm sm:text-base flex items-center border-2 border-emerald-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                onClick={() => handleSendMessage(response.text)}
              >
                <span className="mr-2 text-lg">{response.emoji}</span> 
                <span>{response.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Redesigned */}
      <div className="border-t-2 border-gray-200 bg-white p-5 sm:p-6">
        <div className="relative max-w-4xl mx-auto">
          {/* Action Buttons Row */}
          <div className="flex items-center gap-2.5 mb-4 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full hover:bg-emerald-50 text-gray-600 hover:text-emerald-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach file or document</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleAttachmentUpload} multiple />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full hover:bg-emerald-50 text-gray-600 hover:text-emerald-600"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add emoji</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-emerald-50 text-gray-600 hover:text-emerald-600">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Profile Picture</DialogTitle>
                  <DialogDescription>Choose a profile picture to personalize your chat experience.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <Avatar className="h-24 w-24">
                    {profileImage ? (
                      <AvatarImage src={profileImage || "/placeholder.svg"} />
                    ) : (
                      <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xl">
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Input type="file" accept="image/*" onChange={handleProfileImageUpload} />
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full ml-auto hover:bg-gray-100 text-gray-600">
                  <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportChatHistory}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Chat History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchOpen && setSearchOpen(!searchOpen)}>
                  <Search className="h-4 w-4 mr-2" />
                  {searchOpen ? "Close Search" : "Search Messages"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border-2 border-gray-200 rounded-xl p-3 shadow-lg z-10">
              <div className="flex gap-2 flex-wrap">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
                    onClick={() => {
                      setInputValue((prev) => prev + emoji)
                      setShowEmojiPicker(false)
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Field - Redesigned */}
          <div className="flex items-center gap-3 bg-white rounded-2xl border-2 border-gray-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 transition-all shadow-sm">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(inputValue)
                }
              }}
              placeholder="Type your message or question here..."
              className="border-0 bg-transparent focus-visible:ring-0 text-sm sm:text-base py-5 px-5 sm:px-6 placeholder:text-gray-400"
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="rounded-full h-11 w-11 sm:h-12 sm:w-12 bg-emerald-600 hover:bg-emerald-700 text-white mr-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {/* Helper Text */}
          <div className="flex justify-between items-center mt-3 text-xs sm:text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="hidden sm:inline">Press</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd>
              <span className="hidden sm:inline">to send</span>
              <span className="sm:hidden">to send</span>
            </span>
            <button
              className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
              onClick={() => {
                // Toggle voice input in a real app
                alert("Voice input feature would be activated here")
              }}
            >
              <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
              <span className="hidden sm:inline">Voice input</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Chat Bubble Component - Enhanced
function ChatBubble({
  message,
  profileImage,
  onReaction,
}: {
  message: Message
  profileImage: string | null
  onReaction: (emoji: string) => void
}) {
  const [showReactions, setShowReactions] = useState(false)
  const isUser = message.sender === "user"
  const bubbleClasses = isUser
    ? "bg-emerald-600 text-white rounded-2xl rounded-br-md shadow-lg"
    : "bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-md border-2 border-gray-200"

  const emojis = ["👍", "❤️", "😂", "😢", "😡", "👏"]

  const formatContent = (content: string) => {
    // Sanitize HTML to prevent XSS attacks
    const sanitized = sanitizeHTML(content);
    // Apply safe formatting with CSS classes
    const formattedContent = sanitized
      .replace(/<strong>(.*?)<\/strong>/g, '<strong class="font-semibold">$1</strong>') // Bold
      .replace(/<em>(.*?)<\/em>/g, '<em class="italic">$1</em>') // Italic
      .replace(/<code>(.*?)<\/code>/g, '<code class="bg-gray-200 px-1 rounded text-gray-800">$1</code>') // Code

    return formattedContent
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
      <div className={`flex items-end gap-3 max-w-[85%] sm:max-w-[75%]`}>
        {!isUser && (
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 bg-emerald-500 text-white flex-shrink-0 shadow-md ring-2 ring-emerald-100">
            <AvatarFallback className="text-base sm:text-lg font-bold">K</AvatarFallback>
          </Avatar>
        )}
        <div className="relative flex-1">
          <div
            className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base leading-relaxed ${bubbleClasses} transition-shadow hover:shadow-lg`}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {message.attachments &&
              message.attachments.map((attachment, index) => (
                <div key={index} className="mb-3 last:mb-0">
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.url || "/placeholder.svg"}
                      alt={attachment.name}
                      className="max-w-full rounded-lg max-h-60 object-contain shadow-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <FileUp className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate font-medium">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}

            {message.content && (
              <div 
                className={isUser ? "text-white" : "text-gray-800"}
                dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} 
              />
            )}

            {showReactions && (
              <div className="absolute -top-10 left-0 bg-white rounded-full shadow-lg p-2 flex gap-1 border border-gray-200 z-10">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="hover:bg-gray-100 p-1.5 rounded-full text-base transition-colors"
                    onClick={() => {
                      onReaction(emoji)
                      setShowReactions(false)
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 mt-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
            <div className="text-[10px] sm:text-xs text-gray-400">{formatTime(message.timestamp)}</div>

            {message.read && isUser && (
              <div className="text-[10px] sm:text-xs text-emerald-500 flex items-center">
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            )}

            {message.reactions.length > 0 && (
              <div className="flex gap-1 ml-2">
                {message.reactions.map((reaction, index) => (
                  <div
                    key={index}
                    className={`text-xs rounded-full px-2 py-0.5 flex items-center gap-1 ${
                      reaction.users.includes("user") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    {reaction.count > 1 && <span className="text-[10px]">{reaction.count}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {isUser && (
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 shadow-md ring-2 ring-emerald-100">
            {profileImage ? (
              <AvatarImage src={profileImage || "/placeholder.svg"} />
            ) : (
              <AvatarFallback className="bg-emerald-100 text-emerald-600">
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
              </AvatarFallback>
            )}
          </Avatar>
        )}
      </div>
    </div>
  )
}

function ChatPageContent() {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const sidebarFileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  
  const handleSidebarAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // File upload from sidebar - messages will be handled by ChatInterface
    // For now, just trigger the file input
    const files = e.target.files
    if (files && files.length > 0) {
      // In a real implementation, this would trigger a message in the chat
      console.log('Files selected from sidebar:', Array.from(files).map(f => f.name))
    }
    e.target.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section - Redesigned */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-600"
                    onClick={() => router.push("/dashboard")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("chat_title")}</h1>
                    <p className="text-sm text-gray-600 mt-1">{t("chat_subtitle")}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={searchOpen ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300"
                    onClick={() => setSearchOpen(!searchOpen)}
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="hidden sm:inline">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <FileUp className="h-4 w-4 mr-2" />
                        {t("chat_upload_document")}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Save className="h-4 w-4 mr-2" />
                        {t("chat_save_chat")}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        {t("chat_export")}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        {t("settings")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Sidebar - Redesigned */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-md p-5 hover:shadow-lg transition-shadow">
                  <h2 className="font-bold text-base mb-4 text-gray-900 flex items-center gap-2">
                    <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    {t("chat_case_info")}
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">{t("chat_category")}</span>
                      <span className="font-semibold text-gray-900 bg-emerald-50 px-2 py-1 rounded">Housing</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">{t("chat_issue")}</span>
                      <span className="font-semibold text-gray-900">Eviction Notice</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">{t("chat_state")}</span>
                      <span className="font-semibold text-gray-900">Washington</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-600 font-medium">{t("chat_started")}</span>
                      <span className="font-semibold text-gray-900">Apr 28, 2025</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-md p-5 hover:shadow-lg transition-shadow">
                  <h2 className="font-bold text-base mb-4 text-gray-900 flex items-center gap-2">
                    <div className="h-2.5 w-2.5 bg-blue-500 rounded-full"></div>
                    {t("chat_uploaded_documents")}
                  </h2>
                  <div className="text-sm">
                    <p className="text-gray-500 italic mb-4 text-xs">{t("chat_no_documents")}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 font-medium shadow-sm"
                      onClick={() => sidebarFileInputRef.current?.click()}
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      {t("chat_upload_document")}
                    </Button>
                    <input type="file" ref={sidebarFileInputRef} className="hidden" onChange={handleSidebarAttachmentUpload} multiple />
                  </div>
                </div>
              </div>

              {/* Chat Interface - Full Width */}
              <div className="lg:col-span-3">
                <ChatInterface searchOpen={searchOpen} setSearchOpen={setSearchOpen} t={t} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function ChatPage() {
  const { t } = useTranslation()
  return (
    <SubscriptionGuard
      fallbackTitle={t("subguard_title")}
      fallbackMessage={t("subguard_message")}
    >
      <ChatPageContent />
    </SubscriptionGuard>
  );
}
