"use client"

import React, { useState, useEffect } from 'react';
// import { useRouter } from "next/navigation"; // Commented out for now
import { Button } from "@/components/ui/button";
import { EnhancedChatInterface } from "@/components/enhanced-chat-interface";
import { ProgressSteps } from "@/components/ProgressSteps";
import { StepLayout } from "@/components/step-layout";
import { useLegalAssistant } from "@/components/context/legal-assistant-context";
import { ATTORNEY_INTERVIEW_SYSTEM, ATTORNEY_INTERVIEW_PROMPTS } from "../step-1/prompts/attorney-interview";
import { FileText, Trash2, Save, Download, FileX } from "lucide-react";
// import { DocumentData as UploadedDocumentData } from "@/lib/documentFormatter"; // Commented out for now
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { getUploadedParsedText } from '@/lib/uploadedDoc';
import { SubscriptionGuard } from "@/components/subscription-guard";
import { SplitPaneLayout } from "@/components/split-pane-layout";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/utils/translations";

function AIAssistantStep1SplitPaneContent() {
  const { t } = useTranslation();
  // const router = useRouter(); // Commented out for now
  const [isWaiting, setIsWaiting] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  // const [allDocuments, setAllDocuments] = useState<UploadedDocumentData[]>([]); // Commented out for now
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showClearDocumentModal, setShowClearDocumentModal] = useState(false);
  // const [isGeneratingDocument, setIsGeneratingDocument] = useState(false); // Commented out for now
 
  const { 
    chatHistory, 
    setChatHistory, 
    setChatResponses, 
    resetContext,
    isSplitPaneMode,
    enterSplitPaneMode,
    documentContent,
    setDocumentContent,
    documentId,
    chatCollapsed,
    setChatCollapsed,
    setDocumentId
  } = useLegalAssistant();

  // Load uploaded documents from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isProcessing) {
      const docsRaw = localStorage.getItem('uploaded_documents');
      if (docsRaw) {
        try {
          // const docs = JSON.parse(docsRaw); // Commented out for now
          // setAllDocuments(docs); // Commented out for now
        } catch (error) {
          console.error('Error parsing uploaded documents:', error);
          // setAllDocuments([]); // Commented out for now
        }
      } else {
        // setAllDocuments([]); // Commented out for now
      }
    }
  }, [isProcessing]);

  // Get legal category for context
  const getLegalCategory = () => {
    if (typeof window === 'undefined') return 'General';
    return localStorage.getItem("legalCategory") || "General";
  };

  const getCategoryPrompt = (category: string) => {
    switch(category.toLowerCase()) {
      case 'criminal':
        return ATTORNEY_INTERVIEW_PROMPTS.CRIMINAL_POST_CONVICTION;
      case 'civil':
        return ATTORNEY_INTERVIEW_PROMPTS.CIVIL_LITIGATION;
      case 'family':
        return ATTORNEY_INTERVIEW_PROMPTS.FAMILY_LAW;
      case 'employment':
        return ATTORNEY_INTERVIEW_PROMPTS.EMPLOYMENT_LAW;
      default:
        return ATTORNEY_INTERVIEW_PROMPTS.CIVIL_LITIGATION;
    }
  };

  // Load chat history and initialize conversation
  useEffect(() => {
    if (typeof window !== 'undefined' && chatHistory.length === 0) {
      const savedChatHistory = localStorage.getItem('step1_chat_history');
      if (savedChatHistory) {
        try {
          const parsedHistory = JSON.parse(savedChatHistory);
          setChatHistory(parsedHistory);
          return;
        } catch (error) {
          console.error('Error parsing saved chat history:', error);
        }
      }
      
      // Initialize with greeting if no saved history
      if (!isProcessing) {
        // const firstName = localStorage.getItem("firstName") || "there"; // Commented out for now
        // const hasDocument = getUploadedParsedText().trim().length > 0; // Commented out for now
        
        const initialMessage = `Hi there! I'm Khristian, your AI legal assistant, and I'm here to help.\n\nI'm going to conduct a **comprehensive consultation** with you. This thorough process involves **15-25 detailed questions** across 5 phases to gather all the information needed for your legal document.\n\nThis consultation will cover:\n• Basic case information\n• Detailed factual background\n• Legal analysis and issues\n• Your goals and strategy\n• Document preparation requirements\n\nOnce we complete this consultation, I'll generate your comprehensive, **court-ready legal document** and show it in the **preview panel on the right**.\n\nYou can **upload documents anytime** during our conversation to help me better understand your case.\n\nLet's start with the basics. What type of legal matter are we dealing with today?`;
        
        setChatHistory([{ sender: "assistant", text: initialMessage }]);
      }
    }
  }, [chatHistory.length, isProcessing]);

  // Handle URL parameters for pre-loading document content
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const docId = urlParams.get('docId');
      const content = urlParams.get('content');
      
      if (docId && content) {
        console.log('📄 Pre-loading document from URL parameters:', { docId, contentLength: content.length });
        setDocumentId(docId);
        setDocumentContent(decodeURIComponent(content));
        enterSplitPaneMode(docId, decodeURIComponent(content));
      }
    }
  }, []);

  // Fetch dynamic suggestions from OpenAI after each assistant message
  useEffect(() => {
    const fetchSuggestions = async () => {
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (!lastMsg || lastMsg.sender !== "assistant" || isProcessing || isWaiting) return;
      
      const selectedCategory = getLegalCategory();
      let lang: string | undefined = undefined;
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('preferredLanguage');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed.value === 'string') {
              lang = parsed.value;
            }
          }
        } catch {
          // Error parsing language preference, continue without language
        }
      }
      try {
        const res = await fetch("/api/suggested-replies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatHistory, category: selectedCategory, language: lang }),
        });
        const data = await res.json();
        setSuggestedResponses(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setSuggestedResponses([]);
      }
    };
    
    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [chatHistory, isProcessing, isWaiting]);

  const handleUserResponse = async (message: string) => {
    if (!message.trim() || isWaiting || isProcessing) return;
    
    // Clear suggestions when user sends a message
    setSuggestedResponses([]);
    
    setIsWaiting(true);
    setIsProcessing(true);

    try {
      // Reload documents from localStorage
      let latestDocs = [];
      if (typeof window !== 'undefined') {
        const docsRaw = localStorage.getItem('uploaded_documents');
        if (docsRaw) {
          try {
            latestDocs = JSON.parse(docsRaw);
          } catch (error) {
            console.error('Error parsing documents:', error);
          }
        }
      }
      // setAllDocuments(latestDocs); // Commented out for now

      // Add user message to chat history
      const userMessage = { sender: "user", text: message.trim() };
      setChatHistory((prev) => [...prev, userMessage]);

      // Build system prompt using the same prompt as working Step 1
      const documentInfo = latestDocs.length > 0 ? 
        `Document data available: ${latestDocs.length} documents uploaded. Reference these when relevant.` : 
        'No documents uploaded.';
      
      const selectedCategory = getLegalCategory();
      const categoryPrompt = getCategoryPrompt(selectedCategory);
      
      const systemPrompt = `${ATTORNEY_INTERVIEW_SYSTEM}

${categoryPrompt}

${documentInfo}

🔍 INTERNET SEARCH CAPABILITIES:
- You have access to real-time internet search to find current case law and legal information
- When users ask about specific cases, laws, or legal precedents, use the research tool to find current information
- You can search for recent court decisions, legal updates, and relevant case law
- Always provide accurate, up-to-date information when available
- NEVER say you don't have internet access - you do!
- When users ask about case law like Strickland v. Washington, ALWAYS search for current information`;

      // Add explicit instruction to ensure one question at a time
      const finalSystemPrompt = systemPrompt + "\n\nREMINDER: You must ask ONLY ONE question at a time. Do not ask multiple questions or group questions together in a single response.";

      // Prepare messages for API
      const messagesForAPI = [
        { role: "system", content: finalSystemPrompt },
        ...chatHistory.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        })),
        { role: "user", content: userMessage.text }
      ];

      // Get uploaded document data for analysis
      const uploadedDocumentText = getUploadedParsedText();
      console.log('🔍 [STEP1 DEBUG] Document data length:', uploadedDocumentText.length);
      console.log('🔍 [STEP1 DEBUG] Document data preview:', uploadedDocumentText.substring(0, 200));
      
      // Pass documents array if available, otherwise fall back to text
      let documentDataToSend = uploadedDocumentText;
      if (latestDocs && latestDocs.length > 0) {
        documentDataToSend = JSON.stringify(latestDocs);
        console.log('🔍 [STEP1 DEBUG] Sending documents array with', latestDocs.length, 'documents');
      }
      
      // Include generated document in chat context so chat is aware of it
      const generatedDocumentContent = documentContent?.trim() || "";
      
      console.log('🔍 [SPLIT-PANE DEBUG] Sending request to API:', {
        messagesCount: messagesForAPI.length,
        hasDocumentData: !!documentDataToSend,
        documentDataLength: documentDataToSend?.length || 0,
        hasGeneratedDocument: !!generatedDocumentContent,
        generatedDocumentLength: generatedDocumentContent?.length || 0,
        systemPrompt: systemPrompt.substring(0, 200) + '...',
        lastMessage: messagesForAPI[messagesForAPI.length - 1]
      });

      const response = await fetch('/api/step1-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messagesForAPI,
          documentData: documentDataToSend,
          generatedDocument: generatedDocumentContent
        }),
      });

      console.log('🔍 [SPLIT-PANE DEBUG] API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 [SPLIT-PANE DEBUG] API Response:', data);
      
      const assistantResponse = data.choices?.[0]?.message?.content || 
                               data.message?.content || 
                               data.content || 
                               data.reply || 
                               "I apologize, but I'm having trouble processing your request right now.";
      
      console.log('🔍 [SPLIT-PANE DEBUG] Extracted response:', assistantResponse);
      
      // Add assistant response to chat history
      const assistantMessage = { sender: "assistant", text: assistantResponse };
      setChatHistory((prev) => {
        const newHistory = [...prev, assistantMessage];
        
        // Save to localStorage for Step 2
        if (typeof window !== 'undefined') {
          localStorage.setItem('step1_chat_history', JSON.stringify(newHistory));
          localStorage.setItem('step1_chat_responses', JSON.stringify(newHistory.filter(msg => msg.sender === "user").map(msg => msg.text)));
        }
        
        // Auto-save to database after every 2 messages (user + assistant)
        if (newHistory.length >= 2 && newHistory.length % 2 === 0) {
          setTimeout(() => autoSaveChat(), 1000); // Delay to avoid too frequent saves
        }
        
        return newHistory;
      });

      // Update context for Step 2
      if (setChatResponses) {
        const newHistory = [...chatHistory, userMessage, assistantMessage];
        setChatResponses(newHistory.filter(msg => msg.sender === "user").map(msg => msg.text));
      }

    } catch (err: unknown) {
      console.error("Chat Error:", err);
      
      let errorMessage = t('chat_processing_error_message');
      if (err instanceof Error && err.message.includes('timeout')) {
        errorMessage = t('chat_timeout_message');
      }
      
      setChatHistory((prev) => [...prev, {
        sender: "assistant",
        text: errorMessage
      }]);
    } finally {
      setIsWaiting(false);
      setIsProcessing(false);
    }
  };

  // const handleSuggestedResponseClick = (response: string) => {
  //   handleUserResponse(response);
  // };

  const handleClearConversation = () => {
    setShowClearModal(true);
  };

  const confirmClearConversation = () => {
    resetContext();
    setSuggestedResponses([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem("step1_chat_history");
      localStorage.removeItem("step1_chat_responses");
      localStorage.removeItem("step1_comprehensive_data");
    }
    setShowClearModal(false);
    toast.success(t('conversation_cleared_success'));
  };

  const cancelClearConversation = () => {
    setShowClearModal(false);
  };

  const handleClearDocument = () => {
    setShowClearDocumentModal(true);
  };

  const confirmClearDocument = () => {
    setDocumentContent("");
    setDocumentId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem("finalDocument");
      localStorage.removeItem("currentDocumentId");
      localStorage.removeItem("documentGeneratedAt");
    }
    setShowClearDocumentModal(false);
    toast.success(t('document_cleared_success'));
  };

  const cancelClearDocument = () => {
    setShowClearDocumentModal(false);
  };

  // Check if there's a document to clear (either in state or localStorage)
  const hasDocumentToClear = () => {
    if (documentContent && documentContent.trim()) return true;
    if (documentId) return true;
    if (typeof window !== 'undefined') {
      const finalDoc = localStorage.getItem('finalDocument');
      const docId = localStorage.getItem('currentDocumentId');
      if (finalDoc || docId) return true;
    }
    return false;
  };

  // Auto-save current chat conversation
  const autoSaveChat = async () => {
    if (chatHistory.length < 2) return; // Don't save empty or single-message chats
    
    try {
      const title = generateChatTitle(chatHistory);
      const response = await fetch('/api/chat-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          messages: chatHistory,
          legal_category: 'criminal' // Default category
        })
      });
      
      if (response.ok) {
        console.log('Chat auto-saved successfully');
      }
    } catch (error) {
      console.error('Error auto-saving chat:', error);
    }
  };

  // Helper function to generate chat title
  const generateChatTitle = (messages: any[]) => {
    const userMessages = messages.filter(msg => msg.sender === 'user');
    if (userMessages.length === 0) return 'New Chat';
    
    const firstMessage = userMessages[0].text;
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
  };

  const handleGenerateDocument = async () => {
    console.log("🚀 handleGenerateDocument called in split-pane!");
    if (typeof window === 'undefined') {
      toast.error("Browser environment required");
      return;
    }
    
    console.log("🚀 Generate Document button clicked!");
    console.log("📊 Current chat history from context:", chatHistory);
    
    // Try to load chat history from localStorage as fallback
    let finalChatHistory = chatHistory;
    if (typeof window !== 'undefined' && chatHistory.length < 2) {
      try {
        const storedHistory = localStorage.getItem('step1_chat_history');
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory);
          console.log("📊 Loaded chat history from localStorage:", parsedHistory.length, "messages");
          finalChatHistory = parsedHistory;
        }
      } catch (error) {
          console.error("❌ Error loading chat history from localStorage:", error);
        }
    }
    
    console.log("📊 Final chat history to use:", finalChatHistory.length, "messages");
    
    // Show immediate feedback - NO DELAY MESSAGES
    // setIsGeneratingDocument(true); // Commented out for now
    
    // CRITICAL: Enter split-pane mode IMMEDIATELY so user sees the document page
    if (!isSplitPaneMode) {
      enterSplitPaneMode("", ""); // Enter split-pane mode with empty content
    }
    
    // Start with EMPTY document - it will fill immediately as chunks arrive
    setDocumentContent("");
    
    try {
      // Ensure we have a valid UUID for userId
      let userId = localStorage.getItem("userId");
      if (!userId) {
        userId = uuidv4();
        localStorage.setItem("userId", userId);
      }
      
      const genState = {
        userId: userId,
        title: `Legal Document - ${localStorage.getItem("legalCategory") || "Case"}`,
        caseNumber: localStorage.getItem("caseNumber"),
        county: localStorage.getItem("county"),
        state: localStorage.getItem("state") || "California",
        opposingParty: localStorage.getItem("opposingParty"),
        courtName: localStorage.getItem("courtName"),
        includeCaseLaw: localStorage.getItem("includeCaseLaw") === "true",
        chatHistory: finalChatHistory.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        }))
      };

      // Validate that we have meaningful chat history
      if (finalChatHistory.length < 2) {
        console.error("❌ Insufficient chat history:", finalChatHistory.length, "messages");
        throw new Error("Please have a conversation with the AI assistant first to gather your case information.");
      }

      console.log("📊 Chat history validation passed:", {
        messageCount: finalChatHistory.length,
        messages: finalChatHistory.map(msg => ({ sender: msg.sender, textLength: msg.text.length }))
      });

      console.log("📤 Sending request to API with data:", genState);

      // STREAMING: Handle real-time document generation like ChatGPT
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genState),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      // Check if response is streaming (text/event-stream)
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        // STREAMING MODE: Display chunks as they arrive in real-time
        // Streaming response detected - starting real-time display (silent)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let finalDocId = "";
        let buffer = ""; // Buffer for incomplete lines

        if (!reader) {
          throw new Error("Stream reader not available");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Stream complete (silent)
            break;
          }

          // Decode and add to buffer
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          
          // Keep last incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue; // Skip empty lines
            
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                
                const data = JSON.parse(jsonStr);
                
                if (data.type === "chunk") {
                  // Append chunk IMMEDIATELY - REAL-TIME DISPLAY
                  accumulatedContent += data.content;
                  setDocumentContent(accumulatedContent);
                  // Chunk received and displayed (silent)
                } else if (data.type === "done") {
                  // Stream complete (silent)
                  finalDocId = data.docId || "";
                  if (data.document) {
                    accumulatedContent = data.document;
                    setDocumentContent(accumulatedContent);
                  }
                  setDocumentId(finalDocId);
                  // setIsGeneratingDocument(false); // Commented out for now
                  
                  if (!isSplitPaneMode) {
                    enterSplitPaneMode(finalDocId, accumulatedContent);
                  }
                  
                  // NO NOTIFICATIONS - document is already visible
                  return; // Exit function
                } else if (data.type === "error") {
                  throw new Error(data.error || "Stream error occurred");
                }
              } catch (parseError) {
                // Skip invalid JSON - log for debugging
                console.warn("⚠️ Failed to parse stream line:", line, parseError);
                continue;
              }
            }
          }
        }
        
        // If we exit loop without "done" signal, use accumulated content
        if (accumulatedContent) {
          setDocumentContent(accumulatedContent);
          // setIsGeneratingDocument(false); // Commented out for now
        }
      } else {
        // FALLBACK: Non-streaming response (legacy support)
        const data = await response.json();
        
        if (data?.success === false) {
          const msg = data?.error || `HTTP ${response.status}`;
          throw new Error(msg);
        }

        const { docId } = data.data || {};
        const fullDocument = data.data?.content || data.data?.document || "";
        
        if (!fullDocument || fullDocument.trim().length === 0) {
          throw new Error("Document was generated but content is empty");
        }
        
        // Display document immediately
        setDocumentContent(fullDocument);
        setDocumentId(docId);
        // setIsGeneratingDocument(false); // Commented out for now
        
        if (!isSplitPaneMode) {
          enterSplitPaneMode(docId, fullDocument);
        }
        
        // NO NOTIFICATIONS - document is already visible
      }
      
    } catch (error) {
      console.error("Error generating document:", error);
      
      // Show error in document viewer - NO TOAST NOTIFICATION
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setDocumentContent(`❌ Error: ${errorMessage}\n\nPlease check the browser console (F12) for more details.\n\nIf this persists, please try refreshing the page and generating again.`);
      // setIsGeneratingDocument(false); // Commented out for now
    }
  };

  const handleSaveDocument = async () => {
    if (!documentId || !documentContent) {
      toast.error("No document to save");
      return;
    }

    try {
      // Use the existing document update API
      const response = await fetch(`/api/update-document/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: documentContent })
      });

      if (response.ok) {
        toast.success("Document saved successfully");
        // Update the context with the saved content
        setDocumentContent(documentContent);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save document");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error(`Failed to save document: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDownloadDocument = async () => {
    if (!documentId) {
      toast.error("No document to download");
      return;
    }

    try {
      // Use the existing document download API
      const response = await fetch(`/api/download/document/${documentId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `legal-document-${documentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Document downloaded successfully");
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to download document");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error(`Failed to download document: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDocumentUpload = async (documentText: string, filename: string) => {
    try {
      console.log('📄 Document uploaded:', { filename, length: documentText.length });
      // The EnhancedChatInterface already stores the full document metadata in localStorage.
      // Simply reload the uploaded documents to keep our local state in sync.
      if (typeof window !== 'undefined') {
        try {
            // const docsRaw = localStorage.getItem('uploaded_documents'); // Commented out for now
            // const updatedDocs: UploadedDocumentData[] = docsRaw ? JSON.parse(docsRaw) : []; // Commented out for now
            // setAllDocuments(updatedDocs); // Commented out for now
          } catch (error) {
          console.error('Error reloading uploaded documents:', error);
        }
      }

      toast.success(`Document "${filename}" uploaded successfully`);
    } catch (error) {
      console.error('Error handling document upload:', error);
      toast.error('Failed to upload document');
    }
  };

  // Chat content for split-pane - using the original EnhancedChatInterface
  const chatContent = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-white">
            <h3 className="font-semibold text-gray-900">{t('ai_legal_assistant_label')}</h3>
            <p className="text-sm text-gray-600">{t('continue_your_conversation_label')}</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <EnhancedChatInterface
          messages={chatHistory}
          onSendMessage={handleUserResponse}
          isWaitingForResponse={isWaiting}
          currentQuestion=""
          userName={typeof window !== 'undefined' ? localStorage.getItem("firstName") || "User" : "User"}
          suggestedResponses={suggestedResponses.map((text) => ({ text }))}
          onDocumentUpload={handleDocumentUpload}
          legalCategory={getLegalCategory()}
        />
      </div>
    </div>
  );

  // Document content for split-pane - using real document content
  const documentViewer = (
    <div className="h-full flex flex-col">
      {/* Document Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('generated_legal_document_title')}</h1>
            <p className="text-sm text-gray-600">{t('edit_review_document_label')}</p>
            {documentId && (
              <p className="text-xs text-gray-500">Document ID: {documentId}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={handleSaveDocument}
              disabled={!documentId}
              className="bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              <Save className="h-4 w-4 mr-1" />
              {t('save')}
            </Button>
            <Button 
              size="sm" 
              onClick={handleDownloadDocument}
              disabled={!documentId}
              className="bg-white border border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              <Download className="h-4 w-4 mr-1" />
              {t('download_pdf_label')}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Document Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {documentContent ? (
            <>
              <div className="bg-white border rounded-lg shadow-sm">
                <Textarea
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  className="min-h-[calc(100vh-200px)] resize-none border-0 focus:ring-0 p-6 text-sm leading-relaxed"
                  placeholder={t('doc_generated_placeholder')}
                />
              </div>
              
              {/* Document Statistics */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                    <span>{t('characters_label')}: {documentContent.length.toLocaleString()}</span>
                    <span>{t('words_label')}: {documentContent.trim().split(/\s+/).filter(word => word.length > 0).length.toLocaleString()}</span>
                    <span>{t('lines_label')}: {documentContent.split('\n').length}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('last_updated_label')}: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_document_generated_title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('complete_conversation_generate_document_label')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('click_generate_document_label')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If in split-pane mode, show the split-pane layout
  if (isSplitPaneMode) {
    return (
      <SplitPaneLayout
        leftContent={chatContent}
        rightContent={documentViewer}
        leftTitle={t('nav_chat')}
        rightTitle={t('document_label')}
        isCollapsed={chatCollapsed}
        onToggleCollapse={() => setChatCollapsed(!chatCollapsed)}
      />
    );
  }

  // Regular Step 1 layout (before document generation)
  return (
    <StepLayout
      headerTitle={t('ai_header_title')}
      headerSubtitle=""
    >
      <div className="max-w-screen-sm mx-auto py-6 px-4 md:px-8">
        <div className="mb-4"><ProgressSteps current="chat" /></div>
        <div className="bg-white rounded-xl border p-4 md:p-6 shadow-sm">
        
        {/* Chat Controls */}
        {chatHistory.length > 0 && (
          <div className="mb-4 flex justify-center gap-2">
            <Button
              onClick={handleClearConversation}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('clear_conversation_title')}
            </Button>
            {hasDocumentToClear() && (
              <Button
                onClick={handleClearDocument}
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
              >
                <FileX className="h-4 w-4 mr-2" />
                {t('clear_document_title')}
              </Button>
            )}
          </div>
        )}
        
        {/* Enhanced Chat Interface */}
        <EnhancedChatInterface
          messages={chatHistory}
          onSendMessage={handleUserResponse}
          isWaitingForResponse={isWaiting}
          currentQuestion=""
          userName={typeof window !== 'undefined' ? localStorage.getItem("firstName") || "User" : "User"}
          suggestedResponses={suggestedResponses.map((text) => ({ text }))}
          onDocumentUpload={() => {}}
          legalCategory={getLegalCategory()}
          onGenerateDocument={handleGenerateDocument}
        />

        </div>
      </div>
      
      {/* Clear Conversation Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-orange-600">{t('clear_conversation_title')}</h3>
            <p className="text-gray-600 mb-6">
              {t('clear_conversation_desc')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                onClick={cancelClearConversation}
              >
                {t('cancel_short')}
              </button>
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                onClick={confirmClearConversation}
              >
                {t('yes_clear')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Clear Document Confirmation Modal */}
      {showClearDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-orange-600">{t('clear_document_title')}</h3>
            <p className="text-gray-600 mb-6">
              {t('clear_document_desc')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                onClick={cancelClearDocument}
              >
                {t('cancel_short')}
              </button>
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                onClick={confirmClearDocument}
              >
                {t('yes_clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </StepLayout>
  );
}

export default function AIAssistantStep1SplitPanePage() {
  const { t } = useTranslation();
  return (
    <SubscriptionGuard
      fallbackTitle=""
      fallbackMessage={t('subscription_guard_ai_fallback_message')}
    >
      <AIAssistantStep1SplitPaneContent />
    </SubscriptionGuard>
  );
}
