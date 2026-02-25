"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastContextValue = (message: string) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? (() => {});
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const toast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
            aria-live="polite"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-zinc-700/80 bg-zinc-900/95 px-4 py-2.5 text-sm text-zinc-100 shadow-xl ring-1 ring-zinc-800/80 backdrop-blur-sm"
              >
                {t.message}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
