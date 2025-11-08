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
import { createDocumentGenerationToast } from '@/lib/promise-toast';
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
  const [editingFolder, setEditingFolder] = useState<number | null>(null);
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  
  // Real prior chats loaded from database
  const [priorChats, setPriorChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  
  const colorOptions = [
    { name: "Blue", class: "bg-blue-500" },
    { name: "Green", class: "bg-green-500" },
    { name: "Purple", class: "bg-purple-500" },
    { name: "Orange", class: "bg-orange-500" },
    { name: "Red", class: "bg-red-500" },
    { name: "Pink", class: "bg-pink-500" },
    { name: "Indigo", class: "bg-indigo-500" },
    { name: "Teal", class: "bg-teal-500" },
    { name: "Yellow", class: "bg-yellow-500" },
    { name: "Gray", class: "bg-gray-500" }
  ];
  const [showSplitPane, setShowSplitPane] = useState(false);
  const [documentPreview, setDocumentPreview] = useState("");
  const [isStreamingDocument, setIsStreamingDocument] = useState(false);
  const [caseAnalysis, setCaseAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [downloadingAnalysis, setDownloadingAnalysis] = useState(false);
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
      if (saving) {
        toast.info('Save already in progress...');
        return;
      }
      setSaving(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to save documents');
        setSaving(false);
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save document');
      }

      const result = await response.json();
      const newId = result?.document?.id;
      if (newId) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentDocumentId', newId);
          }
        } catch {}
        setGeneratedDocId(newId);
      }
      toast.success('Document saved successfully!');
      console.log('Document saved:', result);
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
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

  const handleDownload = async () => {
    // Prefer server PDF if we have a document ID, otherwise download text
    const docId = generatedDocId || (typeof window !== 'undefined' ? localStorage.getItem('currentDocumentId') : null);
    const hasPreview = !!documentPreview.trim();

    if (!hasPreview && !docId) {
      toast.error('No document to download');
      return;
    }

    try {
      if (downloadingDoc) return;
      setDownloadingDoc(true);
      if (docId) {
        const res = await fetch(`/api/download/document/${docId}`);
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to download document');
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `legal-document-${docId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Document PDF downloaded');
      } else {
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
      }
    } catch (err) {
      console.error('Download document error:', err);
      toast.error('Failed to download document');
    } finally {
      setDownloadingDoc(false);
    }
  };

  // Generate AI Case Analysis for the current document (DB-first, no local content storage)
  const handleGenerateCaseAnalysis = async () => {
    // Determine document ID early and allow analysis if either preview or docId exists
    const docId = generatedDocId || (typeof window !== 'undefined' ? localStorage.getItem('currentDocumentId') : null);
    if (!documentPreview.trim() && !docId) {
      toast.error('Please generate a document first or ensure a saved document exists');
      return;
    }

    setAnalysisLoading(true);
    setCaseAnalysis(null);

    try {
      // Gather user and case context from localStorage
      const firstName = (typeof window !== 'undefined' ? localStorage.getItem('firstName') : '') || '';
      const lastName = (typeof window !== 'undefined' ? localStorage.getItem('lastName') : '') || '';
      const legalCategory = (typeof window !== 'undefined' ? localStorage.getItem('legalCategory') : '') || '';
      const legalIssue = (typeof window !== 'undefined' ? localStorage.getItem('legalIssue') : '') || '';
      const desiredOutcome = (typeof window !== 'undefined' ? localStorage.getItem('desiredOutcome') : '') || '';
      const additionalInfo = (typeof window !== 'undefined' ? localStorage.getItem('additionalInfo') : '') || '';
      const includeCaseLaw = (typeof window !== 'undefined' ? localStorage.getItem('includeCaseLaw') === 'true' : false);
      const uploadedJudge = typeof window !== 'undefined' ? localStorage.getItem('uploaded_judge') : null;
      const uploadedFilingDate = typeof window !== 'undefined' ? localStorage.getItem('uploaded_filing_date') : null;
      const defendantName = (typeof window !== 'undefined' ? localStorage.getItem('uploaded_opposing_party') : '') || (typeof window !== 'undefined' ? localStorage.getItem('opposingParty') : '') || '';
      const caseNumber = (typeof window !== 'undefined' ? localStorage.getItem('uploaded_case_number') : '') || (typeof window !== 'undefined' ? localStorage.getItem('caseNumber') : '') || '';
      const courtName = (typeof window !== 'undefined' ? localStorage.getItem('uploaded_court_name') : '') || (typeof window !== 'undefined' ? localStorage.getItem('courtName') : '') || '';
      const county = (typeof window !== 'undefined' ? localStorage.getItem('uploaded_county') : '') || (typeof window !== 'undefined' ? localStorage.getItem('county') : '') || '';
      const state = (typeof window !== 'undefined' ? localStorage.getItem('uploaded_state') : '') || (typeof window !== 'undefined' ? localStorage.getItem('state') : '') || '';
      const documentType = (typeof window !== 'undefined' ? localStorage.getItem('uploaded_document_type') : '') || (typeof window !== 'undefined' ? localStorage.getItem('documentType') : '') || '';

      // Get chat responses for additional context
      let chatResponses: string[] = [];
      try {
        const chatResponsesStr = typeof window !== 'undefined' ? localStorage.getItem('step1_chat_responses') || localStorage.getItem('chat_responses') : null;
        if (chatResponsesStr) chatResponses = JSON.parse(chatResponsesStr);
      } catch {}

      // Prepare document text for analysis: prefer preview, fallback to stored or API
      let documentTextForAnalysis = documentPreview;
      if (!documentTextForAnalysis || documentTextForAnalysis.trim().length === 0) {
        if (docId) {
          try {
            const response = await fetch(`/api/get-document/${docId}`);
            if (response.ok) {
              const data = await response.json();
              documentTextForAnalysis = data.content || '';
            }
          } catch (e) {
            console.error('Error loading document from API:', e);
          }
        }
      }

      if (!documentTextForAnalysis || documentTextForAnalysis.trim().length === 0) {
        toast.error('No document content available for analysis');
        setAnalysisLoading(false);
        return;
      }

      // Fetch user ID to allow server to store analysis for download
      let userId: string | null = null;
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch {}

      toast.info('Generating AI Case Analysis...');

      const analysisResponse = await fetch('/api/case-success-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: documentTextForAnalysis,
          documentId: docId,
          state,
          legalCategory,
          courtName,
          caseNumber,
          userInfo: { firstName, lastName, id: userId || undefined },
          caseInfo: {
            legalIssue,
            desiredOutcome,
            opposingParty: defendantName,
            additionalInfo,
            chatResponses,
            userFacts: (typeof window !== 'undefined' ? localStorage.getItem('userFacts') : '') || (typeof window !== 'undefined' ? localStorage.getItem('document_facts') : '') || '',
            documentType,
            county,
            judge: uploadedJudge || undefined,
            filingDate: uploadedFilingDate || undefined,
            includeCaseLaw
          },
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        throw new Error(errorText || 'Analysis generation failed');
      }

      // Some models may return text with JSON embedded; parse robustly
      const text = await analysisResponse.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { parsed = { error: 'Could not parse analysis response.' }; }
        } else {
          parsed = { error: 'Could not parse analysis response.' };
        }
      }

      setCaseAnalysis(parsed);
      toast.success('AI Case Analysis generated successfully!');
    } catch (error) {
      console.error('Case analysis error:', error);
      toast.error(`Failed to generate case analysis${error instanceof Error && error.message ? `: ${error.message}` : ''}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Download AI Case Analysis PDF for the current document
  const handleDownloadCaseAnalysis = async () => {
    try {
      const docId = generatedDocId || (typeof window !== 'undefined' ? localStorage.getItem('currentDocumentId') : null);
      if (!docId) {
        toast.error('No document ID found. Generate a document first.');
        return;
      }
      if (downloadingAnalysis) return;
      setDownloadingAnalysis(true);
      const res = await fetch(`/api/download/document/${docId}?type=analysis`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to download analysis');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case-analysis-${docId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Case analysis PDF downloaded');
    } catch (error) {
      console.error('Download analysis error:', error);
      toast.error(`Failed to download analysis${error instanceof Error && error.message ? `: ${error.message}` : ''}`);
    } finally {
      setDownloadingAnalysis(false);
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
          
          // Check if first message contains old "attorney-client" text and update it
          if (parsedHistory.length > 0 && parsedHistory[0].sender === 'assistant' && 
              parsedHistory[0].text && (parsedHistory[0].text.includes('attorney-client interview') || parsedHistory[0].text.includes('attorney-client'))) {
            const newInitialMessage = `Hi there! I'm Khristian, your AI legal assistant, and I'm here to help.\n\nI'm going to conduct a **comprehensive interview** with you. This thorough process involves **15-25 detailed questions** across 5 phases to gather all the information needed for your legal document.\n\nThis interview will cover:\n• Basic case information\n• Detailed factual background\n• Legal analysis and issues\n• Your goals and strategy\n• Document preparation requirements\n\nOnce we complete this interview, we'll proceed to Step 2 where I'll generate your comprehensive, **court-ready legal document** based on all the information we've gathered.\n\nYou can **upload documents anytime** during our conversation to help me better understand your case.\n\nLet's start with the basics. What type of legal matter are we dealing with today?`;
            
            // Replace the first message with the updated version
            parsedHistory[0] = { sender: "assistant", text: newInitialMessage };
            setChatHistory(parsedHistory);
            // Update localStorage with the corrected message
            localStorage.setItem('step1_chat_history', JSON.stringify(parsedHistory));
            return;
          }
          
          setChatHistory(parsedHistory);
          return;
        } catch (error) {
          console.error('Error parsing saved chat history:', error);
        }
      }
      
      // Load chat conversations from database
      loadChatConversations();
      
      // Initialize with greeting if no saved history
      if (!isProcessing) {
        const firstName = localStorage.getItem("firstName") || "there";
        const hasDocument = getUploadedParsedText().trim().length > 0;
        
        let initialMessage = `Hi there! I'm Khristian, your AI legal assistant, and I'm here to help.\n\nI'm going to conduct a **comprehensive attorney-client interview** with you. This thorough process involves **15-25 detailed questions** across 5 phases to gather all the information needed for your legal document.\n\nThis interview will cover:\n• Basic case information\n• Detailed factual background\n• Legal analysis and issues\n• Your goals and strategy\n• Document preparation requirements\n\nOnce we complete this interview, I'll generate your comprehensive, **court-ready legal document** and show it in the **preview panel on the right**.\n\nYou can **upload documents anytime** during our conversation to help me better understand your case.\n\nLet's start with the basics. What type of legal matter are we dealing with today?`;
        
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
      
      const systemPrompt = `You are Khristian, a legal assistant conducting a comprehensive interview. ${documentInfo}

🚨 CRITICAL RULES - MUST FOLLOW:
- Ask ONLY ONE question at a time - NEVER ask multiple questions in a single response
- NEVER use bullet points, numbered lists, or grouped questions
- NEVER ask "What about X? What about Y? What about Z?" in one response
- Wait for the user's complete answer before asking the next question
- Be natural and conversational like a real attorney
- Reference uploaded documents when relevant
- Write responses in plain, natural text without special formatting
- Do NOT group questions together or ask follow-up questions until you get an answer
- Focus on one specific piece of information at a time
- Each response should contain exactly ONE question, nothing more

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

  const handleEditFolder = (folderId: number) => {
    const folder = priorChats.find(f => f.id === folderId);
    if (folder) {
      setEditingFolder(folderId);
      setFolderName(folder.name);
      setSelectedColor(folder.color);
    }
  };

  const handleSaveFolder = () => {
    if (editingFolder && folderName.trim()) {
      setPriorChats(prev => prev.map(folder => 
        folder.id === editingFolder 
          ? { ...folder, name: folderName.trim(), color: selectedColor || folder.color }
          : folder
      ));
      setEditingFolder(null);
      setFolderName("");
      setSelectedColor("");
    }
  };

  const handleCancelEdit = () => {
    setEditingFolder(null);
    setFolderName("");
    setSelectedColor("");
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const response = await fetch(`/api/chat-conversations?id=${folderId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPriorChats(prev => prev.filter(folder => folder.id !== folderId));
        toast.success('Conversation deleted successfully');
      } else {
        throw new Error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleNewChat = () => {
    // Clear current conversation
    setChatHistory([]);
    setDocumentPreview("");
    setCaseAnalysis(null);
    setSuggestedResponses([]);
    setIsWaiting(false);
    
    // Add a new chat to the sidebar
    const newChat = {
      id: Date.now(), // Simple ID generation
      name: `New Chat ${priorChats.length + 1}`,
      color: "bg-emerald-500", // Default green color
      timestamp: "Just now"
    };
    
    setPriorChats(prev => [newChat, ...prev]);
    
    // Show success message
    toast.success("New chat started!");
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat-conversations?id=${chatId}`);
      if (!response.ok) throw new Error('Failed to load chat');
      
      const { conversation } = await response.json();
      const messages = JSON.parse(conversation.messages);
      
      setChatHistory(messages);
      toast.success(`Loaded conversation: ${conversation.title}`);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Failed to load conversation');
    }
  };

  // Load chat conversations from database
  const loadChatConversations = async () => {
    setLoadingChats(true);
    try {
      const response = await fetch('/api/chat-conversations');
      
      if (!response.ok) {
        // Handle authentication errors gracefully
        if (response.status === 401) {
          console.log('Authentication required for chat conversations');
          setPriorChats([]);
          return;
        }
        throw new Error('Failed to load conversations');
      }
      
      const { conversations } = await response.json();
      
      // Transform conversations to match the UI format
      const transformedChats = conversations.map((conv: any) => ({
        id: conv.id,
        name: conv.title,
        color: getColorForCategory(conv.legal_category),
        timestamp: formatTimestamp(conv.created_at),
        legal_category: conv.legal_category
      }));
      
      setPriorChats(transformedChats);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Don't show error to user, just leave priorChats empty
      setPriorChats([]);
    } finally {
      setLoadingChats(false);
    }
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
        // Reload conversations to show the new one
        loadChatConversations();
      } else if (response.status === 401) {
        // Handle authentication error silently
        console.log('Authentication required for auto-saving chat');
      }
    } catch (error) {
      console.error('Error auto-saving chat:', error);
    }
  };

  // Helper functions
  const getColorForCategory = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'criminal': 'bg-blue-500',
      'civil': 'bg-green-500',
      'employment': 'bg-purple-500',
      'family': 'bg-orange-500',
      'personal_injury': 'bg-red-500',
      'general': 'bg-gray-500'
    };
    return colorMap[category] || 'bg-gray-500';
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const chatTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - chatTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const generateChatTitle = (messages: any[]) => {
    const userMessages = messages.filter(msg => msg.sender === 'user');
    if (userMessages.length === 0) return 'New Chat';
    
    const firstMessage = userMessages[0].text;
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
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
    setShowSplitPane(true)
    console.log("🚀 handleGenerateDocument called!");
    console.log("📊 Function execution started");
    
    if (typeof window === 'undefined') {
      console.log("❌ Browser environment not available");
      toast.error("Browser environment required");
      return;
    }
    
    console.log("🚀 Generate Document button clicked!");
    console.log("📊 Current chat history from context:", chatHistory);
    
    // Show immediate visual feedback
    toast.info("Starting document generation...");
    setDocumentPreview(""); // Start with empty document - it will populate as it generates
    setIsProcessing(true);
    
    // Ensure chat waiting state cannot block generation
    setIsWaiting(false);
    
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
    
    // Set processing state
    setIsProcessing(true);
    
    // Declare timeout/interval variables in outer scope for cleanup
    let timeoutId: NodeJS.Timeout | null = null;
    let progressInterval: NodeJS.Timeout | null = null;
    let typewriterInterval: NodeJS.Timeout | null = null;
    
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
        caseNumber: localStorage.getItem("caseNumber") || null,
        county: localStorage.getItem("county") || null,
        state: localStorage.getItem("state") || "California",
        opposingParty: localStorage.getItem("opposingParty") || null,
        courtName: localStorage.getItem("courtName") || null,
        includeCaseLaw: localStorage.getItem("includeCaseLaw") === "true",
        shortDraft: true,
        chatHistory: finalChatHistory.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text || ""
        })).filter(msg => msg.content && msg.content.trim().length > 0) // Filter out empty messages
      };

      console.log("📤 Ready to send to API:", {
        chatHistoryCount: genState.chatHistory.length,
        hasState: !!genState.state,
        hasUserId: !!genState.userId
      });

      console.log("📊 Chat history validation passed:", {
        messageCount: finalChatHistory.length,
        messages: finalChatHistory.map(msg => ({ sender: msg.sender, textLength: msg.text.length }))
      });

      console.log("📤 Sending request to API with data:", genState);
      console.log("📊 Chat history details:", {
        length: finalChatHistory.length,
        messages: finalChatHistory.map(msg => ({ sender: msg.sender, text: msg.text.substring(0, 100) + '...' }))
      });

      // Create the API call promise
      const documentGenerationPromise = (async () => {
        // Add timeout for large documents
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("⏰ API call timed out after 5 minutes");
          controller.abort();
        }, 300000); // 5 minutes timeout for full document generation

        console.log("🚀 Making API call to /api/generate-document (full processing)");
        
        // Use the main document generation API that processes chat history
        const response = await fetch("/api/generate-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(genState),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log("📥 API response received:", response.status);
        console.log("📥 API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          let userMessage = 'Document generation failed';
          if (response.status === 401) {
            userMessage = 'Please sign in to generate documents';
          } else {
            try {
              const parsed = JSON.parse(errorText);
              if (parsed?.error && typeof parsed.error === 'string') {
                userMessage = parsed.error;
              } else if (typeof parsed === 'string') {
                userMessage = parsed;
              }
            } catch {
              if (typeof errorText === 'string' && errorText.trim().length > 0) {
                userMessage = errorText;
              }
            }
          }
          const err = new Error(userMessage);
          // Attach status for downstream handling without exposing raw JSON
          (err as any).status = response.status;
          throw err;
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
          // Store for later analysis and download
          try {
            if (typeof window !== 'undefined') {
              if (docId) {
                localStorage.setItem('currentDocumentId', docId);
                setGeneratedDocId(docId);
              }
              // Do not store full document content locally; rely on DB
            }
          } catch {}
          
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
          
          // Show preview in split-pane on the right after generation
          console.log("🔄 Document generated. Showing preview in split-pane right panel...");
          setShowSplitPane(true);
          toast.success("Document generated successfully! Preview is now visible on the right.");
          
          return { docId, document };
        } else {
          console.error("❌ No document content in API response");
          throw new Error("Generation incomplete");
        }
      })();

      // Use promise-based toast with motivational messages
      const result = await createDocumentGenerationToast(documentGenerationPromise);
      
      return result;
      
    } catch (error) {
      console.error("❌ Error generating document:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      // Handle specific error types with user-friendly messages (no raw JSON)
      if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401 || error.message.toLowerCase().includes('sign in')) {
          toast.error('Authentication required', { description: 'Please sign in to generate documents' });
        } else if (error.name === 'AbortError') {
          toast.error('Generation timed out', { description: 'Complex documents take time. Please try again' });
        } else if (error.message.includes('fetch')) {
          toast.error('Network error', { description: 'Please check your connection' });
        } else {
          toast.error('Generation failed', { description: error.message });
        }
      } else {
        toast.error('Something went wrong', { description: 'Please try again' });
      }
    } finally {
      // Clean up any remaining intervals
      if (progressInterval) clearInterval(progressInterval);
      if (typewriterInterval) clearInterval(typewriterInterval);
      // Note: Don't set isProcessing to false here if typewriter is still running
      // It will be set to false when typewriter completes
      if (!typewriterInterval) {
        setIsProcessing(false);
      }
      console.log("🏁 Document generation process finished");
    }
  };



  // Chat content for left pane
  const chatContent = (
    <div className="min-h-full flex flex-col">
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
      <div className="overflow-y-auto px-6 py-0">
        
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
          onGenerateDocument={handleGenerateDocument}
        />

      </div>
    </div>
  );

  // Document preview content for right pane - matches Step 2 layout
  const documentPreviewContent = (
    <div className="min-h-full flex flex-col">
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
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button 
            onClick={handleEmail}
            disabled={!documentPreview.trim()} 
            size="sm"
            variant="outline"
            className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={!documentPreview.trim()} 
            size="sm"
            variant="outline"
            className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
              value={documentPreview || ""}
              onChange={e => setDocumentPreview(e.target.value)}
              disabled={isProcessing}
              placeholder={
                documentPreview ? "Your generated legal document appears above..." :
                "Your generated legal document will appear here as it's being generated..."
              }
            />
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded border">
                <div><strong>Debug Info:</strong></div>
                <div>documentPreview length: {documentPreview?.length || 0}</div>
                <div>isProcessing: {String(isProcessing)}</div>
                <div>First 100 chars: "{documentPreview?.substring(0, 100)}"</div>
                <div>Last 50 chars: "{documentPreview?.substring(Math.max(0, (documentPreview?.length || 0) - 50))}"</div>
              </div>
            )}
          </div>
          {documentPreview && !isProcessing && (
            <div className="flex items-center mt-2 text-green-600">
              <FileText className="mr-2 h-4 w-4" />
              Document generated successfully! You can edit it above.
            </div>
          )}

          {/* AI Case Success Analysis Section */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 mb-6 mt-2">
            <div className="text-xl font-bold text-green-800 mb-2">AI-Powered Case Success Analysis</div>
            
          {/* Generate AI Case Analysis Buttons */}
          <div className="w-full max-w-5xl mx-auto flex flex-row flex-wrap gap-2 mb-4 justify-center overflow-x-auto pb-2">
              <Button 
                onClick={handleGenerateCaseAnalysis}
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300" 
                disabled={
                  isProcessing || analysisLoading || !(
                    documentPreview.trim() || (generatedDocId || (typeof window !== 'undefined' && localStorage.getItem('currentDocumentId')))
                  )
                }
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
                onClick={handleDownloadCaseAnalysis}
                variant="outline"
                className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300" 
                disabled={isProcessing || !(generatedDocId || (typeof window !== 'undefined' && localStorage.getItem('currentDocumentId')))}
              >
                Download AI Case Analysis
              </Button>
              <Button 
                variant="outline"
                className="text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300" 
                onClick={() => {}}
              >
                Message
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

        </div>
      </div>
    </div>
  );

  // If split pane is enabled and we have chat history, show split layout
  if (showSplitPane && chatHistory.length > 0) {
    return (
      <StepLayout
        headerTitle="Follow the steps with your AI Legal Assistant to gather the information needed and generate your legal document."
        headerSubtitle=""
      >
        <div className="min-h-[calc(100vh-200px)] mt-8">
          <SplitPaneLayout
            leftContent={chatContent}
            rightContent={documentPreviewContent}
            leftTitle="Ask AI Legal"
            rightTitle="Document Preview"
          />
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

  // Original layout for single pane with sidebar
  return (
    <StepLayout
      headerTitle="Follow the steps with your AI Legal Assistant to gather the information needed and generate your legal document."
      headerSubtitle=""
    >
      <div className="max-w-7xl mx-auto py-6 px-4 md:px-8">
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar for Prior Chats - same level as chat */}
          <div className="w-80 bg-white border border-gray-200 rounded-xl p-4 flex flex-col h-full">
            {/* Header with Prior Chats title and New Chat button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Prior Chats</h3>
              <Button 
                onClick={handleNewChat}
                variant="outline"
                size="sm"
                className="flex items-center justify-center text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                title="Start a new chat"
              >
                <span className="mr-1.5">+</span>
                New Chat
              </Button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {loadingChats ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  Loading conversations...
                </div>
              ) : priorChats.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {/* Conversations will appear here as you chat */}
                </div>
              ) : (
                priorChats.map((chat) => (
                <div key={chat.id} className="group flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200">
                  {editingFolder === chat.id ? (
                    <div className="w-full">
                      <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-2 text-sm"
                        placeholder="Folder name"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1 mb-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setSelectedColor(color.class)}
                            className={`w-6 h-6 rounded ${color.class} ${
                              selectedColor === color.class ? 'ring-2 ring-gray-400' : ''
                            }`}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveFolder}
                          className="px-3 py-1 text-emerald-600 border border-emerald-200 text-xs rounded hover:bg-emerald-50 hover:border-emerald-300"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-gray-600 border border-gray-300 text-xs rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div 
                        className="flex-1 flex items-center cursor-pointer"
                        onClick={() => handleSelectChat(chat.id)}
                      >
                        <div className={`w-8 h-8 ${chat.color} rounded-lg flex items-center justify-center mr-3`}>
                          <span className="text-white text-sm font-bold">📁</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{chat.name}</p>
                          <p className="text-xs text-gray-500">{chat.timestamp}</p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditFolder(chat.id);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-500"
                          title="Edit folder"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(chat.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Delete folder"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
                ))
              )}
            </div>
          </div>
          
          {/* Main Chat Interface - use single card style from EnhancedChatInterface */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 md:p-6 flex flex-col h-full">
        
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
          onGenerateDocument={handleGenerateDocument}
        />

          </div>
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
                className="px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition"
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
              variant="outline"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
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