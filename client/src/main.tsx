import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ensure all fetch requests include credentials
const originalFetch = window.fetch;
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const finalInit: RequestInit = { ...init, credentials: "include" };
  return originalFetch(input, finalInit);
};

// Use the App component with our authentication system
createRoot(document.getElementById("root")!).render(
  <App />
);
