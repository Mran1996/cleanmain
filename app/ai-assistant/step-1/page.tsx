"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EnhancedChatInterface } from "@/components/enhanced-chat-interface";
import { StepLayout } from "@/components/step-layout";
import { useLegalAssistant } from "@/components/context/legal-assistant-context";
import { ATTORNEY_INTERVIEW_SYSTEM, ATTORNEY_INTERVIEW_PROMPTS } from "./prompts/attorney-interview";
import { Loader2, FileText, Trash2, Info, Save, Download, Mail, MessageSquare } from "lucide-react";
import { DocumentData } from "@/components/context/legal-assistant-context";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { getUploadedParsedText } from '@/lib/uploadedDoc';
import { SubscriptionGuard } from "@/components/subscription-guard";
import { SplitPaneLayout } from "@/components/split-pane-layout";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/utils/supabase/client";

function AIAssistantStep1Content() {
  const router = useRouter();
  const [isWaiting, setIsWaiting] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const [allDocuments, setAllDocuments] = useState<DocumentData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSplitPane, setShowSplitPane] = useState(false);
  const [documentPreview, setDocumentPreview] = useState("");
  const [caseAnalysis, setCaseAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { 
    chatHistory, 
    setChatHistory, 
    setChatResponses, 
    resetContext
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

  // Button handlers
  const handleSave = async () => {
    if (!documentPreview.trim()) {
      toast.error('No document to save');
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to save documents');
        return;
      }

      const response = await fetch('/api/save-generated-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Legal Document',
          content: documentPreview,
          document_type: 'legal_document',
          legal_category: getLegalCategory(),
          metadata: {
            generated_from: 'step1_preview',
            legal_category: getLegalCategory()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const result = await response.json();
      toast.success('Document saved successfully!');
      console.log('Document saved:', result);
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    }
  };

  const handleEmail = () => {
    if (!documentPreview.trim()) {
      toast.error('No document to email');
      return;
    }

    try {
      const subject = encodeURIComponent('Legal Document');
      const body = encodeURIComponent(documentPreview);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch (err) {
      toast.error('Failed to open email client');
    }
  };

  const handleDownload = () => {
    if (!documentPreview.trim()) {
      toast.error('No document to download');
      return;
    }

    try {
      const blob = new Blob([documentPreview], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Legal_Document.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Document downloaded!');
    } catch (err) {
      toast.error('Failed to download document');
    }
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

      // Build system prompt
      const documentInfo = latestDocs.length > 0 ? 
        `Document data available: ${latestDocs.length} documents uploaded. Reference these when relevant.` : 
        'No documents uploaded.';
      
      const systemPrompt = `You are Khristian, a legal assistant conducting an attorney-client interview. ${documentInfo}

Key rules:
- Ask ONE question at a time
- Be natural and conversational like a real attorney
- Reference uploaded documents when relevant
- Write responses in plain, natural text without special formatting`;

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
      
      const response = await fetch('/api/step1-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messagesForAPI,
          documentData: documentDataToSend
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const assistantResponse = data.choices?.[0]?.message?.content || 
                               data.message?.content || 
                               data.content || 
                               data.reply || 
                               "I apologize, but I'm having trouble processing your request right now.";
      
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

  // Fetch projects from database
  const fetchProjects = async () => {
    if (typeof window === 'undefined') return;
    
    setProjectsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to view your projects");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setProjectsLoading(false);
    }
  };

  // Handle project selection
  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
    setOpen(false);
    
    // Load project data into the interface
    if (project.content) {
      setDocumentPreview(project.content);
    }
    if (project.chat_history) {
      try {
        const parsedHistory = JSON.parse(project.chat_history);
        setChatHistory(parsedHistory);
        toast.success(`Loaded project: ${project.title}`);
      } catch (error) {
        console.error("Error parsing chat history:", error);
        toast.error("Failed to load chat history");
      }
    }
  };

  // Save current project
  const saveCurrentProject = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to save projects");
        return;
      }

      const projectData = {
        user_id: user.id,
        title: `Legal Document - ${new Date().toLocaleDateString()}`,
        content: documentPreview,
        chat_history: JSON.stringify(chatHistory),
      };

      const { error } = await supabase
        .from("projects")
        .insert(projectData);

      if (error) {
        console.error("Error saving project:", error);
        toast.error("Failed to save project");
      } else {
        toast.success("Project saved successfully!");
        fetchProjects(); // Refresh the list
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
    }
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
    toast.info("Starting document generation... This may take up to 5 minutes for complex documents.");
    setIsProcessing(true);
    
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
      console.log("📊 Chat history details:", {
        length: finalChatHistory.length,
        messages: finalChatHistory.map(msg => ({ sender: msg.sender, text: msg.text.substring(0, 100) + '...' }))
      });

      // Add timeout for large documents
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("⏰ API call timed out after 5 minutes");
        controller.abort();
      }, 300000); // 5 minutes timeout for full document generation

      // Add progress updates for long-running requests
      const progressInterval = setInterval(() => {
        toast.info("AI is still processing your document... This is normal for complex legal documents.");
      }, 60000); // Show progress every minute

      console.log("🚀 Making API call to /api/generate-document (full processing)");
      
      // Use the main document generation API that processes chat history
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genState),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      console.log("📥 API response received:", response.status);
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

      const { docId, document } = data.data;
      console.log("✅ Document generated successfully, updating document preview");
      
      // Update the document preview with the generated content
      if (document) {
        setDocumentPreview(document);
        toast.success("Document generated successfully! Check the preview on the right.");
        
        // Auto-save the project to database
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const projectData = {
              user_id: user.id,
              title: `Legal Document - ${new Date().toLocaleDateString()}`,
              content: document,
              chat_history: JSON.stringify(finalChatHistory),
            };

            const { error } = await supabase
              .from("projects")
              .insert(projectData);

            if (!error) {
              console.log("✅ Project auto-saved to database");
            }
          }
        } catch (error) {
          console.error("❌ Error auto-saving project:", error);
        }
      } else {
        console.error("❌ No document content in API response");
        toast.error("Document generated but content not received. Please try again.");
      }
      
    } catch (error) {
      console.error("Error generating document:", error);
      
      // Clear any pending intervals
      if (typeof progressInterval !== 'undefined') {
        clearInterval(progressInterval);
      }
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error("Document generation timed out after 5 minutes. The AI is processing a complex document. Please try again or contact support if this persists.");
        } else if (error.message.includes('fetch')) {
          toast.error("Network error. Please check your connection and try again.");
        } else if (error.message.includes('API Error')) {
          toast.error(`API Error: ${error.message}`);
        } else {
          toast.error(`Failed to generate document: ${error.message}`);
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };



  // Chat content for left pane
  const chatContent = (
    <div className="h-full flex flex-col">
      {/* Chat Header with Clear Conversation button */}
      {chatHistory.length > 0 && (
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
          <div className="flex items-center gap-2">
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
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        
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
          <div className="mt-6 flex justify-center gap-2">
            <Button
                onClick={() => {
                  console.log("🔘 Generate Document button clicked!");
                  console.log("📊 Chat history length:", chatHistory.length);
                  console.log("📊 Is processing:", isProcessing);
                  handleGenerateDocument();
                }}
                title={`Generate document from ${chatHistory.length} chat messages`}
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
              disabled={isProcessing}
            >
              {isProcessing ? (
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
  );

  // Document preview content for right pane - matches Step 2 layout
  const documentPreviewContent = (
    <div className="h-full flex flex-col">
      {/* Match chat header spacing/style so rows align horizontally */}
      <div className="px-6 py-4 border-b border-gray-300 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-gray-900">Document</span>
            <p className="text-xs text-gray-500">Legal Document Preview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave}
            disabled={!documentPreview.trim()} 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button 
            onClick={handleEmail}
            disabled={!documentPreview.trim()} 
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={!documentPreview.trim()} 
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            onClick={() => setShowSplitPane(!showSplitPane)}
            variant="outline"
            size="sm"
            className="border-gray-300 hover:bg-gray-50"
          >
            {showSplitPane ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>
      </div>
      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-5xl mx-auto">
          {/* Document Textarea */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
            <Textarea
              className="w-full min-h-[300px] font-mono text-base border-0 focus:ring-0 p-6 bg-transparent"
              value={documentPreview}
              onChange={e => setDocumentPreview(e.target.value)}
              disabled={isProcessing}
              placeholder={
                isProcessing ? "Generating document..." : 
                documentPreview ? "Your generated legal document appears above..." :
                "Your generated legal document will appear here..."
              }
            />
          </div>
          {isProcessing && <div className="flex items-center mt-2 text-gray-500"><Loader2 className="animate-spin mr-2" /> Generating document...</div>}
          {documentPreview && !isProcessing && (
            <div className="flex items-center mt-2 text-green-600">
              <FileText className="mr-2 h-4 w-4" />
              Document generated successfully! You can edit it above or proceed to Step 2.
            </div>
          )}

          {/* AI Case Success Analysis Section */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 mb-6">
            <div className="text-xl font-bold text-green-800 mb-2">AI-Powered Case Success Analysis</div>
            
            {/* Generate AI Case Analysis Buttons */}
            <div className="w-full max-w-5xl mx-auto flex flex-row flex-wrap gap-2 mb-4 justify-center overflow-x-auto pb-2">
              <Button 
                onClick={async () => {
                  if (!documentPreview.trim()) {
                    toast.error('Please generate a document first before creating case analysis');
                    return;
                  }
                  
                  setAnalysisLoading(true);
                  setCaseAnalysis(null);
                  
                  try {
                    toast.info('Generating AI Case Analysis...');
                    
                    const analysisResponse = await fetch('/api/case-success-analysis', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        documentText: documentPreview,
                        state: 'Washington',
                        legalCategory: 'Criminal',
                        courtName: 'King County Superior Court',
                        caseNumber: '24-12345',
                        userInfo: { firstName: 'John', lastName: 'Doe' },
                        caseInfo: { opposingParty: 'State of Washington' }
                      })
                    });
                    
                    if (analysisResponse.ok) {
                      const analysisData = await analysisResponse.json();
                      console.log('✅ Case analysis generated:', analysisData);
                      setCaseAnalysis(analysisData);
                      toast.success('AI Case Analysis generated successfully!');
                    } else {
                      const errorData = await analysisResponse.json();
                      throw new Error(errorData.error || 'Analysis generation failed');
                    }
                  } catch (error) {
                    console.error('❌ Case analysis error:', error);
                    toast.error(`Failed to generate case analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  } finally {
                    setAnalysisLoading(false);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white" 
                disabled={isProcessing || !documentPreview.trim() || analysisLoading}
              >
                {analysisLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Case...
                  </>
                ) : (
                  'Generate AI Case Analysis'
                )}
              </Button>
              <Button 
                onClick={() => {
                  toast.info('Download AI Case Analysis coming soon!');
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white" 
                disabled={isProcessing}
              >
                Download AI Case Analysis
              </Button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto pr-2">
              {caseAnalysis ? (
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold mb-2">{caseAnalysis.title || "Case Analysis"}</h2>
                  <div className="mb-2"><b>Jurisdiction:</b> {caseAnalysis.jurisdiction}</div>
                  <div className="mb-2"><b>Case Type:</b> {caseAnalysis.caseType}</div>
                  <div className="mb-2"><b>Success Rate:</b> {caseAnalysis.successRate}%</div>
                  <div className="mb-2"><b>Primary Issues:</b> {Array.isArray(caseAnalysis.primaryIssues) ? caseAnalysis.primaryIssues.join(", ") : caseAnalysis.primaryIssues}</div>
                  <div className="mb-2"><b>Statutes:</b> {Array.isArray(caseAnalysis.statutes) ? caseAnalysis.statutes.join(", ") : caseAnalysis.statutes}</div>
                  <div className="mb-2"><b>Outcome Estimate:</b> {caseAnalysis.outcomeEstimate}</div>
                  <div className="mb-2"><b>Strengths:</b>
                    <ul className="list-disc ml-6">
                      {Array.isArray(caseAnalysis.strengths) ? caseAnalysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>) : <li>{caseAnalysis.strengths}</li>}
                    </ul>
                  </div>
                  <div className="mb-2"><b>Weaknesses:</b>
                    <ul className="list-disc ml-6">
                      {Array.isArray(caseAnalysis.weaknesses) ? caseAnalysis.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>) : <li>{caseAnalysis.weaknesses}</li>}
                    </ul>
                  </div>
                  <div className="mb-2"><b>Timeline:</b> {caseAnalysis.timeline}</div>
                  <div className="mb-2"><b>Action Plan:</b> {caseAnalysis.actionPlan}</div>
                  <div className="mb-2"><b>Risk Strategy:</b> {caseAnalysis.riskStrategy}</div>
                </div>
              ) : (
                <div className="text-gray-500 mb-4">
                  {analysisLoading ? "Generating case analysis..." : "Generate a document first, then click 'Generate AI Case Analysis' to see expert insights for your legal matter."}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center mt-8 pt-6 border-t border-gray-200">
            <Button className="bg-green-700 hover:bg-green-800 text-white" onClick={() => {}}>Message</Button>
          </div>
        </div>
      </div>
    </div>
  );

  // If split pane is enabled and we have chat history, show split layout
  if (showSplitPane && chatHistory.length > 0) {
    return (
      <StepLayout
        headerTitle="Step 1: Chat With Your Legal Assistant"
        headerSubtitle="Have a conversation with your AI legal assistant — we'll collect all the information needed for your legal document"
      >
        <div className="h-[calc(100vh-200px)] mt-8">
          <SplitPaneLayout
            leftContent={chatContent}
            rightContent={documentPreviewContent}
            leftTitle="Ask AI Legal"
            rightTitle="Document Preview"
          />
        </div>
      </StepLayout>
    );
  }

  // Original layout for single pane
  return (
    <StepLayout
      headerTitle="Step 1: Chat With Your Legal Assistant"
      headerSubtitle="Have a conversation with your AI legal assistant — we'll collect all the information needed for your legal document"
    >
      <div className="max-w-screen-sm mx-auto py-6 px-4 md:px-8">
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
              Clear Conversation
            </Button>
            <Button
              onClick={() => setShowSplitPane(!showSplitPane)}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              {showSplitPane ? "Hide Document Preview" : "Show Document Preview"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                fetchProjects();
                setOpen(true);
              }}
              size="sm"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
            >
              📁 My Projects
            </Button>
            {documentPreview && (
              <Button
                variant="outline"
                onClick={saveCurrentProject}
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              >
                💾 Save Project
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
          legalCategory="criminal"
        />

        {/* Generate Document Button - Only show if we have chat history */}
        {chatHistory.length >= 2 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
                onClick={() => {
                  console.log("🔘 Generate Document button clicked!");
                  console.log("📊 Chat history length:", chatHistory.length);
                  console.log("📊 Is processing:", isProcessing);
                  handleGenerateDocument();
                }}
                title={`Generate document from ${chatHistory.length} chat messages`}
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
              disabled={isProcessing}
            >
              {isProcessing ? (
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

      {/* My Projects Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>My Previous Projects</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            {projectsLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No saved projects yet.</div>
            ) : (
              projects.map((p) => (
                <div 
                  key={p.id} 
                  className="p-2 border-b hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => handleSelectProject(p)}
                >
                  <p className="font-medium">{p.title || "Untitled Document"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </ScrollArea>
          <DialogFooter>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setOpen(false);
                // Start a new project by clearing current state
                setSelectedProject(null);
                setDocumentPreview("");
                setChatHistory([]);
                toast.success("Started new project");
              }}
            >
              + New Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StepLayout>
  );
}

export default function AIAssistantStep1Page() {
  return (
    <SubscriptionGuard
      fallbackTitle=""
      fallbackMessage="Access to the AI legal assistant requires an active subscription or a one-time purchase. This interactive chat helps gather information for your legal case and generates professional legal documents."
    >
      <AIAssistantStep1Content />
    </SubscriptionGuard>
  );
}