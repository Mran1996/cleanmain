"use client"

import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  variant?: "default" | "white" | "soft";
}

export function Logo({ className = "", showText = true, size = "md", variant = "default" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-24 w-24",
    xl: "h-40 w-40",
    xxl: "h-64 w-64"
  };

  const pixelSizes = {
    sm: 32,
    md: 48,
    lg: 96,
    xl: 160,
    xxl: 320
  } as const;

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0 ${
        variant === "soft" 
          ? "bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm" 
          : ""
      }`}>
        {/* <div className={`w-full h-full rounded-full flex items-center justify-center ${
          variant === "white" 
            ? "bg-white" 
            : "bg-gradient-to-br from-emerald-500 to-emerald-700"
        }`}>
        
          <div className="relative w-3/4 h-3/4">
            <div className={`absolute inset-0 border-2 rounded-full opacity-60 ${
              variant === "white" ? "border-emerald-600" : "border-white"
            }`}></div>
            <div className={`absolute inset-1 border-2 rounded-full opacity-80 ${
              variant === "white" ? "border-emerald-600" : "border-white"
            }`}></div>
            <div className={`absolute inset-2 border-2 rounded-full ${
              variant === "white" ? "border-emerald-600" : "border-white"
            }`}></div>
            <div className={`absolute inset-3 w-2 h-2 rounded-full ${
              variant === "white" ? "bg-emerald-600" : "bg-white"
            }`}></div>
          </div>
        </div> */}

        <Image src="/logo/logo.png" alt="Logo" width={pixelSizes[size]} height={pixelSizes[size]} />
      </div>
      
      {/* Logo Text */}
      {/* {showText && (
        <div className="flex flex-col">
          <span className={`font-bold ${textSizeClasses[size]} ${
            variant === "white" ? "text-white" : "text-emerald-700"
          }`}>
            Ask AI Legal<sup className="text-xs">™</sup>
          </span>
          <span className={`text-xs -mt-1 hidden sm:block ${
            variant === "white" ? "text-white/80" : "text-emerald-600"
          }`}>
            Where Law Meets Intelligence
          </span>
        </div>
      )} */}
    </Link>
  );
}
