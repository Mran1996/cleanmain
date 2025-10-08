import { LanguageSwitcher } from "./LanguageSwitcher";
import { AuthButton } from "./AuthButton";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo size="md" />
          </div>
          
          <div className="flex items-center gap-4">
            <AuthButton />
            <LanguageSwitcher />
            <Link 
              href="/sign-up" 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 