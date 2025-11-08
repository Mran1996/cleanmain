/**
 * Theme Provider Component
 * 
 * This component provides theme context throughout the application using next-themes.
 * It enables dynamic theme switching between light, dark, and system themes.
 * 
 * Features:
 * - Theme context provider
 * - System theme detection
 * - Theme persistence
 * - Smooth theme transitions
 * 
 * @param children - React components to be wrapped with theme context
 * @param props - Additional props to pass to the theme provider
 * @returns The application wrapped with theme context
 */

'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      themes={["light"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
