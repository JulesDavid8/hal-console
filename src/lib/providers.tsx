import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { type ReactNode } from 'react';

/**
 * H.A.L. Console Root Providers (Foundation 2026)
 * 
 * This component centralizes all top-level providers.
 * Adding new providers here keeps the rest of the app clean and evolvable.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds - good default for analytical data
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-center" 
        richColors 
        closeButton
        className="hal-mono"
      />
    </QueryClientProvider>
  );
}
