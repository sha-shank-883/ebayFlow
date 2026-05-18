import React, {
  Component,
  type ErrorInfo,
  type ReactNode,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";

/**
 * Error details interface for the ErrorBoundary component.
 */
interface ErrorDetails {
  error: Error;
  errorInfo: ErrorInfo | null;
}

/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** Children components to wrap with error boundary */
  children: ReactNode;
  /** Optional custom fallback UI renderer */
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  /** Optional callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Context for passing error handler to child components.
 */
const ErrorHandlerContext = createContext<((error: Error) => void) | null>(null);

/**
 * Default Fallback UI component displayed when an error is caught.
 *
 * @param error - The caught error object
 * @param errorInfo - Additional React error information
 * @param resetError - Function to reset the error state
 */
function DefaultFallback({
  error,
  errorInfo,
  resetError,
}: ErrorDetails & { resetError: () => void }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleReportIssue = useCallback(() => {
    const subject = encodeURIComponent(`Error Report: ${error.message}`);
    const body = encodeURIComponent(
      `Error: ${error.message}\n\nStack Trace:\n${error.stack}\n\nComponent Stack:\n${errorInfo?.componentStack ?? "N/A"}`
    );
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
  }, [error, errorInfo]);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-800/50 bg-gray-900 p-6 text-center shadow-xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30">
        <svg
          className="h-6 w-6 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-gray-100">
        Something went wrong
      </h2>

      <p className="mb-4 max-w-md text-sm text-gray-400">
        {error.message || "An unexpected error occurred while rendering this component."}
      </p>

      <div className="mb-4 flex gap-3">
        <button
          type="button"
          onClick={resetError}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-gray-100 transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Try again
        </button>

        <button
          type="button"
          onClick={handleReportIssue}
          className="rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Report issue
        </button>
      </div>

      {error.stack && (
        <div className="w-full max-w-lg">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between rounded-md border border-gray-800 bg-gray-800/50 px-4 py-2 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800"
          >
            <span>Error details</span>
            <svg
              className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showDetails && (
            <div className="mt-2 max-h-64 overflow-auto rounded-md border border-gray-800 bg-gray-950 p-4">
              <pre className="whitespace-pre-wrap break-all text-xs text-red-300">
                {error.stack}
              </pre>
              {errorInfo?.componentStack && (
                <>
                  <hr className="my-3 border-gray-800" />
                  <p className="mb-1 text-xs font-medium text-gray-500">
                    Component Stack:
                  </p>
                  <pre className="whitespace-pre-wrap break-all text-xs text-gray-400">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ErrorBoundary class component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the crashed component tree.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Updates state to trigger fallback UI when an error is thrown during rendering.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  /**
   * Catches errors, logs them, and invokes optional onError callback.
   * Logs to console and Sentry (if configured).
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console
    console.error("[ErrorBoundary] Caught an error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    // Log to Sentry if configured
    if (typeof window !== "undefined" && "Sentry" in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Sentry = (window as any).Sentry;
        if (Sentry?.captureException) {
          Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          });
        }
      } catch {
        // Sentry not properly configured, ignore
      }
    }

    // Also check for @sentry/browser import
    if (typeof window !== "undefined") {
      try {
        // Use eval to prevent Webpack from statically analyzing this optional dependency
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Sentry = eval("require")("@sentry/browser") as any;
        if (Sentry?.captureException) {
          Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          });
        }
      } catch {
        // @sentry/browser not installed, ignore
      }
    }

    // Invoke custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with full error info
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  /**
   * Resets the error state to re-render children.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      // Use custom fallback if provided
      if (fallback !== undefined) {
        return typeof fallback === "function"
          ? fallback(this.state.error, this.resetError)
          : fallback;
      }

      // Use default fallback UI
      return (
        <DefaultFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return (
      <ErrorHandlerContext.Provider value={this.handleError}>
        {this.props.children}
      </ErrorHandlerContext.Provider>
    );
  }

  /**
   * Handles errors caught by child components via the context.
   */
  private handleError = (error: Error): void => {
    this.setState({
      hasError: true,
      error,
      errorInfo: null,
    });
  };
}

/**
 * Higher-order component that wraps a component with ErrorBoundary.
 *
 * @param WrappedComponent - The component to wrap with error boundary
 * @param options - Optional configuration for the error boundary
 * @returns A new component wrapped with ErrorBoundary
 *
 * @example
 * ```tsx
 * const MyComponentWithErrorBoundary = withErrorBoundary(MyComponent);
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">
): React.FC<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const WithErrorBoundary: React.FC<P> = (props: P) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

/**
 * Custom hook for catching and handling async errors (e.g., in useEffect, event handlers).
 * Throws the error to be caught by the nearest ErrorBoundary.
 *
 * @returns A function that accepts an Error and throws it to be caught by ErrorBoundary
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const handleError = useErrorHandler();
 *
 *   const fetchData = async () => {
 *     try {
 *       const data = await api.getData();
 *     } catch (error) {
 *       handleError(error);
 *     }
 *   };
 *
 *   return <button onClick={fetchData}>Load Data</button>;
 * }
 * ```
 */
export function useErrorHandler(): (error: Error) => void {
  const contextHandler = useContext(ErrorHandlerContext);

  return useCallback(
    (error: Error) => {
      if (contextHandler) {
        contextHandler(error);
      } else {
        // No ErrorBoundary in tree, throw to be caught by global handler
        throw error;
      }
    },
    [contextHandler]
  );
}
