import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type AdminErrorBoundaryProps = {
  children: ReactNode;
};

type AdminErrorBoundaryState = {
  error: Error | null;
};

export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  state: AdminErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin page error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Card className="max-w-2xl">
          <h1 className="page-title">Something went wrong</h1>
          <p className="page-description mt-2">
            This admin page could not be loaded. Try refreshing, or return to the dashboard.
          </p>
          <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{this.state.error.message}</p>
          <div className="mt-5 flex gap-3">
            <Button type="button" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button type="button" variant="outline" to="/admin/dashboard">
              Back to dashboard
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
