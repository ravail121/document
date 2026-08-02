"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Spinner } from "@/components/Spinner";

type LoadingContextValue = {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Loading…");

  const showLoading = useCallback((nextMessage = "Loading…") => {
    setMessage(nextMessage);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Clear the overlay once a route transition lands.
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const value = useMemo(
    () => ({ isLoading, message, showLoading, hideLoading }),
    [hideLoading, isLoading, message, showLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/20 backdrop-blur-[1px]"
          role="alert"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm">
            <Spinner className="h-5 w-5" label={message} />
            <span>{message}</span>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}
