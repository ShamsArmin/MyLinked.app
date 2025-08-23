import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Use the App component with our authentication system
createRoot(document.getElementById("root")!).render(
  <App />
);
