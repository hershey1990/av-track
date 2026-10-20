import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster, toast } from "sonner";
import { describeDbError } from "@/lib/db-errors";
import { App } from "./App";
import "./index.css";

/**
 * Los errores de Supabase se silenciaban por completo, lo que hacía
 * imposible detectar tablas faltantes o problemas de permisos. Ahora se
 * avisa una sola vez por mensaje.
 */
const reportedErrors = new Set<string>();

export function reportError(error: unknown) {
  const message = describeDbError(error);
  if (reportedErrors.has(message)) return;
  reportedErrors.add(message);
  toast.error(message);
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => reportError(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => reportError(error),
  }),
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
