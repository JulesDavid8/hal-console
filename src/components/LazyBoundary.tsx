import { Component, type ErrorInfo, type ReactNode } from 'react';

interface LazyBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface LazyBoundaryState {
  hasError: boolean;
}

export class LazyBoundary extends Component<LazyBoundaryProps, LazyBoundaryState> {
  public state: LazyBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): LazyBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Lazy module failed to render', { error, info });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="hal-panel p-6 space-y-3">
          <h3 className="text-lg font-medium">Module failed to load</h3>
          <p className="text-sm text-hal-muted">
            Something interrupted this screen. You can safely return to the homepage and continue.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex h-9 items-center rounded-[var(--hal-radius-md)] border border-hal-border px-3 text-sm text-hal-text hover:bg-hal-panel-soft"
          >
            Return to Homepage
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
