import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./shared/styles/global.scss";

// Находим наш div с id="root" из index.html
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
