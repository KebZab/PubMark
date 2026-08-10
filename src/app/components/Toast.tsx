import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

const TOAST_EVENT = "pubmark_toast";

export function showToast(message: string, type: ToastType = "success") {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const { message, type } = (e as CustomEvent).detail as { message: string; type: ToastType };
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    }
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [remove]);

  // On mount, consume any pending toast written to localStorage by Login/Register
  useEffect(() => {
    const raw = localStorage.getItem("pubmark_pending_toast");
    if (raw) {
      localStorage.removeItem("pubmark_pending_toast");
      try {
        const { message, type } = JSON.parse(raw) as { message: string; type: ToastType };
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => remove(id), 4000);
      } catch { /* ignore */ }
    }
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";
        const Icon = isSuccess ? CheckCircle : isError ? XCircle : AlertTriangle;
        const bg = isSuccess
          ? "bg-teal-600"
          : isError
          ? "bg-red-600"
          : "bg-amber-500";

        return (
          <div
            key={t.id}
            className={`${bg} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto min-w-[220px] max-w-xs`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
