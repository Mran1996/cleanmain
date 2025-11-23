import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full border border-emerald-500 rounded-md px-3 py-2 bg-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-muted-foreground transition-shadow",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
