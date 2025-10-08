/**
 * Root Layout Component
 * 
 * This is the main layout wrapper for the entire application. It provides:
 * - HTML document structure with proper meta tags
 * - Global CSS imports
 * - Responsive viewport configuration
 * - Client-side layout wrapper integration
 * 
 * @param children - React components to be rendered within the layout
 * @returns The complete HTML document structure
 */

import "./globals.css";
import { ReactNode } from "react";
import ClientLayout from './ClientLayout';

// Application metadata for SEO and browser configuration
export const metadata = {
  title: 'Ask AI Legal™ - Where Law Meets Intelligence',
  description: 'Empowering access to justice with AI. Your AI-powered legal assistant, helping you navigate legal matters with confidence.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="min-h-screen bg-white text-sm md:text-base">
      <head>
        {/* Ensure proper responsive behavior across all devices */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-white text-sm md:text-base">
        {/* ClientLayout provides context providers and client-side functionality */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
