import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-stone-200 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-stone-900 mb-2">
              {this.props.fallbackTitle || 'Customizer Error Occurred'}
            </h2>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              We encountered an issue processing the image or rendering the studio preview. Please reload to reset your customizer session.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 px-5 bg-[#0E4A93] hover:bg-[#09356A] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Studio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
