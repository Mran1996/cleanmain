"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EnhancedChatInterface } from "@/components/enhanced-chat-interface";
import { ProgressSteps } from "@/components/ProgressSteps";
import { StepLayout } from "@/components/step-layout";
import { useLegalAssistant } from "@/components/context/legal-assistant-context";
import { ATTORNEY_INTERVIEW_SYSTEM, ATTORNEY_INTERVIEW_PROMPTS } from "../step-1/prompts/attorney-interview";
import { Loader2, FileText, Trash2, Save, Download, ArrowLeft } from "lucide-react";
import { DocumentData } from "@/components/context/legal-assistant-context";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { getUploadedParsedText } from '@/lib/uploadedDoc';
import { SubscriptionGuard } from "@/components/subscription-guard";
import { SplitPaneLayout } from "@/components/split-pane-layout";
import { Textarea } from "@/components/ui/textarea";

function AIAssistantStep1SplitPaneContent() {
  const router = useRouter();
  const [isWaiting, setIsWaiting] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const [allDocuments, setAllDocuments] = useState<DocumentData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
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
    setChatCollapsed
  } = useLegalAssistant();

  // Load uploaded documents from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isProcessing) {
      const docsRaw = localStorage.getItem('uploaded_documents');
      if (docsRaw) {
        try {
          const docs = JSON.parse(docsRaw);
          setAllDocuments(docs);
        } catch (error) {
          console.error('Error parsing uploaded documents:', error);
          setAllDocuments([]);
        }
      } else {
        setAllDocuments([]);
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
        const firstName = localStorage.getItem("firstName") || "there";
        const hasDocument = getUploadedParsedText().trim().length > 0;
        
        let initialMessage = `Hi ${firstName}, 👋 I'm Khristian, your AI legal assistant.\n\nI'm going to conduct a comprehensive attorney-client interview with you. This thorough process involves 15-25 detailed questions across 5 phases to gather all the information needed for your legal document.\n\nThis interview will cover:\n• Basic case information\n• Detailed factual background\n• Legal analysis and issues\n• Your goals and strategy\n• Document preparation requirements\n\nOnce we complete this interview, we'll proceed to Step 2 where I'll generate your comprehensive, court-ready legal document based on all the information we've gathered.\n\nYou can upload documents anytime during our conversation to help me better understand your case.\n\nLet's start with the basics. What type of legal matter are we dealing with today?`;
        
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
      try {
        const res = await fetch("/api/suggested-replies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatHistory, category: selectedCategory }),
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
      setAllDocuments(latestDocs);

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

${documentInfo}`;

      // Prepare messages for API
      const messagesForAPI = [
        { role: "system", content: systemPrompt },
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
      
      console.log('🔍 [SPLIT-PANE DEBUG] Sending request to API:', {
        messagesCount: messagesForAPI.length,
        hasDocumentData: !!documentDataToSend,
        documentDataLength: documentDataToSend?.length || 0,
        systemPrompt: systemPrompt.substring(0, 200) + '...',
        lastMessage: messagesForAPI[messagesForAPI.length - 1]
      });

      const response = await fetch('/api/step1-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messagesForAPI,
          documentData: documentDataToSend
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
        
        return newHistory;
      });

      // Update context for Step 2
      if (setChatResponses) {
        const newHistory = [...chatHistory, userMessage, assistantMessage];
        setChatResponses(newHistory.filter(msg => msg.sender === "user").map(msg => msg.text));
      }

    } catch (err: unknown) {
      console.error("Chat Error:", err);
      
      let errorMessage = "I'm having technical difficulties right now. Please try again in a moment.";
      if (err instanceof Error && err.message.includes('timeout')) {
        errorMessage = "The request is taking longer than expected. Please try again.";
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

  const handleSuggestedResponseClick = (response: string) => {
    handleUserResponse(response);
  };

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
    toast.success("Conversation cleared successfully");
  };

  const cancelClearConversation = () => {
    setShowClearModal(false);
  };

  const handleGenerateDocument = async () => {
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
    
    // Show immediate feedback
    toast.info("Starting document generation...");
    setIsGeneratingDocument(true);
    
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

      // Add timeout for large documents
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genState),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log("📥 API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("📥 API response data:", data);
      
      if (!response.ok || data?.success === false) {
        const msg = data?.error || `HTTP ${response.status}`;
        console.error("❌ API error:", msg);
        
        // Provide more specific error messages
        if (msg.includes("No real case information")) {
          throw new Error("Please complete your conversation with the AI assistant first. The system needs to gather your case details before generating a document.");
        } else if (msg.includes("Rate limit")) {
          throw new Error("Please wait a moment and try again. The system is processing many requests.");
        } else {
          throw new Error(`Document generation failed: ${msg}`);
        }
      }

      const { docId } = data.data;
      console.log("✅ Document generated successfully, entering split-pane mode with docId:", docId);
      
      // Load the actual document content from the API
      try {
        const docResponse = await fetch(`/api/get-document/${docId}`);
        if (docResponse.ok) {
          const docData = await docResponse.json();
          const documentContent = docData.content || "Document content not available";
          console.log("📄 Loaded document content:", documentContent.substring(0, 200) + "...");
          enterSplitPaneMode(docId, documentContent);
        } else {
          // Fallback to the content from the generation response
          const documentContent = data.data.content || "Document content not available";
          enterSplitPaneMode(docId, documentContent);
        }
      } catch (error) {
        console.error("Error loading document content:", error);
        // Fallback to the content from the generation response
        const documentContent = data.data.content || "Document content not available";
        enterSplitPaneMode(docId, documentContent);
      }
      
    } catch (error) {
      console.error("Error generating document:", error);
      toast.error(`Failed to generate document: ${error instanceof Error ? error.message : "An unexpected error occurred"}`);
    } finally {
      setIsGeneratingDocument(false);
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
      
      // Add document to the documents array
      const newDocument = {
        id: Date.now().toString(),
        filename: filename,
        content: documentText,
        uploadedAt: new Date().toISOString()
      };
      
      setAllDocuments(prev => [...prev, newDocument]);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        const updatedDocs = [...allDocuments, newDocument];
        localStorage.setItem('uploaded_documents', JSON.stringify(updatedDocs));
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
        <h3 className="font-semibold text-gray-900">AI Legal Assistant</h3>
        <p className="text-sm text-gray-600">Continue your conversation</p>
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
            <h1 className="text-xl font-bold text-gray-900">Generated Legal Document</h1>
            <p className="text-sm text-gray-600">Edit and review your document</p>
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
              Save
            </Button>
            <Button 
              size="sm" 
              onClick={handleDownloadDocument}
              disabled={!documentId}
              className="bg-white border border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              <Download className="h-4 w-4 mr-1" />
              Download PDF
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
                  placeholder="Your legal document will appear here..."
                />
              </div>
              
              {/* Document Statistics */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>Characters: {documentContent.length.toLocaleString()}</span>
                    <span>Words: {documentContent.trim().split(/\s+/).filter(word => word.length > 0).length.toLocaleString()}</span>
                    <span>Lines: {documentContent.split('\n').length}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Generated</h3>
                <p className="text-gray-600 mb-4">
                  Complete your conversation with the AI assistant to generate your legal document.
                </p>
                <p className="text-sm text-gray-500">
                  Once you've provided all necessary information, click "Generate Document" to create your legal document.
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
        leftTitle="Ask AI Legal"
        rightTitle="Legal Document"
        isCollapsed={chatCollapsed}
        onToggleCollapse={() => setChatCollapsed(!chatCollapsed)}
      />
    );
  }

  // Regular Step 1 layout (before document generation)
  return (
    <StepLayout
      headerTitle="Step 1: Chat With Your Legal Assistant"
      headerSubtitle="Have a conversation with your AI legal assistant — we'll collect all the information needed for your legal document"
    >
      <div className="max-w-screen-sm mx-auto py-6 px-4 md:px-8">
        <div className="mb-4"><ProgressSteps current="chat" /></div>
        <div className="bg-white rounded-xl border p-4 md:p-6 shadow-sm">
        
        {/* Chat Controls */}
        {chatHistory.length > 0 && (
          <div className="mb-4 flex justify-center">
            <Button
              onClick={handleClearConversation}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Conversation
            </Button>
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
          legalCategory="criminal"
        />

        {/* Generate Document Button - Only show if we have chat history */}
        {chatHistory.length >= 2 && (
          <div className="mt-6 flex justify-center">
            <Button
                onClick={() => {
                  console.log("🔘 Generate Document button clicked!");
                  console.log("📊 Chat history length:", chatHistory.length);
                  console.log("📊 Is processing:", isProcessing);
                  handleGenerateDocument();
                }}
                title={`Generate document from ${chatHistory.length} chat messages`}
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
              disabled={isGeneratingDocument}
            >
              {isGeneratingDocument ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Document and Case Analysis
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Show message if no chat history */}
        {chatHistory.length < 2 && (
          <div className="mt-6 text-center text-gray-500">
            <p>Please have a conversation with the AI assistant first to generate a document.</p>
            <p className="text-sm">Current messages: {chatHistory.length}</p>
          </div>
        )}
        </div>
      </div>
      
      {/* Clear Conversation Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-orange-600">Clear Conversation?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear the conversation? This will remove all chat history and start fresh. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                onClick={cancelClearConversation}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                onClick={confirmClearConversation}
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </StepLayout>
  );
}

export default function AIAssistantStep1SplitPanePage() {
  return (
    <SubscriptionGuard
      fallbackTitle=""
      fallbackMessage="Access to the AI legal assistant requires an active subscription or a one-time purchase. This interactive chat helps gather information for your legal case and generates professional legal documents."
    >
      <AIAssistantStep1SplitPaneContent />
    </SubscriptionGuard>
  );
}
