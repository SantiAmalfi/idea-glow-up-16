import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useI18n, type Language } from "@/lib/i18n";
import Index from "@/pages/Index";

interface LangRouteProps {
  lang: Language;
}

export function LangRoute({ lang }: LangRouteProps) {
  const { language, setLanguage } = useI18n();
  useEffect(() => {
    if (language !== lang) setLanguage(lang);
  }, [lang, language, setLanguage]);
  return <Index />;
}

const SUPPORTED: Language[] = ["es", "en", "pt"];

function detectBrowserLang(): Language {
  if (typeof navigator === "undefined") return "es";
  const langs = [navigator.language, ...(navigator.languages || [])];
  for (const l of langs) {
    if (!l) continue;
    const code = l.toLowerCase().split("-")[0];
    if (SUPPORTED.includes(code as Language)) return code as Language;
  }
  return "en";
}

export function RootLangRedirect() {
  const location = useLocation();
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("investcalc-lang") : null;
  const lang =
    stored && SUPPORTED.includes(stored as Language)
      ? (stored as Language)
      : detectBrowserLang();
  return <Navigate to={`/${lang}${location.search}${location.hash}`} replace />;
}
