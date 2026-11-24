"use client";

import { Check } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3200);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {msg ? (
          <div className="pointer-events-auto flex items-center gap-3 rounded-md bg-text px-4 py-3 text-sm font-medium text-surface shadow-lg">
            <Check className="size-4 text-success" aria-hidden />
            {msg}
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
