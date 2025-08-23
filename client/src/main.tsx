import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";

// ensure all fetch requests include credentials
const originalFetch = window.fetch;
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const finalInit: RequestInit = { ...init, credentials: "include" };
  return originalFetch(input, finalInit);
};

// Use the App component with our authentication system
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
