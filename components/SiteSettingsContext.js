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

    useEffect(() => {
        const savedLanguage =
            localStorage.getItem("vh-language");

        const savedDarkMode =
            localStorage.getItem("vh-dark-mode");

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

    useEffect(() => {
        if (!ready) return;

        localStorage.setItem(
            "vh-language",
            language
        );
    }, [language, ready]);

    useEffect(() => {
        if (!ready) return;

        localStorage.setItem(
            "vh-dark-mode",
            String(darkMode)
        );

        if (darkMode) {
            document.documentElement.classList.add(
                "dark"
            );
        } else {
            document.documentElement.classList.remove(
                "dark"
            );
        }
    }, [darkMode, ready]);

    const changeLanguage = (lang) => {
        if (lang !== "TH" && lang !== "EN") {
            return;
        }

        setLanguage(lang);
    };

    const toggleDarkMode = () => {
        setDarkMode((current) => !current);
    };

    return (
        <SiteSettingsContext.Provider
            value={{
                language,
                darkMode,
                changeLanguage,
                toggleDarkMode,
            }}
        >
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    const context =
        useContext(SiteSettingsContext);

    if (!context) {
        throw new Error(
            "useSiteSettings must be used inside SiteSettingsProvider"
        );
    }

    return context;
}