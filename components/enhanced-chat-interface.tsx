"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Mic, MicOff, Paperclip, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/utils/translations"
import { getSuggestedReplies } from "@/utils/chat-suggestions"
// import * as mammoth from "mammoth" // Commented out for now
import { v4 as uuidv4 } from 'uuid'
import type React from "react"
import { sanitizeHTML } from "@/lib/validation"

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
  isGeneratingDocument?: boolean
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
  isGeneratingDocument = false,
}: EnhancedChatInterfaceProps) {
  const { t } = useTranslation()
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
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechServiceAvailable, setSpeechServiceAvailable] = useState(true)
  // const [micPermissionError, setMicPermissionError] = useState(false) // Commented out for now
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
  // const [pdfjsLib, setPdfjsLib] = useState<any>(null) // Commented out for now
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
    // setPdfjsLib(null); // Commented out since pdfjsLib is not defined
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

  const suggestionKeyMap: Record<string, string> = {
    "I need help with a legal document": "suggestion_need_help_legal_document",
    "I want to understand my legal options": "suggestion_understand_legal_options",
    "Can you explain what I should do?": "suggestion_explain_what_to_do",
    "I'm not sure what to file.": "suggestion_not_sure_what_to_file",
    "I need help with a post-conviction motion.": "suggestion_post_conviction_motion",
    "I want to challenge my conviction.": "suggestion_challenge_conviction",
    "I want to file a motion to reduce my sentence.": "suggestion_reduce_sentence_motion",
    "I need help preparing for my criminal appeal.": "suggestion_prepare_criminal_appeal",
    "I want to file a civil suit against the prison.": "suggestion_civil_suit_against_prison",
    "I was assaulted by a corrections officer.": "suggestion_assaulted_by_corrections_officer",
    "I need to report abuse or mistreatment in jail.": "suggestion_report_abuse_in_jail",
    "I want to file a federal 1983 civil rights complaint.": "suggestion_federal_1983_complaint",
    "I want to request a sentence reduction.": "suggestion_request_sentence_reduction",
    "I need help filing a resentencing motion.": "suggestion_resentencing_motion",
    "I want to correct my sentence or record.": "suggestion_correct_sentence_or_record",
    "I'm eligible under new sentencing laws.": "suggestion_eligible_new_sentencing_laws",
    "I want to appeal my conviction.": "suggestion_appeal_conviction",
    "I need help filing an appeal.": "suggestion_file_appeal_help",
    "What are my chances if I appeal?": "suggestion_chances_if_appeal",
    "Help me write a notice of appeal.": "suggestion_write_notice_of_appeal",
    "I want to file a motion to dismiss.": "suggestion_motion_to_dismiss",
    "I need help with a motion to suppress evidence.": "suggestion_motion_to_suppress",
    "I want to file a motion for discovery.": "suggestion_motion_for_discovery",
    "I need help preparing for trial.": "suggestion_prepare_for_trial",
    "I need help with a wage claim.": "suggestion_wage_claim_help",
    "I want to sue my landlord.": "suggestion_sue_landlord",
    "I'm responding to a court notice.": "suggestion_responding_court_notice",
    "I need help writing a legal letter.": "suggestion_write_legal_letter",
    "Yes, I have the court documents": "suggestion_yes_have_court_documents",
    "The court is located in [County]": "suggestion_court_located_in_county",
    "No court proceedings yet": "suggestion_no_court_proceedings_yet",
    "I need to verify the court information": "suggestion_verify_court_information",
    "The deadline is next week": "suggestion_deadline_next_week",
    "I have 30 days to respond": "suggestion_thirty_days_to_respond",
    "No deadlines mentioned": "suggestion_no_deadlines_mentioned",
    "I need to check the exact date": "suggestion_check_exact_date",
    "The issue started when...": "suggestion_issue_started_when",
    "The problem began after...": "suggestion_problem_began_after",
    "This has been ongoing since...": "suggestion_ongoing_since",
    "The situation arose when...": "suggestion_situation_arose_when",
    "Let me explain the situation": "suggestion_explain_situation",
    "I have documentation to support this": "suggestion_have_documentation",
    "I can provide more details": "suggestion_provide_more_details",
    "I need guidance on this matter": "suggestion_need_guidance_matter"
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
  // This updates after EVERY message change (both user and assistant messages)
  useEffect(() => {
    // Update suggestions whenever messages change (not just assistant messages)
    if (messages && messages.length > 0) {
      // Get the most recent messages for better context
      const recentMessages = messages.slice(-6); // Last 6 messages for context
      const issueSpecificSuggestions = detectLegalIssueAndGetSuggestions(recentMessages, legalCategory);
      const shuffled = [...issueSpecificSuggestions].sort(() => 0.5 - Math.random());
      setRotatingSuggestions(shuffled.slice(0, Math.min(4, shuffled.length)));
    } else {
      // Show default suggestions when there are no messages yet
      const defaultSuggestions = MASTER_SUGGESTED_RESPONSES.default.slice(0, 4);
      setRotatingSuggestions(defaultSuggestions);
    }
  }, [messages, legalCategory]);
  
  // Initialize suggestions on mount if none exist
  useEffect(() => {
    if (rotatingSuggestions.length === 0 && (!messages || messages.length === 0)) {
      const defaultSuggestions = MASTER_SUGGESTED_RESPONSES.default.slice(0, 4);
      setRotatingSuggestions(defaultSuggestions);
    }
  }, []);

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
    // HARD-CODED SAFEGUARDS TO PREVENT DUPLICATE SUBMISSIONS
    if (!message || !message.trim()) {
      return;
    }
    
    if (isWaitingForResponse) {
      return;
    }
    
    // Check if this is a duplicate of the last message
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.sender === "user" && lastMessage.text === message) {
        return
      }
    }

    // Prevent rapid-fire submissions
    const now = Date.now();
    if (window.lastMessageTime && now - window.lastMessageTime < 1000) {
      return;
    }
    window.lastMessageTime = now;

    // If search mode is enabled, prepend instruction to use internet search
    let finalMessage = message;
    if (searchModeEnabled) {
      finalMessage = `[Please search the internet for current information about] ${message}`;
      setSearchModeEnabled(false); // Reset after use
    }

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
    // setMicPermissionError(false) // Commented out for now
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
        // setMicPermissionError(true) // Commented out for now
        if (permErr?.name === 'NotAllowedError') {
          alert("Microphone permission denied. Please allow microphone access in your browser's site settings and try again.")
        } else if (permErr?.name === 'NotFoundError') {
          alert("No microphone found. Please connect a microphone and try again.")
        } else {
          alert("Unable to access the microphone. Please check your browser settings and try again.")
        }
        return
      }

      // @ts-expect-error - TypeScript doesn't know about webkitSpeechRecognition
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
          // setMicPermissionError(true) // Commented out for now
          setSpeechServiceAvailable(false)
          // Show a helpful message instead of just failing silently
          alert("Voice input is not available in your current browser/network environment. This can happen due to:\n\n• Corporate network restrictions\n• Browser security policies\n• VPN or firewall settings\n\nPlease try typing your message instead, or try a different browser/network.")
          return
        }
        
        // Provide user-friendly error messages for other errors
        switch (event.error) {
          case 'not-allowed':
            alert("Microphone permission denied. Please allow microphone access and try again.")
            // setMicPermissionError(true) // Commented out for now
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
            // setMicPermissionError(true) // Commented out for now
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
    } catch (error: unknown) {
      console.error("Failed to start speech recognition:", error)
      setIsListening(false)
      // setMicPermissionError(true) // Commented out for now
      // Don't show alert for service-not-allowed errors
      if (error instanceof Error && !error.message?.includes('service-not-allowed')) {
        alert("Failed to start speech recognition. Please try again.")
      }
    }
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // Error stopping speech recognition, ignore
    }
    setIsListening(false)
    setInterimTranscript("")
  }

  // Commented out unused functions for now - voice input features disabled
  // const handleRetryMicPermission = async () => {
  //   // setMicPermissionError(false) // Commented out for now
  //   setSpeechServiceAvailable(true)
  //   await startListening()
  // }

  // const handleDisableVoiceInput = () => {
  //   // setMicPermissionError(false) // Commented out for now
  //   setSpeechServiceAvailable(false)
  //   setIsListening(false)
  //   setInterimTranscript("")
  // }

  // Updated to send the message immediately when suggested response is clicked
  const handleSuggestedResponse = (text: string) => {
    if (onSendMessage && text.trim()) {
      onSendMessage(text.trim());
    }
  }

  // Handle file input change (support multiple files)
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    // Prevent processing if already uploading
    if (isUploading) {
      return;
    }
    
    // Prevent processing if waiting for AI response
    if (isWaitingForResponse) {
      return;
    }
    
    if (files && files.length > 0) {
      // Validate that all files exist
      const validFiles = Array.from(files).filter(file => file && file.name);
      
      if (validFiles.length === 0) {
        return;
      }
      
      // Process files sequentially to avoid conflicts
      const processFiles = async () => {
        const processedFiles = [];
        const failedFiles = [];
        
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          
          try {
            await handleFileUpload(file);
            processedFiles.push(file.name);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
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
              console.error('Error sending summary message:', messageError);
            }
          }
        }
        
        if (failedFiles.length > 0) {
          const errorMessage = `❌ Failed to upload ${failedFiles.length} document(s):\n\n${failedFiles.join('\n')}\n\nPlease try uploading these files again.`;
          if (handleSendMessage) {
            try {
              handleSendMessage(errorMessage);
            } catch (messageError) {
              console.error('Error sending error message:', messageError);
            }
          }
        }
      };
      
      processFiles();
    }
    
    // Reset the input value so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };



    // Enhanced file upload handler with Step 3 parsing logic
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setIsUploading(false);
    }, 120000); // Increased to 2 minutes for very large documents (200+ pages)
    
    try {
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
      
      // Extract text content from the file using enhanced legal document extractor
      let documentData;
      try {
        // Use the new legal document extractor
        const { extractLegalDocumentText } = await import('@/utils/legalDocumentExtractor');
        documentData = await extractLegalDocumentText(file);
      } catch (textError) {
        console.error('Error extracting legal document:', textError);
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
        } catch (storageError) {
          console.error('Error storing file data:', storageError);
          // Don't fail the upload if localStorage fails
        }
      }

      // Call the parent's document upload handler if available
      if (onDocumentUpload) {
        try {
          const fileInfo = `File: ${file.name} (${ext?.toUpperCase()}, ${(fileSize / 1024).toFixed(1)}KB, ${documentData.pageCount || 1} pages)\n\nDocument Content:\n${documentData.content.substring(0, 500)}${documentData.content.length > 500 ? '...' : ''}`;
          onDocumentUpload(fileInfo, file.name);
        } catch (parentError) {
          console.error('Error calling parent upload handler:', parentError);
          // Don't fail the upload if parent handler fails
        }
      }
      
    } catch (error: any) {
      console.error('Error processing file:', error);
      
      // Send error message to user
      const errorMessage = `❌ Upload failed: ${error.message || 'Unknown error occurred'}`;
      if (handleSendMessage) {
        try {
          handleSendMessage(errorMessage);
        } catch (messageError) {
          console.error('Error sending error message:', messageError);
        }
      }
    } finally {
      clearTimeout(safetyTimeout);
      setIsUploading(false);
    }
  }, [onDocumentUpload, handleSendMessage]);

  // Trigger file input click
  const handleUploadClick = () => {
    // Prevent multiple clicks while uploading
    if (isUploading) {
      return;
    }
    
    // Prevent upload while waiting for AI response
    if (isWaitingForResponse) {
      return;
    }
    
    if (fileInputRef.current) {
      try {
        // Reset the file input value to ensure the change event fires
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      } catch (error) {
        console.error('Error triggering file input click:', error);
        // Reset upload state if there's an error
        setIsUploading(false);
      }
    } else {
      // Reset upload state if file input is not found
      setIsUploading(false);
    }
  };

  // Manual reset function for stuck uploads
  const handleUploadReset = () => {
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Use dynamic suggestions from the last AI message instead of the passed-in suggestions
  const displaySuggestions = dynamicSuggestions.length > 0 ? dynamicSuggestions : (suggestedResponses || []).map((s) => s.text)
  
  // Combine all available suggestions - prioritize rotatingSuggestions, then displaySuggestions, then fallback to defaults
  // Always ensure we have suggestions to show
  const allSuggestions = (() => {
    if (rotatingSuggestions.length > 0) {
      return rotatingSuggestions;
    }
    if (displaySuggestions.length > 0) {
      return displaySuggestions;
    }
    // Fallback to default suggestions if nothing else is available
    return MASTER_SUGGESTED_RESPONSES.default.slice(0, 4);
  })()

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
                  : "bg-gradient-to-br from-slate-100 to-slate-200/90 text-gray-900 rounded-bl-none border-2 border-slate-300/60 shadow-md"
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
            <div className="bg-gradient-to-br from-slate-100 to-slate-200/90 rounded-lg p-3 rounded-bl-none border-2 border-slate-300/60 shadow-md">
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
                <span className="text-sm text-blue-700">{t('processing_document')}</span>
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
              title={isUploading ? t('double_click_reset') : t('upload_document')}
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
              title={searchModeEnabled ? t('search_mode_enabled_title') : t('enable_search_title')}
            >
              <Globe className="h-4 w-4" />
            </Button>
            
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={searchModeEnabled ? t('search_placeholder') : (currentQuestion ? t('answer_placeholder') : t('message_placeholder'))}
              className={`flex-grow border-2 rounded-2xl px-3 py-2 sm:px-4 sm:py-2 text-base text-gray-900 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none overflow-hidden placeholder:text-gray-500 shadow-sm ${
                searchModeEnabled ? "focus:ring-blue-500 border-blue-300" : "border-emerald-200 focus:ring-emerald-500 focus:border-emerald-400"
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
                  isListening ? t('stop_recording_title') : 
                  !speechServiceAvailable ? t('voice_service_unavailable_title') :
                  t('start_voice_input_title')
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
                title={t('voice_not_supported_title')}
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
                if (!isWaitingForResponse && inputValue.trim() && !isUploading) {
                  handleSendMessage(inputValue.trim());
                  setInputValue("");
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
              <span>{t('ai_search_internet_label')}</span>
            </div>
          </div>

          {/* Suggested Responses - Always visible */}
          <div className="mt-4 sm:mt-4">
            <p className="text-xs sm:text-sm text-gray-700 font-semibold mb-3 mt-4">{t('suggested_responses_label')}</p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {allSuggestions.length > 0 ? (
                allSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const displayText = t(suggestionKeyMap[suggestion] || suggestion);
                      handleSuggestedResponse(displayText);
                    }}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-800 rounded-full font-medium text-xs sm:text-sm hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 flex items-center gap-1 border-2 border-emerald-300/60 shadow-sm hover:shadow-md hover:border-emerald-400"
                  >
                    <span>{suggestionEmojiMap[suggestion] || null}</span>
                    {t(suggestionKeyMap[suggestion] || suggestion)}
                  </button>
                ))
              ) : (
                // Show placeholder if no suggestions are available yet
                <div className="text-xs text-gray-400 italic">{t('loading_suggestions_label')}</div>
              )}
            </div>
          </div>

          {/* Generate Document Button - Always visible and clickable */}
          <div className="mt-6 mb-4 flex flex-col items-center" style={{ zIndex: 1000, position: 'relative', width: '100%' }}>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Test if handler exists
                if (!onGenerateDocument) {
                  alert(t('document_handler_unavailable'));
                  return;
                }
                
                // Call handler with error handling
                try {
                  await onGenerateDocument();
                } catch (error) {
                  console.error('Error in document generation button:', error);
                  const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                  alert(`${t('document_generation_failed_prefix')} ${errorMsg}`);
                }
              }}
              disabled={isGeneratingDocument}
              style={{
                pointerEvents: isGeneratingDocument ? 'none' : 'auto',
                cursor: isGeneratingDocument ? 'not-allowed' : 'pointer',
                zIndex: 1001,
                position: 'relative'
              }}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] w-auto max-w-sm"
              aria-label={t('generate_document_and_analysis_aria')}
            >
              {isGeneratingDocument ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('generating_document')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-center">{t('generate_document_and_analysis')}</span>
                </>
              )}
            </button>
          </div>

      </div>
    </div>
  )
}
