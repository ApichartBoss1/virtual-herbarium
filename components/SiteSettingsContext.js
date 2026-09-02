"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [language, setLanguage] = useState("TH");
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);

  /* =========================
     LOAD SETTINGS
  ========================= */

  useEffect(() => {
    const savedLanguage = localStorage.getItem("vh-language");
    const savedDarkMode = localStorage.getItem("vh-dark-mode");

    if (savedLanguage === "TH" || savedLanguage === "EN") {
      setLanguage(savedLanguage);
    }

    if (savedDarkMode === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    setReady(true);
  }, []);

  /* =========================
     SAVE LANGUAGE
  ========================= */

  useEffect(() => {
    if (!ready) return;

    localStorage.setItem(
      "vh-language",
      language
    );
  }, [language, ready]);

  /* =========================
     SAVE DARK MODE
  ========================= */

  useEffect(() => {
    if (!ready) return;

    localStorage.setItem(
      "vh-dark-mode",
      String(darkMode)
    );

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, ready]);

  /* =========================
     CHANGE LANGUAGE
  ========================= */

  const changeLanguage = (lang) => {
    if (lang !== "TH" && lang !== "EN") {
      return;
    }

    setLanguage(lang);
  };

  /* =========================
     TOGGLE DARK MODE
  ========================= */

  const toggleDarkMode = () => {
    setDarkMode((current) => !current);
  };

  /* =========================
     CONTEXT VALUE
  ========================= */

  return (
    <SiteSettingsContext.Provider
      value={{
        // Current values
        language,
        darkMode,

        // Direct setters
        setLanguage,
        setDarkMode,

        // Alternative functions
        changeLanguage,
        toggleDarkMode,

        // Loading state
        ready,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

/* =========================
   CUSTOM HOOK
========================= */

export function useSiteSettings() {
  const context = useContext(
    SiteSettingsContext
  );

  if (!context) {
    throw new Error(
      "useSiteSettings must be used inside SiteSettingsProvider"
    );
  }

  return context;
}