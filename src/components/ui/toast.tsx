"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "info";

interface Toast {
  id: number;
  tone: Tone;
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}

const ToastContext = React.createContext<{
  toast: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}

const TONE = {
  success: { icon: CheckCircle2, chip: "text-status-completed" },
  warning: { icon: AlertTriangle, chip: "text-status-pending" },
  info: { icon: Info, chip: "text-status-checkedin" },
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(1);

  const dismiss = React.useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 end-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const T = TONE[t.tone];
          const Icon = T.icon;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-panel border border-line bg-surface p-3.5 shadow-overlay animate-[toast-in_0.28s_var(--ease-out-soft)_both]"
            >
              <Icon className={cn("mt-px size-4 shrink-0", T.chip)} />
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium text-ink">{t.title}</p>
                {t.detail ? (
                  <p className="mt-0.5 text-[0.75rem] leading-[1.15rem] text-ink-muted">
                    {t.detail}
                  </p>
                ) : null}
                {t.action ? (
                  <button
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-forest-600 hover:text-forest-800"
                  >
                    <Undo2 className="size-3.5" />
                    {t.action.label}
                  </button>
                ) : null}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="-m-1 rounded p-1 text-ink-faint transition-colors hover:text-ink-soft"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
