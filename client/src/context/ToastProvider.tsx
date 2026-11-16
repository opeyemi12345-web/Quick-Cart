// ToastProvider.tsx client/src/context/ToastProvider.tsx
// Keeps the list of toasts, removes each one after 5 seconds, and draws them on top of every page.

// STEP 32 (part 5): The toast provider

import { useEffect, useRef, useState, type ReactNode } from "react";
import Toaster from "../components/common/Toaster";
import { ToastContext, type Toast } from "./ToastContext";

const TOAST_SECONDS = 5;

const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = (id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const showToast = (toast: Omit<Toast, "id">) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    timers.current.set(
      id,
      setTimeout(() => dismissToast(id), TOAST_SECONDS * 1000),
    );
  };

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) clearTimeout(timer);
      timers.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
