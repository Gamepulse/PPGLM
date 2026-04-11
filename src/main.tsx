import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ConsoleProvider } from "./components/Layout/ConsolePanel";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./theme";
import { SettingsProvider } from "./context/SettingsContext";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <SettingsProvider>
          <ConsoleProvider>
            <App />
          </ConsoleProvider>
        </SettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
