/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary —— React 错误边界
 *
 * 捕获子树渲染过程中的 JS 错误，避免整个应用崩溃。
 * 注意：不会捕获事件处理器、异步代码、SSR 错误。
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 上报到监控平台（Sentry / 自建上报）
    if (typeof window !== 'undefined' && (window as any).__reportError) {
      (window as any).__reportError(error, info);
    }
    // 开发环境打印详细信息
    if (import.meta.env?.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="animate-fadeIn flex items-center justify-center py-16 px-4">
          <div className="max-w-md w-full bg-white rounded-xl ring-1 ring-lc-border/60 shadow-lc p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-lc-danger/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-lc-danger" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-lc-text-primary">页面出现错误</h3>
                <p className="text-[11px] text-lc-text-muted">请尝试刷新或返回首页</p>
              </div>
            </div>
            <div className="rounded-lg bg-lc-bg-warm p-3 mb-4">
              <div className="text-xs font-mono text-lc-text-secondary break-all">
                {this.state.error.message || '未知错误'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={this.reset}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium text-white bg-lc-primary hover:brightness-110 transition-all"
              >
                <RefreshCw size={12} /> 重试
              </button>
              <button
                onClick={() => { window.location.hash = '/'; this.reset(); }}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium bg-lc-bg-warm text-lc-text-secondary hover:bg-lc-border-light transition-all"
              >
                <Home size={12} /> 返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
