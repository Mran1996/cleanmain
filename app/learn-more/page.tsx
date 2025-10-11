/**
 * Learn More Page - Full Service Options
 * 
 * This page showcases the comprehensive full service offering that includes:
 * - Fully customized legal documents
 * - Tailored AI case analysis
 * - Hearing scripts and presentation guidance
 * - White-glove treatment and expert support
 * 
 * Designed to convert users from self-service to full service options.
 */

import { Navigation } from "@/components/navigation"
import { ServiceBanner } from "@/components/service-banner"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { CheckCircle, FileText, Brain, Mic, Shield, Clock, Users, Star, ArrowRight, Quote, Zap, MessageCircle, Award, Gavel, Target, Lock, DollarSign, Upload, Scale, FileCheck, BrainCircuit, MicVocal, Presentation, TrendingUp, ShieldCheck, Crown, Trophy, Sparkles, ArrowUpRight, Mail, RefreshCcw, FolderOpen } from "lucide-react"
import Link from "next/link"

const CORE_SERVICES = [
  {
    icon: Trophy,
    title: "Winning Legal Documents That Get Results",
    description: "Court-ready documents that have helped thousands win their cases. Every document is crafted to maximize your chances of success, using proven strategies from 1M+ successful filings."
  },
  {
    icon: Brain,
    title: "Deep Case Intelligence & Winning Strategy", 
    description: "Get insider knowledge of your case's true strengths and weaknesses. We reveal exactly how to overcome obstacles and position yourself for victory with data-driven legal strategy."
  },
  {
    icon: Crown,
    title: "Champion-Level Court Preparation",
    description: "Master-level scripts and arguments that make you sound like a seasoned attorney. Walk into court with the confidence of someone who's already won."
  }
] as const;

const WHITE_GLOVE_BENEFITS = [
  {
    icon: Shield,
    title: "AI Legal Review",
    description: "Documents reviewed by AI trained on 1M+ real cases — smarter, faster, and bias-free."
  },
  {
    icon: Zap,
    title: "Priority Case Handling",
    description: "Get expedited attention and faster document delivery with Full Service priority."
  },
  {
    icon: MessageCircle,
    title: "Direct Human Support",
    description: "Access our legal support team for help, updates, and real-time questions."
  },
  {
    icon: Award,
    title: "Satisfaction Guarantee",
    description: "If you're not confident after review, we revise until you are — no extra cost."
  }
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    icon: Scale,
    title: "AI + Legal Team Review",
    description: "Our legal AI (trained on 1 million+ filings and court wins) and support team review your case. We draft your documents, analyze strategy, and prepare your hearing materials."
  },
  {
    icon: FileCheck,
    title: "Receive, Review, and Win",
    description: "You'll get fully prepared legal documents, judge-ready scripts, and step-by-step instructions — customized for your case, jurisdiction, and deadline."
  }
] as const;

const WHY_CHOOSE_US = [
  {
    icon: Brain,
    title: "AI That Passed the Bar",
    description: "Built on technology that outperformed real lawyers on bar exams."
  },
  {
    icon: Clock,
    title: "No Waiting",
    description: "Get fast, reliable answers and documents — anytime."
  },
  {
    icon: DollarSign,
    title: "One Flat Fee",
    description: "Starting at just $497 — with everything included."
  },
  {
    icon: Target,
    title: "Smart + Strategic",
    description: "Understand the strengths and weaknesses of your case with expert-level insight."
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Your information stays confidential — always."
  }
] as const;


export default function LearnMorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <Navigation />
      
      {/* Service Banner */}
      <ServiceBanner />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto">
                <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                  Let us win your case and get the justice that you deserve
                </h1>
            <p className="text-xl md:text-2xl text-slate-200 leading-relaxed max-w-4xl mx-auto">
              Struggling with a legal case? We'll take it from here. Our Full Service Legal Support combines the power of AI that's passed the bar exam with real legal strategy to prepare court documents, analyze your case, and help you get the justice you deserve — fast, affordable, and with white-glove precision.
            </p>
          </div>
        </div>
      </section>

      {/* Full-Service Legal Document Preparation Section */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Full-Service Legal Document Preparation
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
            Let our professional AI legal team handle everything for you — from analysis to
            delivery. For <span className="font-semibold text-green-600">$479</span>, you'll receive
            a court-ready packet tailored to your case within <strong>7 business days</strong>.
          </p>

          <div className="text-left shadow-lg border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 p-6">
            <div className="flex items-center gap-2 text-xl font-semibold mb-6">
              <FolderOpen className="w-6 h-6 text-green-600" />
              What's Included
            </div>
            <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 mt-1 text-green-600" />
                <p>Drafting of one complete legal filing, motion, or response.</p>
              </div>
              <div className="flex items-start gap-3">
                <Scale className="w-6 h-6 mt-1 text-green-600" />
                <p>AI + human review for accuracy, clarity, and proper court formatting.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 mt-1 text-green-600" />
                <p>Legal research with state-specific case law (if applicable).</p>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCcw className="w-6 h-6 mt-1 text-green-600" />
                <p>Up to <strong className="text-green-700">3 free revisions</strong> within <strong>14</strong> days of delivery.</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 mt-1 text-green-600" />
                <p>Delivery by email (standard) or physical mail (<strong>$25</strong> add-on).</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-10 text-left">
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 p-6">
              <div className="flex items-center gap-2 text-xl font-semibold mb-4">
                <Clock className="w-7 h-7 text-green-600" />
                How It Works
              </div>
              <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
                <p>1️⃣ Submit your form — provide your name and case details. We'll gather everything else.</p>
                <p>2️⃣ Our legal team conducts comprehensive research and case analysis to build your strongest position.</p>
                <p>3️⃣ We draft your documents in your state's official format with precision and expertise.</p>
                <p>4️⃣ You review and request changes (up to <strong className="text-green-700">3 included</strong>).</p>
                <p>5️⃣ Receive your final packet by email or mail within <strong>7</strong> business days.</p>
              </div>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 p-6">
              <div className="flex items-center gap-2 text-xl font-semibold mb-4">
                <Scale className="w-7 h-7 text-green-600" />
                Limits & Guarantee
              </div>
              <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
                <ul className="list-disc ml-5 space-y-2">
                  <li>Maximum document length: <strong>150</strong> pages (including exhibits).</li>
                  <li>Applies to one active case or legal issue only.</li>
                  <li>Each additional case or filing: <strong className="text-green-600">$499 per order</strong>.</li>
                  <li>Extra revisions beyond 3: <strong className="text-green-600">$99 each</strong>.</li>
                </ul>
                <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                  <p className="text-neutral-700">
                    We're not attorneys — but our AI assistant has passed <strong className="text-green-700">bar-level benchmarks</strong> and
                    produces documents on par with law firms. You'll receive a professionally formatted,
                    court-ready document with a plain-language summary and next-step strategy tips.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-16 mb-8">
            <div className="border-t border-gray-200"></div>
          </div>

          <div className="text-center">
            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              Ready to get started?
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Take Back Control of Your Case Today
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Don't risk your future on guesswork. Let our legal AI and full service team fight for the best possible outcome — just like we've done for thousands before you.
            </p>
            <Link href="/pricing">
            <Button className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300">
              Get Started for $479
            </Button>
            </Link>
          </div>
        </div>
      </section>






      {/* Footer */}
      <Footer />
    </div>
  )
}
