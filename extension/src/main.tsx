import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const ROOT_ID = "cptracker-userscript-root";

const rootElement = (() => {
  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    return existing;
  }

  const app = document.createElement("div");
  app.id = ROOT_ID;
  document.body.append(app);
  return app;
})();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
