"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Mic, MicOff, Paperclip, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSuggestedReplies } from "@/utils/chat-suggestions"
import * as mammoth from "mammoth"
import { v4 as uuidv4 } from 'uuid'
import type React from "react"

// Extend Window interface to include lastMessageTime
declare global {
  interface Window {
    lastMessageTime?: number;
  }
}

interface Message {
  sender: string
  text: string
}

interface SuggestedResponse {
  text: string
}

interface EnhancedChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isWaitingForResponse: boolean
  currentQuestion: string
  userName?: string
  suggestedResponses?: SuggestedResponse[]
  onDocumentUpload?: (documentText: string, filename: string) => void
  legalCategory?: string
  onGenerateDocument?: () => void
}

export function EnhancedChatInterface({
  messages,
  onSendMessage,
  isWaitingForResponse,
  currentQuestion,
  userName = "",
  suggestedResponses = [],
  onDocumentUpload,
  legalCategory,
  onGenerateDocument,
}: EnhancedChatInterfaceProps) {
  const formatContent = (content: string) => {
    // Simple formatting for bold, italic, and code
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded text-gray-800">$1</code>') // Code

    return formattedContent
  }
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechServiceAvailable, setSpeechServiceAvailable] = useState(true)
  const [micPermissionError, setMicPermissionError] = useState(false)
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [searchModeEnabled, setSearchModeEnabled] = useState(false)

  // Safety: Reset stuck states after timeout
  useEffect(() => {
    if (isUploading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Upload state stuck, resetting...');
        setIsUploading(false);
      }, 60000); // Reset after 60 seconds if stuck
      return () => clearTimeout(timeout);
    }
  }, [isUploading]);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null)
  const [rotatingSuggestions, setRotatingSuggestions] = useState<string[]>([])
  const [lastAssistantCount, setLastAssistantCount] = useState(0)
  
  // Master Suggested Response List
  const MASTER_SUGGESTED_RESPONSES = {
    // Default / Unknown Legal Issue (fallback options)
    default: [
      "I need help with a legal document",
      "I want to understand my legal options",
      "Can you explain what I should do?",
      "I'm not sure what to file."
    ],
    
    // Criminal Issues (incarcerated, charged, post-trial)
    criminal: [
      "I need help with a post-conviction motion.",
      "I want to challenge my conviction.",
      "I want to file a motion to reduce my sentence.",
      "I need help preparing for my criminal appeal."
    ],
    
    // Civil Rights or Prison Abuse (jail/prison-related complaints)
    civilRights: [
      "I want to file a civil suit against the prison.",
      "I was assaulted by a corrections officer.",
      "I need to report abuse or mistreatment in jail.",
      "I want to file a federal 1983 civil rights complaint."
    ],
    
    // Sentence Modification / Resentencing
    sentenceModification: [
      "I want to request a sentence reduction.",
      "I need help filing a resentencing motion.",
      "I want to correct my sentence or record.",
      "I'm eligible under new sentencing laws."
    ],
    
    // Appeals
    appeals: [
      "I want to appeal my conviction.",
      "I need help filing an appeal.",
      "What are my chances if I appeal?",
      "Help me write a notice of appeal."
    ],
    
    // Motions (Trial / Pre-trial / Dismissals)
    motions: [
      "I want to file a motion to dismiss.",
      "I need help with a motion to suppress evidence.",
      "I want to file a motion for discovery.",
      "I need help preparing for trial."
    ],
    
    // Civil (non-incarceration)
    civil: [
      "I need help with a wage claim.",
      "I want to sue my landlord.",
      "I'm responding to a court notice.",
      "I need help writing a legal letter."
    ]
  };

  // Function to detect legal issue type and return appropriate suggestions
  const detectLegalIssueAndGetSuggestions = (messages: Message[], category?: string): string[] => {
    // Add null check for messages
    if (!messages || messages.length === 0) {
      return MASTER_SUGGESTED_RESPONSES.default.slice(0, 4);
    }
    
    // Analyze ALL messages (both user and assistant) for better context understanding
    const allMessagesText = messages
      .map(msg => msg.text.toLowerCase())
      .join(' ');
    
    // Get recent user messages (last 5) for more focused detection
    const recentUserMessages = messages
      .filter(msg => msg.sender === "user")
      .slice(-5)
      .map(msg => msg.text.toLowerCase())
      .join(' ');
    
    // Combine both for comprehensive analysis
    const combinedText = (recentUserMessages + ' ' + allMessagesText).toLowerCase();
    
    // Helper function to check for multiple keywords (more accurate matching)
    const hasKeywords = (text: string, keywords: string[]): boolean => {
      return keywords.some(keyword => text.includes(keyword));
    };
    
    // Helper function to count keyword matches (for priority scoring)
    const countMatches = (text: string, keywords: string[]): number => {
      return keywords.filter(keyword => text.includes(keyword)).length;
    };
    
    // Appeals detection (highest priority - very specific)
    const appealKeywords = ['appeal', 'conviction', 'verdict', 'lost trial', 'appellate', 'appealing', 'overturn', 'reversal', 'appellate court'];
    if (hasKeywords(combinedText, appealKeywords)) {
      return MASTER_SUGGESTED_RESPONSES.appeals.slice(0, 4);
    }
    
    // Sentence modification detection (high priority - specific)
    const sentenceKeywords = ['sentence reduction', 'reduce sentence', 'resentencing', 'sentence modification', 'time served', 'early release', 'parole', 'commutation', 'sentence reduction motion'];
    if (hasKeywords(combinedText, sentenceKeywords)) {
      return MASTER_SUGGESTED_RESPONSES.sentenceModification.slice(0, 4);
    }
    
    // Civil rights / Prison abuse detection (high priority - specific)
    const civilRightsKeywords = ['prison abuse', 'jail abuse', 'assault by guard', 'assault by officer', 'corrections officer', 'mistreatment', 'prison guard', 'jail guard', '1983', 'civil rights', 'prison conditions', 'excessive force', 'brutality'];
    if (hasKeywords(combinedText, civilRightsKeywords)) {
      return MASTER_SUGGESTED_RESPONSES.civilRights.slice(0, 4);
    }
    
    // Motions detection (medium-high priority)
    const motionKeywords = ['motion to dismiss', 'motion to suppress', 'motion for discovery', 'file a motion', 'motion hearing', 'suppress evidence', 'dismiss charges', 'motion practice'];
    if (hasKeywords(combinedText, motionKeywords)) {
      return MASTER_SUGGESTED_RESPONSES.motions.slice(0, 4);
    }
    
    // Category-specific detection
    const normalizedCategory = category?.toLowerCase() || '';
    
    // Criminal category detection
    if (normalizedCategory === 'criminal') {
      // Check for post-conviction specific terms
      const postConvictionKeywords = ['post-conviction', 'post conviction', 'after conviction', 'already convicted', 'serving time', 'incarcerated', 'in prison', 'in jail'];
      if (hasKeywords(combinedText, postConvictionKeywords)) {
        // Further refine based on specific issue
        if (hasKeywords(combinedText, ['appeal', 'overturn', 'reversal'])) {
          return MASTER_SUGGESTED_RESPONSES.appeals.slice(0, 4);
        }
        if (hasKeywords(combinedText, ['sentence', 'resentencing', 'reduction'])) {
          return MASTER_SUGGESTED_RESPONSES.sentenceModification.slice(0, 4);
        }
        return MASTER_SUGGESTED_RESPONSES.criminal.slice(0, 4);
      }
      
      // Pre-trial / charges keywords
      const preTrialKeywords = ['charges', 'arrested', 'indicted', 'prosecution', 'facing charges', 'criminal charges', 'arraignment', 'plea'];
      if (hasKeywords(combinedText, preTrialKeywords)) {
        return MASTER_SUGGESTED_RESPONSES.motions.slice(0, 4);
      }
      
      // Default criminal suggestions
      return MASTER_SUGGESTED_RESPONSES.criminal.slice(0, 4);
    }
    
    // Civil category detection
    if (normalizedCategory === 'civil') {
      // Employment-related
      const employmentKeywords = ['wage', 'employment', 'pay', 'salary', 'overtime', 'unpaid', 'employer', 'workplace', 'discrimination', 'harassment', 'wrongful termination', 'fired', 'laid off'];
      if (hasKeywords(combinedText, employmentKeywords)) {
        return MASTER_SUGGESTED_RESPONSES.civil.slice(0, 4);
      }
      
      // Housing/landlord-tenant
      const housingKeywords = ['landlord', 'tenant', 'eviction', 'rent', 'lease', 'housing', 'apartment', 'rental', 'security deposit', 'habitability'];
      if (hasKeywords(combinedText, housingKeywords)) {
        return MASTER_SUGGESTED_RESPONSES.civil.slice(0, 4);
      }
      
      // Default civil suggestions
      return MASTER_SUGGESTED_RESPONSES.civil.slice(0, 4);
    }
    
    // General detection (when category is not specified or is 'General')
    // Check for criminal-related terms
    const criminalGeneralKeywords = ['criminal', 'charges', 'arrested', 'indicted', 'prosecution', 'guilty', 'innocent', 'trial', 'conviction', 'defendant', 'prosecutor'];
    const criminalMatchCount = countMatches(combinedText, criminalGeneralKeywords);
    
    // Check for civil-related terms
    const civilGeneralKeywords = ['lawsuit', 'sue', 'suing', 'plaintiff', 'defendant', 'damages', 'compensation', 'breach of contract', 'negligence'];
    const civilMatchCount = countMatches(combinedText, civilGeneralKeywords);
    
    // If strong criminal indicators
    if (criminalMatchCount >= 2) {
      // Further refine
      if (hasKeywords(combinedText, ['appeal', 'conviction', 'verdict'])) {
        return MASTER_SUGGESTED_RESPONSES.appeals.slice(0, 4);
      }
      if (hasKeywords(combinedText, ['sentence', 'resentencing'])) {
        return MASTER_SUGGESTED_RESPONSES.sentenceModification.slice(0, 4);
      }
      return MASTER_SUGGESTED_RESPONSES.criminal.slice(0, 4);
    }
    
    // If strong civil indicators
    if (civilMatchCount >= 2) {
      return MASTER_SUGGESTED_RESPONSES.civil.slice(0, 4);
    }
    
    // Check for motion-related terms (can apply to both)
    if (hasKeywords(combinedText, ['motion', 'file motion', 'dismiss', 'suppress', 'discovery'])) {
      return MASTER_SUGGESTED_RESPONSES.motions.slice(0, 4);
    }
    
    // Default fallback
    return MASTER_SUGGESTED_RESPONSES.default.slice(0, 4);
  };

  // PDF.js completely disabled to prevent object property errors
  useEffect(() => {
    setPdfjsLib(null);
    console.log('🚨 [PDF DEBUG] PDF.js disabled to prevent object property errors');
  }, []);

  // Emoji mapping for common legal suggestions
  const suggestionEmojiMap: Record<string, string> = {
    // Default suggestions
    "I need help with a legal document": "📄",
    "I want to understand my legal options": "⚖️",
    "Can you explain what I should do?": "🤔",
    "I'm not sure what to file.": "❓",
    
    // Criminal suggestions
    "I need help with a post-conviction motion.": "🔴",
    "I want to challenge my conviction.": "⚖️",
    "I want to file a motion to reduce my sentence.": "📝",
    "I need help preparing for my criminal appeal.": "📋",
    
    // Civil rights suggestions
    "I want to file a civil suit against the prison.": "🏛️",
    "I was assaulted by a corrections officer.": "🚨",
    "I need to report abuse or mistreatment in jail.": "⚠️",
    "I want to file a federal 1983 civil rights complaint.": "🇺🇸",
    
    // Sentence modification suggestions
    "I want to request a sentence reduction.": "📉",
    "I need help filing a resentencing motion.": "📄",
    "I want to correct my sentence or record.": "✏️",
    "I'm eligible under new sentencing laws.": "📜",
    
    // Appeals suggestions
    "I want to appeal my conviction.": "⬆️",
    "I need help filing an appeal.": "📋",
    "What are my chances if I appeal?": "🎯",
    "Help me write a notice of appeal.": "✍️",
    
    // Motions suggestions
    "I want to file a motion to dismiss.": "❌",
    "I need help with a motion to suppress evidence.": "🔒",
    "I want to file a motion for discovery.": "🔍",
    "I need help preparing for trial.": "⚖️",
    
    // Civil suggestions
    "I need help with a wage claim.": "💰",
    "I want to sue my landlord.": "🏠",
    "I'm responding to a court notice.": "📬",
    "I need help writing a legal letter.": "✉️",
    
    // Legacy mappings for backward compatibility
    "Yes, I have the eviction notice": "📄",
    "I can upload my lease agreement": "📁",
    "How much time do I have to respond?": "✍️",
  };

  // Check if speech recognition is supported
  useEffect(() => {
    const isSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    const isSecureContext = window.isSecureContext || location.protocol === 'https:'
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    
    // Allow localhost in dev without HTTPS
    const fullySupported = isSupported && (isSecureContext || isLocalhost)
    
    setSpeechSupported(fullySupported)
    setSpeechServiceAvailable(true) // Assume it's available until proven otherwise
    
    if (!isSupported) {
      console.warn("Speech recognition not supported in this browser")
    } else if (!isSecureContext && !isLocalhost) {
      console.warn("Speech recognition requires HTTPS connection")
    }
  }, [])

  // No auto-scroll - show full messages without scrolling

  // Update suggestions when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      const aiMessages = messages.filter((msg) => msg.sender === "assistant")
      if (aiMessages.length > 0) {
        const lastPrompt = aiMessages[aiMessages.length - 1]?.text || ""
        const suggestions = getSuggestedReplies(lastPrompt)
        setDynamicSuggestions(suggestions)
      }
    }
  }, [messages])

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Rotate suggestions when a new assistant message arrives
  useEffect(() => {
    if (!messages) return;
    const assistantCount = messages.filter((msg) => msg.sender === "assistant").length;
    if (assistantCount !== lastAssistantCount) {
      // Get issue-specific suggestions and show 3-4 of them
      const issueSpecificSuggestions = detectLegalIssueAndGetSuggestions(messages, legalCategory);
      const shuffled = [...issueSpecificSuggestions].sort(() => 0.5 - Math.random());
      setRotatingSuggestions(shuffled.slice(0, Math.min(4, shuffled.length)));
      setLastAssistantCount(assistantCount);
    }
  }, [messages, lastAssistantCount, legalCategory]);

  // Update suggestions more frequently based on conversation content
  useEffect(() => {
    // Update suggestions whenever messages change (not just assistant messages)
    if (messages && messages.length > 0) {
      const issueSpecificSuggestions = detectLegalIssueAndGetSuggestions(messages, legalCategory);
      const shuffled = [...issueSpecificSuggestions].sort(() => 0.5 - Math.random());
      setRotatingSuggestions(shuffled.slice(0, Math.min(4, shuffled.length)));
    }
  }, [messages, legalCategory]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 200; // Corresponds to roughly 6 lines
      if (scrollHeight > maxHeight) {
        inputRef.current.style.height = `${maxHeight}px`;
        inputRef.current.style.overflowY = 'auto';
      } else {
        inputRef.current.style.height = `${scrollHeight}px`;
        inputRef.current.style.overflowY = 'hidden';
      }
    }
  }, [inputValue]);

  const handleSendMessage = (message: string) => {
    console.log("💬 handleSendMessage called with:", message);
    console.log("📊 onSendMessage function:", typeof onSendMessage);
    
    // HARD-CODED SAFEGUARDS TO PREVENT DUPLICATE SUBMISSIONS
    if (!message || !message.trim()) {
      console.log("❌ Empty message, not sending");
      return;
    }
    
    if (isWaitingForResponse) {
      console.log("❌ Already waiting for response, not sending");
      return;
    }
    
    // Check if this is a duplicate of the last message
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.sender === "user" && lastMessage.text === message) {
        console.log("❌ Duplicate message detected, not sending");
        return
      }
    }

    // Prevent rapid-fire submissions
    const now = Date.now();
    if (window.lastMessageTime && now - window.lastMessageTime < 1000) {
      console.log("❌ Rapid-fire submission blocked");
      return;
    }
    window.lastMessageTime = now;

    // If search mode is enabled, prepend instruction to use internet search
    let finalMessage = message;
    if (searchModeEnabled) {
      finalMessage = `[Please search the internet for current information about] ${message}`;
      setSearchModeEnabled(false); // Reset after use
    }

    console.log("✅ Calling onSendMessage with:", finalMessage);
    onSendMessage(finalMessage)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // HARD-CODED SAFEGUARDS
    if (!inputValue.trim()) {
      return;
    }
    
    if (isWaitingForResponse) {
      return;
    }
    
    // Prevent rapid-fire submissions
    const now = Date.now();
    if (window.lastMessageTime && now - window.lastMessageTime < 1000) {
      return;
    }
    
    handleSendMessage(inputValue.trim())
    setInputValue("")
  }

  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const startListening = async () => {
    if (!speechSupported) {
      const isSecureContext = window.isSecureContext || location.protocol === 'https:'
      const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      if (!isSecureContext && !isLocalhost) {
        alert("Speech recognition requires HTTPS connection. Please access the site via https://askailegal.com")
      } else {
        alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.")
      }
      return
    }

    // Reset error state
    setMicPermissionError(false)
    setIsListening(true)

    try {
      // Proactively request mic permission to avoid 'service-not-allowed'
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Immediately stop the tracks; we only needed the permission prompt
        stream.getTracks().forEach(track => track.stop())
      } catch (permErr: any) {
        console.warn("Microphone permission error:", permErr?.name || permErr)
        setIsListening(false)
        setMicPermissionError(true)
        if (permErr?.name === 'NotAllowedError') {
          alert("Microphone permission denied. Please allow microphone access in your browser's site settings and try again.")
        } else if (permErr?.name === 'NotFoundError') {
          alert("No microphone found. Please connect a microphone and try again.")
        } else {
          alert("Unable to access the microphone. Please check your browser settings and try again.")
        }
        return
      }

      // @ts-ignore - TypeScript doesn't know about webkitSpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        throw new Error("SpeechRecognition not available")
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // Continuous dictation with interim results so text appears as you speak
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        let finalText = ""
        let interimText = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (res.isFinal) {
            finalText += res[0].transcript
          } else {
            interimText += res[0].transcript
          }
        }
        if (finalText) {
          setInputValue((prev) => (prev ? prev + " " : "") + finalText.trim())
          setInterimTranscript("")
        } else {
          setInterimTranscript(interimText)
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        setInterimTranscript("")
        
        // Handle service-not-allowed with specific user guidance
        if (event.error === 'service-not-allowed') {
          console.warn("Speech recognition service not available - this may be due to browser restrictions or network policies")
          setMicPermissionError(true)
          setSpeechServiceAvailable(false)
          // Show a helpful message instead of just failing silently
          alert("Voice input is not available in your current browser/network environment. This can happen due to:\n\n• Corporate network restrictions\n• Browser security policies\n• VPN or firewall settings\n\nPlease try typing your message instead, or try a different browser/network.")
          return
        }
        
        // Provide user-friendly error messages for other errors
        switch (event.error) {
          case 'not-allowed':
            alert("Microphone permission denied. Please allow microphone access and try again.")
            setMicPermissionError(true)
            break
          case 'no-speech':
            // Don't show alert for no-speech, just log it
            console.warn("No speech detected")
            break
          case 'network':
            alert("Network error occurred. Please check your connection and try again.")
            break
          case 'aborted':
            console.warn("Speech recognition was interrupted")
            break
          case 'audio-capture':
            alert("No microphone found. Please check your microphone connection.")
            setMicPermissionError(true)
            break
          case 'language-not-supported':
            alert("Language not supported. Please try again.")
            break
          default:
            console.warn(`Speech recognition failed: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
        setInterimTranscript("")
      }

      recognition.start()
    } catch (error) {
      console.error("Failed to start speech recognition:", error)
      setIsListening(false)
      setMicPermissionError(true)
      // Don't show alert for service-not-allowed errors
      if (!error.message?.includes('service-not-allowed')) {
        alert("Failed to start speech recognition. Please try again.")
      }
    }
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop()
    } catch {}
    setIsListening(false)
    setInterimTranscript("")
  }

  const handleRetryMicPermission = async () => {
    setMicPermissionError(false)
    setSpeechServiceAvailable(true)
    await startListening()
  }

  const handleDisableVoiceInput = () => {
    setMicPermissionError(false)
    setSpeechServiceAvailable(false)
    setIsListening(false)
    setInterimTranscript("")
  }

  // Updated to send the message immediately when suggested response is clicked
  const handleSuggestedResponse = (text: string) => {
    console.log("💬 handleSuggestedResponse called with:", text);
    console.log("📊 onSendMessage function:", typeof onSendMessage);
    
    if (onSendMessage && text.trim()) {
      console.log("✅ Sending suggested response:", text);
      onSendMessage(text.trim());
    } else {
      console.log("❌ onSendMessage not available or empty text");
    }
  }

  // Handle file input change (support multiple files)
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🚨 [FILE INPUT DEBUG] File input change triggered');
    const files = event.target.files;
    console.log('🚨 [FILE INPUT DEBUG] Files selected:', files?.length || 0);
    
    // Prevent processing if already uploading
    if (isUploading) {
      console.log('🚨 [FILE INPUT DEBUG] Upload already in progress, ignoring file selection');
      return;
    }
    
    // Prevent processing if waiting for AI response
    if (isWaitingForResponse) {
      console.log('🚨 [FILE INPUT DEBUG] Waiting for AI response, ignoring file selection');
      return;
    }
    
    if (files && files.length > 0) {
      // Validate that all files exist
      const validFiles = Array.from(files).filter(file => file && file.name);
      console.log('🚨 [FILE INPUT DEBUG] Valid files:', validFiles.length);
      
      if (validFiles.length === 0) {
        console.log('🚨 [FILE INPUT DEBUG] No valid files found');
        return;
      }
      console.log('🚨 [FILE INPUT DEBUG] Processing files...');
      
      // Process files sequentially to avoid conflicts
      const processFiles = async () => {
        const processedFiles = [];
        const failedFiles = [];
        
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          
          try {
            console.log(`🚨 [FILE INPUT DEBUG] Processing file ${i + 1}:`, file.name);
            await handleFileUpload(file);
            processedFiles.push(file.name);
          } catch (error) {
            console.error(`🚨 [FILE INPUT DEBUG] Error processing file ${file.name}:`, error);
            failedFiles.push(file.name);
          }
        }
        
        // Send summary message after all files are processed
        if (processedFiles.length > 0) {
          const summaryMessage = `✅ Successfully uploaded ${processedFiles.length} document(s):\n\n${processedFiles.map((name, index) => `${index + 1}. ${name}`).join('\n')}\n\nI can now analyze these documents. You can ask me about:\n• Specific documents by number (Document 1, Document 2, etc.)\n• Documents by filename\n• Compare documents\n• Explain legal implications\n\nWhat would you like me to help you with?`;
          
          if (handleSendMessage) {
            try {
              handleSendMessage(summaryMessage);
            } catch (messageError) {
              console.error('🚨 [UPLOAD DEBUG] Error sending summary message:', messageError);
            }
          }
        }
        
        if (failedFiles.length > 0) {
          const errorMessage = `❌ Failed to upload ${failedFiles.length} document(s):\n\n${failedFiles.join('\n')}\n\nPlease try uploading these files again.`;
          if (handleSendMessage) {
            try {
              handleSendMessage(errorMessage);
            } catch (messageError) {
              console.error('🚨 [UPLOAD DEBUG] Error sending error message:', messageError);
            }
          }
        }
      };
      
      processFiles();
    } else {
      console.log('🚨 [FILE INPUT DEBUG] No files selected');
    }
    
    // Reset the input value so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };



    // Enhanced file upload handler with Step 3 parsing logic
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('🚨 [UPLOAD DEBUG] Starting file upload process for:', file.name);
    setIsUploading(true);
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.log('🚨 [UPLOAD DEBUG] Safety timeout triggered - resetting upload state');
      setIsUploading(false);
    }, 120000); // Increased to 2 minutes for very large documents (200+ pages)
    
    try {
      console.log('🚨 [UPLOAD DEBUG] Processing file:', file.name);
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileSize = file.size;
      
      // Simple file validation
      if (!file || fileSize === 0) {
        throw new Error('Invalid file selected');
      }
      
      // Check file size (limit to 200MB for large legal documents)
      if (fileSize > 200 * 1024 * 1024) {
        throw new Error('File size too large. Please select a file smaller than 200MB.');
      }
      
      // Check file type - expanded for legal documents
      const allowedTypes = [
        'pdf', 'docx', 'txt', 'doc', 'rtf', 'odt', // Documents
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', // Images
        'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', // Videos
        'mp3', 'wav', 'm4a', 'aac', 'ogg', // Audio
        'csv', 'xlsx', 'xls', 'ppt', 'pptx', // Data files
        'zip', 'rar', '7z' // Archives
      ];
      if (!allowedTypes.includes(ext || '')) {
        throw new Error(`Unsupported file type: ${ext}. Supported types: PDF, DOCX, TXT, DOC, RTF, ODT, JPG, PNG, MP4, MP3, CSV, XLSX, PPT, ZIP, and more.`);
      }
      
      console.log('🚨 [UPLOAD DEBUG] File validation passed');
      
      // Extract text content from the file using enhanced legal document extractor
      let documentData;
      try {
        // Use the new legal document extractor
        const { extractLegalDocumentText } = await import('@/utils/legalDocumentExtractor');
        documentData = await extractLegalDocumentText(file);
        console.log('🚨 [UPLOAD DEBUG] Legal document extracted, length:', documentData.content.length, 'pages:', documentData.pageCount);
      } catch (textError) {
        console.error('🚨 [UPLOAD DEBUG] Error extracting legal document:', textError);
        // Fallback to basic extraction
        const { extractText } = await import('@/utils/extractText');
        const documentText = await extractText(file);
        documentData = {
          id: uuidv4(),
        filename: file.name,
        fileType: ext,
        fileSize: fileSize,
        uploadTime: new Date().toISOString(),
        status: 'uploaded',
        content: documentText,
          parsedText: documentText,
          documentNumber: 0,
          pageCount: Math.ceil(documentText.length / 2000),
          documentType: 'text' as const,
          extractedMetadata: {}
        };
      }
      
      // Set document number when added to array
      documentData.documentNumber = 0; // Will be set when added to array

      // Store in localStorage
      if (typeof window !== 'undefined') {
        try {
          let docs: any[] = [];
          try {
            docs = JSON.parse(localStorage.getItem('uploaded_documents') || '[]');
          } catch {
            docs = [];
          }
          
          // Set document number based on current array length
          documentData.documentNumber = docs.length + 1;
          docs.push(documentData);
          localStorage.setItem('uploaded_documents', JSON.stringify(docs));
          
          // Store basic file info for backward compatibility
          localStorage.setItem("uploaded_file_name", file.name);
          localStorage.setItem("uploaded_file_type", ext || 'unknown');
          localStorage.setItem("uploaded_file_size", fileSize.toString());
          localStorage.setItem("uploaded_parsed_text", documentData.content);
          localStorage.setItem("uploaded_text", documentData.content);
          
          // Use the new centralized function
          const { saveUploadedParsedText } = await import('@/lib/uploadedDoc');
          saveUploadedParsedText(documentData.content);
          
          console.log('🚨 [UPLOAD DEBUG] File data stored in localStorage');
        } catch (storageError) {
          console.error('🚨 [UPLOAD DEBUG] Error storing file data:', storageError);
          // Don't fail the upload if localStorage fails
        }
      }

      // Call the parent's document upload handler if available
      if (onDocumentUpload) {
        try {
          const fileInfo = `File: ${file.name} (${ext?.toUpperCase()}, ${(fileSize / 1024).toFixed(1)}KB, ${documentData.pageCount || 1} pages)\n\nDocument Content:\n${documentData.content.substring(0, 500)}${documentData.content.length > 500 ? '...' : ''}`;
          onDocumentUpload(fileInfo, file.name);
          console.log('🚨 [UPLOAD DEBUG] Parent document upload handler called with content');
        } catch (parentError) {
          console.error('🚨 [UPLOAD DEBUG] Error calling parent upload handler:', parentError);
          // Don't fail the upload if parent handler fails
        }
      }

      console.log('🚨 [UPLOAD DEBUG] File processing completed successfully');
      
    } catch (error) {
      console.error('🚨 [UPLOAD DEBUG] Error processing file:', error);
      
      // Send error message to user
      const errorMessage = `❌ Upload failed: ${error.message || 'Unknown error occurred'}`;
      if (handleSendMessage) {
        try {
          handleSendMessage(errorMessage);
        } catch (messageError) {
          console.error('🚨 [UPLOAD DEBUG] Error sending error message:', messageError);
        }
      }
    } finally {
      console.log('🚨 [UPLOAD DEBUG] Cleaning up upload state');
      clearTimeout(safetyTimeout);
      setIsUploading(false);
    }
  }, [onDocumentUpload, handleSendMessage]);

  // Trigger file input click
  const handleUploadClick = () => {
    console.log('🚨 [UPLOAD BUTTON DEBUG] Upload button clicked');
    
    // Prevent multiple clicks while uploading
    if (isUploading) {
      console.log('🚨 [UPLOAD BUTTON DEBUG] Upload already in progress, ignoring click');
      return;
    }
    
    // Prevent upload while waiting for AI response
    if (isWaitingForResponse) {
      console.log('🚨 [UPLOAD BUTTON DEBUG] Waiting for AI response, ignoring click');
      return;
    }
    
    console.log('🚨 [UPLOAD BUTTON DEBUG] File input ref:', fileInputRef.current);
    
    if (fileInputRef.current) {
      try {
        // Reset the file input value to ensure the change event fires
        fileInputRef.current.value = '';
        fileInputRef.current.click();
        console.log('🚨 [UPLOAD BUTTON DEBUG] File input click triggered successfully');
      } catch (error) {
        console.error('🚨 [UPLOAD BUTTON DEBUG] Error triggering file input click:', error);
        // Reset upload state if there's an error
        setIsUploading(false);
      }
    } else {
      console.error('🚨 [UPLOAD BUTTON DEBUG] File input ref is null');
      // Reset upload state if file input is not found
      setIsUploading(false);
    }
  };

  // Manual reset function for stuck uploads
  const handleUploadReset = () => {
    console.log('🚨 [UPLOAD DEBUG] Manual reset triggered');
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Use dynamic suggestions from the last AI message instead of the passed-in suggestions
  const displaySuggestions = dynamicSuggestions.length > 0 ? dynamicSuggestions : (suggestedResponses || []).map((s) => s.text)

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages container - background removed since parent provides it */}
      <div className="flex-1">
        <div className="space-y-4">
        {(messages || []).map((message, index) => (
          <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 sm:p-4 text-sm sm:text-base ${
                message.sender === "user"
                  ? "bg-emerald-500 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {message.sender === "assistant" && (
                <div className="flex items-center mb-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold mr-2">
                    K
                  </div>
                  <span className="text-xs font-medium text-emerald-700">Khristian</span>
                </div>
              )}
              {message.sender === "user" && userName && (
                <div className="flex items-center justify-end mb-1">
                  <span className="text-xs font-medium text-white mr-2">{userName}</span>
                  <div className="w-5 h-5 rounded-full bg-white text-emerald-500 flex items-center justify-center text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatContent(message.text) }}></div>
            </div>
          </div>
        ))}

        {/* Typing indicator when waiting for response */}
        {isWaitingForResponse && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 rounded-bl-none">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Upload loading indicator */}
        {isUploading && (
          <div className="flex justify-start">
            <div className="bg-blue-100 rounded-lg p-3 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-sm text-blue-700">Processing document...</span>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Input Area - Mobile-first with iOS viewport fixes */}
      <div className="mt-6">
          <form onSubmit={handleSubmit} className="flex items-start space-x-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.doc,.rtf,.odt,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv,.mp3,.wav,.m4a,.aac,.ogg,.csv,.xlsx,.xls,.ppt,.pptx,.zip,.rar,.7z,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*,video/*,audio/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              multiple
            />
            
            {/* Upload button */}
            <Button
              type="button"
              size="icon"
              onClick={handleUploadClick}
              onDoubleClick={handleUploadReset}
              className="rounded-full shadow-md h-9 w-9 sm:h-10 sm:w-10 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={false}
              title={isUploading ? "Double-click to reset if stuck" : "Upload document"}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            {/* Internet Search button */}
            <Button
              type="button"
              size="icon"
              onClick={() => {
                setSearchModeEnabled(true);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              className={`rounded-full shadow-md h-9 w-9 sm:h-10 sm:w-10 ${
                searchModeEnabled 
                  ? "bg-emerald-500 hover:bg-emerald-600" 
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
              disabled={isWaitingForResponse || isUploading}
              title={searchModeEnabled ? "Search mode enabled - your next message will use internet search" : "Enable internet search for your next message"}
            >
              <Globe className="h-4 w-4" />
            </Button>
            
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                console.log('📝 Textarea onChange triggered, value:', e.target.value);
                setInputValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onFocus={() => {
                console.log('📝 Textarea focused');
                console.log('📊 isWaitingForResponse:', isWaitingForResponse);
                console.log('📊 isUploading:', isUploading);
              }}
              onClick={() => {
                console.log('📝 Textarea clicked');
              }}
              placeholder={searchModeEnabled ? "Type your search question (internet search enabled)..." : (currentQuestion ? "Type your answer..." : "Type a message...")}
              className={`flex-grow border rounded-2xl px-3 py-2 sm:px-4 sm:py-2 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 resize-none overflow-hidden placeholder:text-gray-500 ${
                searchModeEnabled ? "focus:ring-blue-500 border-blue-300" : "focus:ring-emerald-500"
              }`}
              disabled={isWaitingForResponse || isUploading}
              readOnly={false}
              rows={1}
              style={{
                color: '#111827',
                backgroundColor: '#ffffff',
                maxHeight: '50rem',
                minHeight: '2.5rem',
              }}
            />
            {/* Live interim transcript overlay (read-only) */}
            {isListening && interimTranscript && (
              <div className="absolute bottom-20 left-4 right-4 pointer-events-none select-none text-gray-400 text-sm">
                {interimTranscript}
              </div>
            )}
            {speechSupported ? (
              <Button
                type="button"
                size="icon"
                onClick={toggleSpeechRecognition}
                className={`rounded-full h-9 w-9 sm:h-10 sm:w-10 ${
                  isListening ? "bg-red-500 hover:bg-red-600" : 
                  !speechServiceAvailable ? "bg-orange-500 hover:bg-orange-600" :
                  "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
                disabled={isWaitingForResponse || isUploading}
                title={
                  isListening ? "Stop recording" : 
                  !speechServiceAvailable ? "Voice service unavailable - try typing instead" :
                  "Start voice input"
                }
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                className="rounded-full h-9 w-9 sm:h-10 sm:w-10 bg-gray-400 cursor-not-allowed"
                disabled
                title="Voice input not supported in this browser"
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white h-9 w-9 sm:h-10 sm:w-10"
              disabled={isWaitingForResponse || !inputValue.trim() || isUploading}
              onClick={() => {
                console.log("🔘 Send button clicked!");
                console.log("📊 inputValue:", inputValue);
                console.log("📊 isWaitingForResponse:", isWaitingForResponse);
                console.log("📊 isUploading:", isUploading);
                console.log("📊 onSendMessage:", typeof onSendMessage);
                
                if (!isWaitingForResponse && inputValue.trim() && !isUploading) {
                  console.log("✅ Sending message:", inputValue.trim());
                  handleSendMessage(inputValue.trim());
                  setInputValue("");
                } else {
                  console.log("❌ Message blocked by conditions");
                }
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Internet Search Capability Indicator */}
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>AI can search the internet for current case law and legal information</span>
            </div>
          </div>

          {/* Rotating Suggested Responses - Mobile-first */}
          {rotatingSuggestions.length > 0 && (
            <div className="mt-4 sm:mt-4">
              <p className="text-xs sm:text-sm text-gray-400 mb-4 mt-4">Suggested responses:</p>
              <div className="flex flex-wrap gap-3 sm:gap-3">
                {rotatingSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      console.log("🔘 Suggested response clicked:", suggestion);
                      handleSuggestedResponse(suggestion);
                    }}
                    className="px-3 py-1 sm:px-4 sm:py-1.5 bg-emerald-100 text-emerald-800 rounded-full font-medium text-xs sm:text-sm hover:bg-emerald-200 transition flex items-center gap-1"
                  >
                    <span>{suggestionEmojiMap[suggestion] || null}</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Document Button - Always visible and clickable */}
          <div className="mt-6 mb-4 flex flex-col items-center" style={{ zIndex: 1000, position: 'relative', width: '100%' }}>
            <button
              type="button"
              onClick={async (e) => {
                console.log('🔘 Generate Document button clicked!');
                
                e.preventDefault();
                e.stopPropagation();
                
                // Test if handler exists
                if (!onGenerateDocument) {
                  console.error('❌ onGenerateDocument handler is not defined');
                  alert('Document generation handler is not available. Please refresh the page.');
                  return;
                }
                
                // Call handler with error handling
                try {
                  console.log('✅ Calling onGenerateDocument...');
                  await onGenerateDocument();
                  console.log('✅ onGenerateDocument completed');
                } catch (error) {
                  console.error('❌ Error in document generation button:', error);
                  const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                  alert(`Document generation failed: ${errorMsg}`);
                }
              }}
              onMouseDown={(e) => {
                console.log('🖱️ Button mouse down event');
              }}
              onMouseUp={(e) => {
                console.log('🖱️ Button mouse up event');
              }}
              disabled={false}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: 1001,
                position: 'relative'
              }}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Generate Document and Case Analysis"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Document and Case Analysis
            </button>
          </div>

      </div>
    </div>
  )
}
