"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
}

// Chat Interface Component
function ChatInterface({ searchOpen = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
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
    { emoji: "📄", text: "Yes, I have the eviction notice" },
    { emoji: "📁", text: "I can upload my lease agreement" },
    { emoji: "✍️", text: "How much time do I have to respond?" },
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

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
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
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
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
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload the file to a server
      // For now, we'll just simulate adding an attachment to a new message
      const isImage = file.type.startsWith("image/")

      const newMessage: Message = {
        id: `user-${Date.now()}`,
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
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-emerald-500 text-white">
              <AvatarFallback>K</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold">Khristian AI</h1>
              <p className="text-xs text-gray-500">Legal Assistant</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Secure & Confidential
          </div>
        </div>
      </div>

      {/* Search Bar (conditionally rendered) */}
      {searchOpen && (
        <div className="border-b p-2 flex items-center gap-2 bg-gray-50">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search messages..."
            className="border-0 focus-visible:ring-0 bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full" onClick={() => setSearchQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="p-4 h-[500px] overflow-y-auto bg-gray-50">
        {filteredMessages.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Search className="h-8 w-8 mb-2" />
            <p>No messages found for "{searchQuery}"</p>
          </div>
        )}

        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              profileImage={profileImage}
              onReaction={(emoji) => handleReaction(message.id, emoji)}
            />
          ))}

          {/* AI typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2 max-w-[75%]">
                <Avatar className="h-8 w-8 bg-emerald-500 text-white">
                  <AvatarFallback>K</AvatarFallback>
                </Avatar>
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
      </div>

      {/* Suggested Responses */}
      <div className="border-t p-2 bg-gray-50">
        <p className="text-xs text-gray-500 mb-2 px-2">Suggested responses:</p>
        <div className="flex flex-wrap gap-2 px-2">
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
      <div className="p-4 border-t">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleAttachmentUpload} />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add emoji</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  <User className="h-4 w-4" />
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-auto">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportChatHistory}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Chat History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 bg-white border rounded-lg p-2 shadow-md">
              <div className="flex gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="text-xl hover:bg-gray-100 p-1 rounded"
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

          <div className="flex">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(inputValue)
                }
              }}
              placeholder="Type your message..."
              className="rounded-r-none"
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim()}
              className="rounded-l-none bg-emerald-500 hover:bg-emerald-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send</span>
            <button
              className="flex items-center gap-1 hover:text-emerald-600"
              onClick={() => {
                // Toggle voice input in a real app
                alert("Voice input feature would be activated here")
              }}
            >
              <Mic className="h-3 w-3" /> Voice input
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Chat Bubble Component
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
    ? "bg-emerald-500 text-white rounded-br-none"
    : "bg-gray-100 text-gray-900 rounded-bl-none"

  const emojis = ["👍", "❤️", "😂", "😢", "😡", "👏"]

  const formatContent = (content: string) => {
    // Simple formatting for bold, italic, and code
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded text-gray-800">$1</code>') // Code

    return formattedContent
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end gap-2 max-w-[75%] group`}>
        {!isUser && (
          <Avatar className="h-8 w-8 bg-emerald-500 text-white flex-shrink-0">
            <AvatarFallback>K</AvatarFallback>
          </Avatar>
        )}
        <div className="relative">
          <div
            className={`rounded-xl px-4 py-2 text-sm ${bubbleClasses}`}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {message.attachments &&
              message.attachments.map((attachment, index) => (
                <div key={index} className="mb-2">
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.url || "/placeholder.svg"}
                      alt={attachment.name}
                      className="max-w-full rounded-lg max-h-60 object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                      <FileUp className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}

            {message.content && <div dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} />}

            {showReactions && (
              <div className="absolute -top-8 left-0 bg-white rounded-full shadow-md p-1 flex">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="hover:bg-gray-100 p-1 rounded-full text-sm"
                    onClick={() => onReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1">
            <div className="text-[10px] text-gray-400">{formatTime(message.timestamp)}</div>

            {message.read && (
              <div className="text-[10px] text-emerald-500 flex items-center">
                <Check className="h-3 w-3" />
              </div>
            )}

            {message.reactions.length > 0 && (
              <div className="flex ml-2">
                {message.reactions.map((reaction, index) => (
                  <div
                    key={index}
                    className={`text-xs rounded-full px-1 flex items-center ${
                      reaction.users.includes("user") ? "bg-emerald-100 text-emerald-700" : "bg-gray-100"
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    {reaction.count > 1 && <span className="ml-1">{reaction.count}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {isUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            {profileImage ? (
              <AvatarImage src={profileImage || "/placeholder.svg"} />
            ) : (
              <AvatarFallback className="bg-emerald-100 text-emerald-600">
                <User className="h-4 w-4" />
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => router.push("/dashboard")}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <h1 className="text-2xl font-bold">Your Legal Assistant</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={searchOpen ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <FileUp className="h-4 w-4" />
                  <span>Upload Document</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Save className="h-4 w-4" />
                  <span>Save Chat</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                  <h2 className="font-bold mb-2">Case Information</h2>
                  <div className="text-sm">
                    <p className="flex justify-between py-1 border-b">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">Housing</span>
                    </p>
                    <p className="flex justify-between py-1 border-b">
                      <span className="text-gray-600">Issue:</span>
                      <span className="font-medium">Eviction Notice</span>
                    </p>
                    <p className="flex justify-between py-1 border-b">
                      <span className="text-gray-600">State:</span>
                      <span className="font-medium">Washington</span>
                    </p>
                    <p className="flex justify-between py-1">
                      <span className="text-gray-600">Started:</span>
                      <span className="font-medium">Apr 28, 2025</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="font-bold mb-2">Uploaded Documents</h2>
                  <div className="text-sm">
                    <p className="text-gray-600 italic">No documents uploaded yet.</p>
                    <Button variant="outline" size="sm" className="w-full mt-2 text-teal-600 border-teal-600">
                      Upload Document
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <ChatInterface searchOpen={searchOpen} />
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
  return (
    <SubscriptionGuard
      fallbackTitle="Premium Feature"
      fallbackMessage="Access to the AI chat assistant requires an active subscription. Upgrade to start chatting with our legal AI."
    >
      <ChatPageContent />
    </SubscriptionGuard>
  );
}
