"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface AnalysisData {
  successRate: number;
  title: string;
  jurisdiction: string;
  caseType: string;
  primaryIssues: string[];
  statutes: string[];
  outcomeEstimate: string;
  strengths: string[];
  weaknesses: string[];
  timeline: string;
  actionPlan: string;
  riskStrategy: string;
}

export default function CaseSuccessAnalysisPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)

  useEffect(() => {
    const savedAnalysis = localStorage.getItem('caseAnalysis')
    if (savedAnalysis) {
      try {
        const parsedAnalysis = JSON.parse(savedAnalysis)
        setAnalysis(parsedAnalysis)
      } catch (error) {
        console.error('Error parsing analysis data:', error)
      }
    }
  }, [])

  if (!analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-emerald-600">Case Success Analysis</h1>
            <p className="text-gray-600">Expert insights tailored to your case</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <p className="text-gray-600 text-center">No analysis data found. Please generate an analysis first.</p>
          </div>
          <div className="flex justify-between mt-8 mb-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-gray-300" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const successRate = analysis.successRate ?? 0;
  const successLabel = successRate >= 80 ? "High" : successRate >= 60 ? "Moderate" : successRate >= 40 ? "Fair" : "Low";
  const successColor = successRate >= 80 ? "bg-emerald-500" : successRate >= 60 ? "bg-green-500" : successRate >= 40 ? "bg-yellow-500" : "bg-red-500";
// console.log(successRate, successLabel, successColor)
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-600">Case Success Analysis</h1>
          <p className="text-gray-600">Expert insights tailored to your case</p>
        </div>

        {/* Analysis Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
          {/* Header Bar */}
          <div className="bg-[#C7F8C3] text-gray-900 py-4 px-6 rounded-t-lg">
            <h2 className="text-2xl font-bold">AI-Powered Case Success Analysis</h2>
            <p className="text-gray-700">Expert insights for your legal matter.</p>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* 1. Case Snapshot */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                Case Snapshot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <span className="font-semibold block text-gray-600">Case Title</span>
                  <span className="font-bold text-lg">{analysis.title}</span>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <span className="font-semibold block text-gray-600">Jurisdiction</span>
                  <span className="font-bold text-lg">{analysis.jurisdiction}</span>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <span className="font-semibold block text-gray-600">Case Type</span>
                  <span className="font-bold text-lg">{analysis.caseType}</span>
                </div>
              </div>
            </div>

            {/* 2. Primary Issues & Relevant Statutes */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Primary Legal Issues</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    {analysis.primaryIssues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Relevant Statutes & Precedents</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    {analysis.statutes.map((statute: string, i: number) => (
                      <li key={i} className="text-blue-700 break-words hover:underline">
                        {statute}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. Strengths and Weaknesses */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold text-emerald-700 mb-3">Case Strengths</h4>
                  <ul className="list-disc pl-5 space-y-2 text-emerald-800">
                    {analysis.strengths.map((strength: string, i: number) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-700 mb-3">Potential Weaknesses</h4>
                  <ul className="list-disc pl-5 space-y-2 text-red-800">
                    {analysis.weaknesses.map((weakness: string, i: number) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Success Probability */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                Success Probability
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">
                    {successRate}% — {
                      successRate >= 80 ? "Strong Chance of Success" :
                      successRate >= 60 ? "Good Chance of Success" :
                      successRate >= 30 ? "Moderate Chance of Success" :
                      "Low Chance of Success"
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      successRate >= 80 ? "bg-emerald-600" :
                      successRate >= 60 ? "bg-green-500" :
                      successRate >= 30 ? "bg-yellow-500" :
                      "bg-red-500"
                    }`}
                    style={{ width: `${successRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 5. Estimated Outcome & Timeline */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                Projections
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-2">Estimated Outcome</h4>
                  <p className="text-gray-700">{analysis.outcomeEstimate}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-2">Expected Timeline</h4>
                  <p className="text-gray-700">{analysis.timeline}</p>
                </div>
              </div>
            </div>

            {/* 6. Action Plan */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                Action Plan
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">{analysis.actionPlan}</p>
              </div>
            </div>

            {/* 7. Risk Strategy */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                Risk Mitigation Strategy
              </h3>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-gray-700">{analysis.riskStrategy}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-between mt-8 mb-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-gray-300" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Document
          </Button>
          <div className="text-sm text-gray-500 italic">
            This AI analysis is for informational purposes only.
          </div>
        </div>
      </div>
    </div>
  )
} 