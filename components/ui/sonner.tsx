"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {

  return (
    <Sonner
      // Force a light look regardless of system theme
      theme={"light"}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Base toast appearance: white background, subtle border, softened text
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-800 group-[.toaster]:border group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-md group-[.toaster]:rounded-lg"
            +
            // Light variants for different toast types
            " data-[type=success]:bg-emerald-50 data-[type=success]:text-emerald-700 data-[type=success]:border-emerald-200"
            +
            " data-[type=error]:bg-rose-50 data-[type=error]:text-rose-700 data-[type=error]:border-rose-200"
            +
            " data-[type=info]:bg-blue-50 data-[type=info]:text-blue-700 data-[type=info]:border-blue-200"
            +
            " data-[type=warning]:bg-amber-50 data-[type=warning]:text-amber-700 data-[type=warning]:border-amber-200",
          description: "group-[.toast]:text-neutral-600",
          // Light action button: subtle green tint
          actionButton:
            "group-[.toast]:bg-emerald-50 group-[.toast]:text-emerald-700 group-[.toast]:border group-[.toast]:border-emerald-200 hover:bg-emerald-100",
          // Light cancel button: white with subtle gray border
          cancelButton:
            "group-[.toast]:bg-white group-[.toast]:text-neutral-700 group-[.toast]:border group-[.toast]:border-neutral-200 hover:bg-neutral-50",
        },
      }}
      // Ensure rich colors are disabled to keep light styling consistent
      richColors={false}
      {...props}
    />
  )
}

export { Toaster }
