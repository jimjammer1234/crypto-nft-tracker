import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.js";
import { AuthGate } from "./components/AuthGate.js";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthGate>
      <HashRouter>
        <App />
      </HashRouter>
    </AuthGate>
  </React.StrictMode>
);
