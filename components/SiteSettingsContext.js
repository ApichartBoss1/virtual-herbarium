"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  /*
   * Dark Forest เป็นค่าเริ่มต้น
   * ถ้าเคยเลือกไว้แล้ว จะใช้ค่าจาก localStorage
   */
  const [language, setLanguage] = useState("TH");
  const [darkMode, setDarkMode] = useState(true);

  const [ready, setReady] = useState(false);

  /* =====================================================
     APPLY THEME
  ===================================================== */

  function applyTheme(isDark) {
    if (typeof document === "undefined") return;

    const html = document.documentElement;

    if (isDark) {
      html.classList.add("dark");
      html.classList.remove("light");

      html.setAttribute("data-theme", "dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.add("light");
      html.classList.remove("dark");

      html.setAttribute("data-theme", "light");
      html.style.colorScheme = "light";
    }
  }

  /* =====================================================
     APPLY LANGUAGE
  ===================================================== */

  function applyLanguage(lang) {
    if (typeof document === "undefined") return;

    document.documentElement.lang = lang === "EN" ? "en" : "th";
  }

  /* =====================================================
     LOAD SAVED SETTINGS
  ===================================================== */

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("vh-language");

      const savedDarkMode = localStorage.getItem("vh-dark-mode");

      /* -------------------------
         LANGUAGE
      ------------------------- */

      let initialLanguage = "TH";

      if (savedLanguage === "TH" || savedLanguage === "EN") {
        initialLanguage = savedLanguage;
      }

      setLanguage(initialLanguage);
      applyLanguage(initialLanguage);

      /* -------------------------
         THEME
      ------------------------- */

      /*
       * ถ้ายังไม่เคยเลือก Theme
       * ให้ Dark Forest เป็นค่าเริ่มต้น
       */

      let initialDarkMode = true;

      if (savedDarkMode === "true") {
        initialDarkMode = true;
      }

      if (savedDarkMode === "false") {
        initialDarkMode = false;
      }

      setDarkMode(initialDarkMode);
      applyTheme(initialDarkMode);
    } catch (error) {
      console.error("Unable to load site settings:", error);

      /*
       * ถ้า localStorage มีปัญหา
       * ให้ใช้ Dark Forest + ภาษาไทย
       */

      setLanguage("TH");
      setDarkMode(true);

      applyLanguage("TH");
      applyTheme(true);
    } finally {
      setReady(true);
    }
  }, []);

  /* =====================================================
     SAVE + APPLY LANGUAGE
  ===================================================== */

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem("vh-language", language);
    } catch (error) {
      console.error("Unable to save language:", error);
    }

    applyLanguage(language);
  }, [language, ready]);

  /* =====================================================
     SAVE + APPLY DARK MODE
  ===================================================== */

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem("vh-dark-mode", String(darkMode));
    } catch (error) {
      console.error("Unable to save theme:", error);
    }

    applyTheme(darkMode);
  }, [darkMode, ready]);

  /* =====================================================
     CHANGE LANGUAGE
  ===================================================== */

  function changeLanguage(lang) {
    if (lang !== "TH" && lang !== "EN") {
      return;
    }

    setLanguage(lang);
  }

  /* =====================================================
     TOGGLE DARK MODE
  ===================================================== */

  function toggleDarkMode() {
    setDarkMode((current) => !current);
  }

  /* =====================================================
     SET THEME DIRECTLY
  ===================================================== */

  function changeTheme(mode) {
    if (mode === "dark") {
      setDarkMode(true);
      return;
    }

    if (mode === "light") {
      setDarkMode(false);
    }
  }

  /* =====================================================
     CONTEXT
  ===================================================== */

  return (
    <SiteSettingsContext.Provider
      value={{
        /* Current settings */
        language,
        darkMode,
        ready,

        /* Existing setters */
        setLanguage,
        setDarkMode,

        /* Functions */
        changeLanguage,
        toggleDarkMode,
        changeTheme,

        /* Convenience */
        isEnglish: language === "EN",
        isThai: language === "TH",
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

/* =====================================================
   CUSTOM HOOK
===================================================== */

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  }

  return context;
}
