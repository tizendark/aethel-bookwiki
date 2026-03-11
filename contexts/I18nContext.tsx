"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { es } from "@/locales/es";
import { en } from "@/locales/en";
import { Dictionary } from "@/locales/types";

type Language = "es" | "en";

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

const dictionaries: Record<Language, Dictionary> = { es, en };

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("aethel_lang") as Language;
    if (savedLang && (savedLang === "es" || savedLang === "en")) {
      setLanguage(savedLang);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "en") {
        setLanguage("en");
      } else {
        setLanguage("es"); // default fallback
      }
    }
    setMounted(true);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("aethel_lang", lang);
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let current: any = dictionaries[language];
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found for language '${language}': ${path}`);
        return path;
      }
      current = current[key];
    }
    return current;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

export const getCategoryTranslation = (category: string, t: (key: string) => string) => {
  if (!category) return category;
  const map: Record<string, string> = {
    'Ficción': t("categories.fiction"),
    'Fiction': t("categories.fiction"),
    'Fantasía': t("categories.fantasy"),
    'Fantasy': t("categories.fantasy"),
    'Ciencia Ficción': t("categories.scienceFiction"),
    'Science Fiction': t("categories.scienceFiction"),
    'Romance': t("categories.romance"),
    'Misterio': t("categories.mystery"),
    'Mystery': t("categories.mystery"),
    'Filosofía': t("categories.philosophy"),
    'Philosophy': t("categories.philosophy"),
    'Biología': t("categories.biology"),
    'Biología Sintética': t("categories.biology"),
    'Synthetic Biology': t("categories.biology"),
    'Tecnología': t("categories.technology"),
    'Technology': t("categories.technology"),
    'Poesía': t("categories.poetry"),
    'Poetry': t("categories.poetry"),
    'Ciencia': t("categories.science"),
    'Science': t("categories.science"),
    'Arte': t("categories.art"),
    'Art': t("categories.art"),
  };
  return map[category] || category;
};
