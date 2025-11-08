"use client";
import clsx from "clsx";

type StepKey = "chat" | "document";

export function ProgressSteps({ current }: { current: StepKey }) {
  const steps: { key: StepKey; label: string }[] = [
    { key: "chat", label: "Chat" },
    { key: "document", label: "Document" },
  ];
  const currentIndex = steps.findIndex(s => s.key === current);

  return (
    <div className="flex items-center justify-center gap-3">
      {steps.map((s, i) => {
        const active = i === currentIndex;
        const done = i < currentIndex;
        return (
          <div key={s.key} className="flex items-center">
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                active
                  ? "bg-white text-emerald-600 border border-emerald-300"
                  : done
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              )}
            >
              {i + 1}
            </div>
            <span className="ml-2 mr-3 text-sm">{s.label}</span>
            {i < steps.length - 1 && <div className="w-10 h-[2px] bg-neutral-300" />}
          </div>
        );
      })}
    </div>
  );
}
