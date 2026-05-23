import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TRPCProvider } from '@/providers/trpc'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

// 全局未捕获 Promise 错误监听
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    if (import.meta.env?.DEV) {
      console.error('[unhandledrejection]', e.reason);
    }
    // TODO: 上报到监控平台
  });

  window.addEventListener('error', (e) => {
    if (import.meta.env?.DEV) {
      console.error('[window error]', e.error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </ErrorBoundary>
  </StrictMode>,
)
