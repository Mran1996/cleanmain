/**
 * Client Layout Component
 * 
 * This component provides client-side context providers that wrap the entire application.
 * It ensures that all child components have access to necessary global state and services.
 * 
 * Context providers included:
 * - SupabaseProvider: Database and authentication services
 * - LanguageProvider: Internationalization and language switching
 * 
 * @param children - React components to be wrapped with context providers
 * @returns The application wrapped with necessary context providers
 */

'use client'

import { ReactNode } from 'react'
import { LanguageProvider } from '../components/context/language-context'
import { SupabaseProvider } from '../components/SupabaseProvider'
import { AuthProvider } from '../components/auth-provider'
import { LegalAssistantProvider } from '../components/context/legal-assistant-context'
import { ThemeProvider } from '../components/theme-provider'
import { Toaster } from '../components/ui/sonner'

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <LanguageProvider>
          <LegalAssistantProvider>
            <ThemeProvider>
              {children}
              <Toaster position="top-right" className="mt-[220px]" />
            </ThemeProvider>
          </LegalAssistantProvider>
        </LanguageProvider>
      </AuthProvider>
    </SupabaseProvider>
  )
}