import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { captureException } from "@/lib/posthog";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
    captureException(error, {
      area: "react_error_boundary",
      component_stack: info.componentStack ?? ""
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-background text-foreground">
          <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
            <p className="mb-6 text-sm text-muted-foreground">{this.state.message}</p>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
