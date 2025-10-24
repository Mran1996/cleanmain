"use client"

import type React from "react"
import { createContext, useContext, useState, type ReactNode } from "react"

// Define types for our context
export interface UploadedData {
  file: File | null
  extractedCaseNumber: string | null
  extractedCourt: string | null
  includeCaseLaw: boolean
  parsedText: string | null
  textPreview: string | null
  documentType: string | null
  documentSummary: string | null
  opposingParty: string | null
  filingDate: string | null
  extractedJudge: string | null
  extractedFinding: string | null
  extractedResult: string | null
  state: string | null
}

// New interface for multiple documents
export interface DocumentData {
  id: string
  filename: string
  parsedText: string
  extractedCaseNumber: string | null
  extractedCourt: string | null
  documentType: string | null
  documentSummary: string
  opposingParty: string | null
  filingDate: string | null
  extractedJudge: string | null
  state: string | null
  county: string | null
  extractedFinding: string | null
  extractedResult: string | null
}

export interface UserInfo {
  firstName: string
  lastName: string
  category: string
}

export interface CaseInfo {
  state: string
  legalIssue: string
  opposingParty: string
  desiredOutcome: string
  courtName: string | null
  caseNumber: string | null
  additionalInfo: string
  county: string | null
}

export interface DocumentSummary {
  fullText: string
  caseNumber: string | null
  courtName: string | null
  opposingParty: string | null
  summary: string
  documentType: string | null
  filingDate: string | null
  judge: string | null
  finding: string | null
  result: string | null
}

export interface ExtractedDocData {
  caseNumber: string | null;
  courtName: string | null;
  opposingParty: string | null;
  state: string | null;
}

// Add comprehensive step data interface
export interface StepData {
  // Step 1: User Information
  userInfo: UserInfo;
  
  // Step 2: Case Information
  caseInfo: CaseInfo;
  
  // Step 3: Document Upload & Case Law Toggle
  uploadedDocuments: DocumentData[];
  includeCaseLaw: boolean;
  
  // Chat Responses
  chatResponses: string[];
  chatHistory: Array<{ sender: string; text: string }>;
  
  // Additional metadata
  documentFacts: string;
  legalCategory: string;
}

// Add chatResponses to the context state
interface LegalAssistantContextType {
  userInfo: UserInfo
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>
  caseInfo: CaseInfo
  setCaseInfo: React.Dispatch<React.SetStateAction<CaseInfo>>
  uploadedData: UploadedData
  setUploadedData: React.Dispatch<React.SetStateAction<UploadedData>>
  uploadedFilesData: UploadedData[]
  setUploadedFilesData: React.Dispatch<React.SetStateAction<UploadedData[]>>
  documents: DocumentData[]
  setDocuments: React.Dispatch<React.SetStateAction<DocumentData[]>>
  chatResponses: string[]
  setChatResponses: React.Dispatch<React.SetStateAction<string[]>>
  chatHistory: Array<{ sender: string; text: string }>
  setChatHistory: React.Dispatch<React.SetStateAction<Array<{ sender: string; text: string }>>>
  isDataComplete: boolean
  currentIntakeQuestions: string[]
  setCurrentIntakeQuestions: React.Dispatch<React.SetStateAction<string[]>>
  extractedDocData: ExtractedDocData | null
  setExtractedDocData: React.Dispatch<React.SetStateAction<ExtractedDocData | null>>
  includeCaseLaw: boolean
  setIncludeCaseLaw: React.Dispatch<React.SetStateAction<boolean>>
  documentFacts: string
  setDocumentFacts: React.Dispatch<React.SetStateAction<string>>
  // Split-pane mode state
  isSplitPaneMode: boolean
  setIsSplitPaneMode: React.Dispatch<React.SetStateAction<boolean>>
  chatCollapsed: boolean
  setChatCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  documentContent: string
  setDocumentContent: React.Dispatch<React.SetStateAction<string>>
  documentId: string | null
  setDocumentId: React.Dispatch<React.SetStateAction<string | null>>
  // Helper function to get all step data
  getAllStepData: () => StepData
  // Function to reset all context data
  resetContext: () => void
  // Function to enter split-pane mode
  enterSplitPaneMode: (documentId: string, documentContent: string) => void
  // Function to exit split-pane mode
  exitSplitPaneMode: () => void
}

// Create context with default values
const LegalAssistantContext = createContext<LegalAssistantContextType | undefined>(undefined)

