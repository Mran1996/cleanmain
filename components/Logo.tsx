import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}

export function Logo({ className = "", showText = true, size = "md", variant = "default" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
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

        <Image src="/logo/logo.png" alt="Logo" width={100} height={100} />
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
