"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastState {
  message: string;
  isError: boolean;
  visible: boolean;
}

const ToastContext = createContext<((message: string, isError?: boolean) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: "", isError: false, visible: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, isError = false) => {
    setToast({ message, isError, visible: true });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 22,
          transform: "translateX(-50%)",
          background: toast.isError ? "var(--bad)" : "var(--ink)",
          color: toast.isError ? "#fff" : "var(--bg)",
          padding: "11px 18px",
          borderRadius: 999,
          fontSize: 13.5,
          fontWeight: 500,
          boxShadow: "var(--shadow)",
          zIndex: 999,
          maxWidth: "min(90vw, 420px)",
          textAlign: "center",
          opacity: toast.visible ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity .25s ease",
        }}
      >
        {toast.message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
