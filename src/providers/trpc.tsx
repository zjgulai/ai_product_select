import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, type TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";
import { callMock } from "@/lib/mock-router";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const mockLink: TRPCLink<AppRouter> = () =>
  ({ op }) =>
    observable((observer) => {
      try {
        const result = callMock(op.path, op.input as Record<string, unknown> | undefined);
        observer.next({ result: { type: "data", data: result } });
        observer.complete();
      } catch (err) {
        observer.error(err as Parameters<typeof observer.error>[0]);
      }
    });

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === "true";

const trpcClient = trpc.createClient({
  links: [
    USE_MOCK
      ? mockLink
      : httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch(input, init) {
            return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
          },
        }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
