"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { SessionTimeout } from "@/lib/session-timeout";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_MS = 5 * 60 * 1000;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, token, isInitialized } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const sessionTimeoutRef = useRef<SessionTimeout | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showWarning, setShowWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  useEffect(() => {
    if (hasRedirected.current) return;
    if (isInitialized && !isAuthenticated && !token) {
      hasRedirected.current = true;
      router.push("/login");
    }
  }, [isInitialized, isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated) {
      sessionTimeoutRef.current?.stop();
      sessionTimeoutRef.current = null;
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    const handleTimeout = () => {
      setShowWarning(false);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      router.push("/login");
    };

    const handleWarning = () => {
      setShowWarning(true);
      const seconds = Math.round(WARNING_MS / 1000);
      setCountdownSeconds(seconds);

      let remaining = seconds;
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
        } else {
          setCountdownSeconds(remaining);
        }
      }, 1000);
    };

    sessionTimeoutRef.current = new SessionTimeout({
      timeoutMs: TIMEOUT_MS,
      warningMs: WARNING_MS,
      onTimeout: handleTimeout,
      onWarning: handleWarning,
    });
    sessionTimeoutRef.current.start();

    return () => {
      sessionTimeoutRef.current?.stop();
      sessionTimeoutRef.current = null;
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isAuthenticated, router]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    setCountdownSeconds(0);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    sessionTimeoutRef.current?.reset();
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
            <Zap className="h-6 w-6 text-foreground fill-current" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading eBay Flow...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <ErrorBoundary>
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
          </main>
        </ErrorBoundary>
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-7 w-7 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Session Expiring Soon</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your session will expire in{" "}
                  <span className="font-medium text-foreground">
                    {Math.floor(countdownSeconds / 60)}:{String(countdownSeconds % 60).padStart(2, "0")}
                  </span>
                </p>
              </div>
              <button
                onClick={handleStayLoggedIn}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