// Update the context provider to include chatResponses
export function LegalAssistantProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: "",
    lastName: "",
    category: "",
  })

  const [caseInfo, setCaseInfo] = useState<CaseInfo>({
    state: "",
    legalIssue: "",
    opposingParty: "",
    desiredOutcome: "",
    courtName: null,
    caseNumber: null,
    additionalInfo: "",
    county: null,
  })

  const [uploadedData, setUploadedData] = useState<UploadedData>({
    file: null,
    extractedCaseNumber: null,
    extractedCourt: null,
    includeCaseLaw: true,
    parsedText: null,
    textPreview: null,
    documentType: null,
    documentSummary: null,
    opposingParty: null,
    filingDate: null,
    extractedJudge: null,
    extractedFinding: null,
    extractedResult: null,
    state: null
  })

  const [uploadedFilesData, setUploadedFilesData] = useState<UploadedData[]>([])

  const [documents, setDocuments] = useState<DocumentData[]>([])

  const [chatResponses, setChatResponses] = useState<string[]>([])
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string }>>([])
  const [currentIntakeQuestions, setCurrentIntakeQuestions] = useState<string[]>([])

  const [extractedDocData, setExtractedDocData] = useState<ExtractedDocData | null>(null)
  
  const [includeCaseLaw, setIncludeCaseLaw] = useState<boolean>(true)
  const [documentFacts, setDocumentFacts] = useState<string>("")

  // Split-pane mode state
  const [isSplitPaneMode, setIsSplitPaneMode] = useState<boolean>(false)
  const [chatCollapsed, setChatCollapsed] = useState<boolean>(false)
  const [documentContent, setDocumentContent] = useState<string>("")
  const [documentId, setDocumentId] = useState<string | null>(null)

  // Calculate if we have the minimum required data
  const isDataComplete = Boolean(userInfo.firstName && userInfo.category && caseInfo.state)

  // Helper function to get all step data for document generation
  const getAllStepData = (): StepData => {
    return {
      userInfo,
      caseInfo,
      uploadedDocuments: documents,
      includeCaseLaw,
      chatResponses,
      chatHistory,
      documentFacts,
      legalCategory: userInfo.category
    }
  }

  // Function to enter split-pane mode
  const enterSplitPaneMode = (docId: string, docContent: string) => {
    setDocumentId(docId);
    setDocumentContent(docContent);
    setIsSplitPaneMode(true);
    setChatCollapsed(false);
  };

  // Function to exit split-pane mode
  const exitSplitPaneMode = () => {
    setIsSplitPaneMode(false);
    setChatCollapsed(false);
    setDocumentContent("");
    setDocumentId(null);
  };

  // Function to reset all context data
  const resetContext = () => {
    setUserInfo({
      firstName: "",
      lastName: "",
      category: "",
    })
    setCaseInfo({
      state: "",
      legalIssue: "",
      opposingParty: "",
      desiredOutcome: "",
      courtName: null,
      caseNumber: null,
      additionalInfo: "",
      county: null,
    })
    setUploadedData({
      file: null,
      extractedCaseNumber: null,
      extractedCourt: null,
      includeCaseLaw: true,
      parsedText: null,
      textPreview: null,
      documentType: null,
      documentSummary: null,
      opposingParty: null,
      filingDate: null,
      extractedJudge: null,
      extractedFinding: null,
      extractedResult: null,
      state: null,
    })
    setDocuments([])
    setChatResponses([])
    setChatHistory([])
    setIncludeCaseLaw(true)
    setDocumentFacts("")
    // Reset split-pane mode
    setIsSplitPaneMode(false)
    setChatCollapsed(false)
    setDocumentContent("")
    setDocumentId(null)
  }

  return (
    <LegalAssistantContext.Provider
      value={{
        userInfo,
        setUserInfo,
        caseInfo,
        setCaseInfo,
        uploadedData,
        setUploadedData,
        uploadedFilesData,
        setUploadedFilesData,
        documents,
        setDocuments,
        chatResponses,
        setChatResponses,
        chatHistory,
        setChatHistory,
        isDataComplete,
        currentIntakeQuestions,
        setCurrentIntakeQuestions,
        extractedDocData,
        setExtractedDocData,
        includeCaseLaw,
        setIncludeCaseLaw,
        documentFacts,
        setDocumentFacts,
        // Split-pane mode state
        isSplitPaneMode,
        setIsSplitPaneMode,
        chatCollapsed,
        setChatCollapsed,
        documentContent,
        setDocumentContent,
        documentId,
        setDocumentId,
        getAllStepData,
        resetContext,
        enterSplitPaneMode,
        exitSplitPaneMode,
      }}
    >
      {children}
    </LegalAssistantContext.Provider>
  )
}

// Custom hook to use the context
export function useLegalAssistant() {
  const context = useContext(LegalAssistantContext)
  if (context === undefined) {
    throw new Error("useLegalAssistant must be used within a LegalAssistantProvider")
  }
  return context
}
