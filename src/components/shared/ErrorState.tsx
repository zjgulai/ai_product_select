import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = '加载失败，请稍后重试', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <AlertCircle size={32} className="text-lc-danger opacity-60" />
      <p className="text-sm text-lc-text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-medium px-3 h-7 rounded border transition-colors text-lc-primary border-lc-primary hover:bg-lc-primary hover:text-white"
        >
          <RefreshCw size={12} /> 重试
        </button>
      )}
    </div>
  );
}
