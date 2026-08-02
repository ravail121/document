"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Link from "next/link";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Client render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-900">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-600">
            An unexpected error occurred. You can return to the dashboard and
            try again.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-white"
              onClick={() => this.setState({ hasError: false })}
            >
              Back to dashboard
            </Link>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
