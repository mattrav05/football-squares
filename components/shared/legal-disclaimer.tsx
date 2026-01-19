import { cn } from "@/lib/utils";

interface LegalDisclaimerProps {
  variant?: "default" | "compact" | "prominent";
  className?: string;
}

export function LegalDisclaimer({
  variant = "default",
  className,
}: LegalDisclaimerProps) {
  if (variant === "compact") {
    return (
      <p className={cn("text-xs text-muted-foreground text-center", className)}>
        <strong>Disclaimer:</strong> This platform is a game management tool
        only. We do not facilitate gambling. Users are responsible for
        compliance with local laws.
      </p>
    );
  }

  if (variant === "prominent") {
    return (
      <div
        className={cn(
          "rounded-lg border-2 border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/20",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <div className="space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Important Disclaimer
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This platform is a game management tool only. We do not facilitate
              gambling. We do not collect or distribute any wager funds. Users
              are solely responsible for ensuring compliance with all applicable
              local, state, and federal laws regarding contests and gaming.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md bg-muted/50 p-3 text-sm text-muted-foreground",
        className
      )}
    >
      <p>
        <strong>Disclaimer:</strong> This platform is a game management tool
        only. We do not facilitate gambling. We do not collect or distribute any
        wager funds. Users are responsible for compliance with local laws.
      </p>
    </div>
  );
}
