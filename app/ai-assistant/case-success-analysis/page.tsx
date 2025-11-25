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
  const { t } = useTranslation()

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
            <h1 className="text-3xl font-bold text-emerald-600">{t('ai_case_success_analysis_title')}</h1>
            <p className="text-gray-600">{t('expert_insights_subtitle')}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <p className="text-gray-600 text-center">{t('no_analysis_data_message')}</p>
          </div>
          <div className="flex justify-between mt-8 mb-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-gray-300" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back_label')}
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
          <h1 className="text-3xl font-bold text-emerald-600">{t('ai_case_success_analysis_title')}</h1>
          <p className="text-gray-600">{t('expert_insights_subtitle')}</p>
        </div>

        {/* Analysis Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
          {/* Header Bar */}
          <div className="bg-[#C7F8C3] text-gray-900 py-4 px-6 rounded-t-lg">
            <h2 className="text-2xl font-bold">{t('ai_case_success_analysis_title')}</h2>
            <p className="text-gray-700">{t('expert_insights_legal_matter')}</p>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* 1. Case Snapshot */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                {t('case_snapshot_title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <span className="font-semibold block text-gray-600">{t('case_title_label')}</span>
                  <span className="font-bold text-lg">{analysis.title}</span>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <span className="font-semibold block text-gray-600">{t('jurisdiction_label')}</span>
                  <span className="font-bold text-lg">{analysis.jurisdiction}</span>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <span className="font-semibold block text-gray-600">{t('case_type_label')}</span>
                  <span className="font-bold text-lg">{analysis.caseType}</span>
                </div>
              </div>
            </div>

            {/* 2. Primary Issues & Relevant Statutes */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">{t('primary_legal_issues_title')}</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    {analysis.primaryIssues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">{t('relevant_statutes_title')}</h4>
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
                  <h4 className="text-lg font-bold text-emerald-700 mb-3">{t('case_strengths_title')}</h4>
                  <ul className="list-disc pl-5 space-y-2 text-emerald-800">
                    {analysis.strengths.map((strength: string, i: number) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-700 mb-3">{t('potential_weaknesses_title')}</h4>
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
                {t('success_probability_title')}
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">
                    {successRate}% — {
                      successRate >= 80 ? t('success_chance_strong') :
                      successRate >= 60 ? t('success_chance_good') :
                      successRate >= 30 ? t('success_chance_moderate') :
                      t('success_chance_low')
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
                {t('projections_title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-2">{t('estimated_outcome_title')}</h4>
                  <p className="text-gray-700">{analysis.outcomeEstimate}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-2">{t('expected_timeline_title')}</h4>
                  <p className="text-gray-700">{analysis.timeline}</p>
                </div>
              </div>
            </div>

            {/* 6. Action Plan */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                {t('action_plan_title')}
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">{analysis.actionPlan}</p>
              </div>
            </div>

            {/* 7. Risk Strategy */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                {t('risk_mitigation_strategy_title')}
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
            {t('back_to_document_label')}
          </Button>
          <div className="text-sm text-gray-500 italic">
            {t('analysis_disclaimer_label')}
          </div>
        </div>
      </div>
    </div>
  )
} 
import { useTranslation } from '@/utils/translations'
