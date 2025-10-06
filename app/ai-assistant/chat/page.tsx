"use client"

import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import { ChatInterface } from "@/components/chat-interface"
import { Button } from "@/components/ui/button"
import { FileUp, Download, Save } from "lucide-react"
import { SubscriptionGuard } from "@/components/subscription-guard"

function ChatPageContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Your Legal Assistant</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <FileUp className="h-4 w-4" />
                  <span>Upload Document</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Save className="h-4 w-4" />
                  <span>Save Chat</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                  <h2 className="font-bold mb-2">Case Information</h2>
                  <div className="text-sm">
                    <p className="flex justify-between py-1 border-b">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">Housing</span>
                    </p>
                    <p className="flex justify-between py-1 border-b">
                      <span className="text-gray-600">Issue:</span>
                      <span className="font-medium">Eviction Notice</span>
                    </p>
                    <p className="flex justify-between py-1 border-b">
                      <span className="text-gray-600">State:</span>
                      <span className="font-medium">Washington</span>
                    </p>
                    <p className="flex justify-between py-1">
                      <span className="text-gray-600">Started:</span>
                      <span className="font-medium">Apr 28, 2025</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="font-bold mb-2">Uploaded Documents</h2>
                  <div className="text-sm">
                    <p className="text-gray-600 italic">No documents uploaded yet.</p>
                    <Button variant="outline" size="sm" className="w-full mt-2 text-teal-600 border-teal-600">
                      Upload Document
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <ChatInterface />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function ChatPage() {
  return (
    <SubscriptionGuard
      fallbackTitle="AI Legal Chat"
      fallbackMessage="Access to the AI legal chat requires an active subscription. This premium feature provides unlimited conversations with your AI legal assistant."
    >
      <ChatPageContent />
    </SubscriptionGuard>
  );
}
