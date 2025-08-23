import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/fetch-with-credentials"; // always send cookies with fetch

// Use the App component with our authentication system
createRoot(document.getElementById("root")!).render(
  <App />
);
