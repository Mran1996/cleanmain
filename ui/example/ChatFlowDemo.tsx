/**
 * Example React component demonstrating the legal intake chat flow
 * Shows how to use the useIntake and useGenerateDocument hooks
 */

import React, { useState, useEffect } from 'react';
import { useIntake } from '../useIntake';
import { useGenerateDocument } from '../useGenerateDocument';

interface ChatFlowDemoProps {
  initialDocumentContext?: any;
  initialUserInfo?: any;
  initialCaseInfo?: any;
}

export function ChatFlowDemo({
  initialDocumentContext,
  initialUserInfo,
  initialCaseInfo,
}: ChatFlowDemoProps) {
  // State for the demo
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string; timestamp: Date }>>([]);
  const [showDocumentGeneration, setShowDocumentGeneration] = useState(false);

  // Use the intake hook
  const {
    currentState,
    currentPhase,
    currentQuestion,
    isComplete,
    canGenerateDocument,
    isLoading,
    error,
    startInterview,
    askQuestion,
    submitAnswer,
    completeInterview,
    resetInterview,
    responses,
    completionPercentage,
    interviewSummary,
    getNextQuestion,
    shouldShowCompletionMessage,
  } = useIntake({
    documentContext: initialDocumentContext,
    userInfo: initialUserInfo,
    caseInfo: initialCaseInfo,
    onComplete: (data) => {
      console.log('Interview completed:', data);
      setShowDocumentGeneration(true);
    },
    onError: (error) => {
      console.error('Interview error:', error);
    },
  });

  // Use the document generation hook
  const {
    isGenerating,
    isComplete: docComplete,
    error: docError,
    result,
    generateDocument,
    reset: resetDoc,
    downloadDocument,
    canGenerate,
  } = useGenerateDocument();

  // Initialize the interview
  useEffect(() => {
    startInterview();
  }, [startInterview]);

  // Auto-ask first question
  useEffect(() => {
    if (!currentQuestion && !isComplete && !isLoading) {
      const nextQuestion = getNextQuestion();
      if (nextQuestion) {
        askQuestion(nextQuestion, currentPhase);
      }
    }
  }, [currentQuestion, isComplete, isLoading, getNextQuestion, askQuestion, currentPhase]);

  // Handle user input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    // Add user message to chat history
    setChatHistory(prev => [...prev, {
      sender: 'user',
      text: userInput,
      timestamp: new Date(),
    }]);

    // Submit the answer
    await submitAnswer(userInput);
    setUserInput('');
  };

  // Handle document generation
  const handleGenerateDocument = async () => {
    if (!canGenerate) return;

    const options = {
      state: initialCaseInfo?.state || 'CA',
      county: initialCaseInfo?.county || 'Los Angeles',
      documentType: 'Motion to Dismiss',
      parties: {
        petitioner: initialUserInfo?.firstName + ' ' + initialUserInfo?.lastName || 'John Doe',
        respondent: initialCaseInfo?.opposingParty || 'Jane Smith',
      },
      caseNumber: initialCaseInfo?.caseNumber || 'CV-2024-001',
      facts: responses.map(r => r.answer),
      issues: ['Ineffective assistance of counsel', 'Prosecutorial misconduct'],
      includeCaseLaw: true,
      uploadedContext: initialDocumentContext,
      interviewData: responses,
      userInfo: initialUserInfo,
      caseInfo: initialCaseInfo,
    };

    await generateDocument(options);
  };

  // Phase names for display
  const phaseNames = {
    1: 'Basic Case Information',
    2: 'Factual Background',
    3: 'Legal Analysis',
    4: 'Goals and Strategy',
    5: 'Document Preparation',
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Legal Intake Chat Demo
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Phase {currentPhase}: {phaseNames[currentPhase as keyof typeof phaseNames]}</span>
          <span>Progress: {completionPercentage}%</span>
          <span>Questions: {responses.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="mb-6 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`mb-3 ${
              message.sender === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg max-w-xs ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border'
              }`}
            >
              {message.text}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}

        {/* Current Question */}
        {currentQuestion && (
          <div className="mb-3 text-left">
            <div className="inline-block p-3 rounded-lg max-w-xs bg-white text-gray-900 border">
              {currentQuestion}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Khristian (Attorney)
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-3 text-left">
            <div className="inline-block p-3 rounded-lg bg-gray-200 text-gray-600">
              Processing your response...
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {/* Completion Message */}
        {shouldShowCompletionMessage && (
          <div className="mb-3 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <h3 className="font-bold mb-2">Interview Complete!</h3>
            <p>You have completed the comprehensive legal intake interview.</p>
            <p className="mt-2 text-sm">
              Summary: {interviewSummary.substring(0, 200)}...
            </p>
          </div>
        )}
      </div>

      {/* Input Form */}
      {!isComplete && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your response here..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      )}

      {/* Document Generation Section */}
      {showDocumentGeneration && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-3">Document Generation</h3>
          
          {!docComplete && (
            <button
              onClick={handleGenerateDocument}
              disabled={!canGenerate || isGenerating}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Document...' : 'Generate Legal Document'}
            </button>
          )}

          {docError && (
            <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              Document Generation Error: {docError}
            </div>
          )}

          {result?.success && result.document && (
            <div className="mt-4">
              <div className="mb-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                Document generated successfully!
              </div>
              
              <div className="mb-3">
                <h4 className="font-semibold mb-2">Document Preview:</h4>
                <div className="max-h-40 overflow-y-auto p-3 bg-white border rounded text-sm">
                  {result.document.substring(0, 500)}...
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={downloadDocument}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Download Document
                </button>
                <button
                  onClick={resetDoc}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-2">
        <button
          onClick={resetInterview}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset Interview
        </button>
        
        {isComplete && (
          <button
            onClick={() => setShowDocumentGeneration(!showDocumentGeneration)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            {showDocumentGeneration ? 'Hide' : 'Show'} Document Generation
          </button>
        )}
      </div>

      {/* Debug Information */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-600">
          Debug Information
        </summary>
        <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
          <pre>{JSON.stringify({
            currentState,
            responses: responses.length,
            completionPercentage,
            isComplete,
            canGenerateDocument,
          }, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
}

export default ChatFlowDemo;
