import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "@/hooks/use-theme";
import ErrorBoundary from "@/components/ui/error-boundary";

// ensure all fetch requests include credentials
const originalFetch = window.fetch;
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const finalInit: RequestInit = { ...init, credentials: "include" };
  return originalFetch(input, finalInit);
};

const rootEl = document.getElementById("root");
if (!rootEl) {
  const div = document.createElement("pre");
  div.textContent = "FATAL: #root element not found";
  div.style.cssText = "color:#fff;background:#c00;padding:12px";
  document.body.appendChild(div);
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

