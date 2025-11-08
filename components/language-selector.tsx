/**
 * Language Selector Component
 * 
 * This component provides a dropdown interface for language selection.
 * It allows users to switch between different supported languages
 * and updates the application's language context accordingly.
 * 
 * Features:
 * - Dropdown interface with flag icons
 * - Click outside to close functionality
 * - Keyboard accessibility support
 * - Integration with language context
 * - Responsive design
 */

"use client"

import { useLanguage } from "@/components/context/language-context"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import flags from "@/components/flags"

// Language interface for type safety
interface Language {
  value: string;
  label: string;
}

export function LanguageSelector() {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const { currentLanguage, changeLanguage, languages } = useLanguage()
  const dropdownRef = useRef<HTMLDivElement>(null)

  /**
   * Toggle the dropdown open/closed state
   */
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  /**
   * Handle language selection
   * @param language - The selected language object
   */
  const handleLanguageSelect = (language: Language) => {
    changeLanguage(language)
    setIsDropdownOpen(false)
  }

  /**
   * Handle click outside dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Don't render if no current language is available
  if (!currentLanguage?.label) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language selector button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between gap-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span className="flex items-center gap-2">
          <span 
            className="flex items-center" 
            style={{ fontSize: "1.2em" }} 
            aria-hidden="true"
          >
            {flags[currentLanguage.value] || "🌐"}
          </span>
          {currentLanguage.label.split(" ")[0]}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {/* Language dropdown menu */}
      {isDropdownOpen && (
        <div 
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="listbox"
          aria-label="Available languages"
        >
          {languages.map((language) => {
            const isSelected = currentLanguage.value === language.value;
            
            return (
              <button
                key={language.value}
                className={`${
                  isSelected 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-700"
                } flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full text-left`}
                onClick={() => handleLanguageSelect(language)}
                role="option"
                aria-selected={isSelected}
                type="button"
              >
                <span 
                  className="flex items-center" 
                  style={{ fontSize: "1.2em" }} 
                  aria-hidden="true"
                >
                  {flags[language.value] || "🌐"}
                </span>
                {language.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  )
}
