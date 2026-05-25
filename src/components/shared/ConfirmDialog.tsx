import { useState, useCallback, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ConfirmOptions;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, onOpenChange, options, onConfirm }: ConfirmDialogProps) {
  const { title, description, confirmText = '确认', cancelText = '取消', variant = 'danger' } = options;

  const confirmColor = {
    danger: LC.danger,
    warning: LC.warning,
    primary: LC.primary,
  }[variant];

  const confirmBg = {
    danger: LC.danger,
    warning: LC.warning,
    primary: LC.primary,
  }[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-4 text-base">
            <AlertTriangle size={18} style={{ color: confirmColor }} />
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm text-lc-text-secondary">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            className="h-8 px-4 text-xs font-medium rounded-md border border-lc-border text-lc-text-secondary hover:bg-lc-bg-warm"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-8 px-4 text-xs font-medium text-white rounded-md transition-all hover:brightness-110"
            style={{ background: confirmBg }}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '' });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleOpenChange = useCallback((value: boolean) => {
    setOpen(value);
    if (!value && resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  return { open, setOpen: handleOpenChange, options, confirm, handleConfirm };
}
