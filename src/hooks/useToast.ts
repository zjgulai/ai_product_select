import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    success: (msg: string) => sonnerToast.success(msg),
    error: (msg: string) => sonnerToast.error(msg),
    info: (msg: string) => sonnerToast.info(msg),
    warning: (msg: string) => sonnerToast.warning(msg),
    loading: (msg: string) => sonnerToast.loading(msg),
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    custom: sonnerToast,
  };
}
