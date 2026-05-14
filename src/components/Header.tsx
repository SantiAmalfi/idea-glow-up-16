import { motion } from "framer-motion";
import { TrendingUp, Globe } from "lucide-react";
import { useI18n, LANGUAGE_CONFIG, type Language } from "@/lib/i18n";
import { useLocation, useNavigate } from "react-router-dom";
import UserMenu from "@/components/UserMenu";

export default function Header() {
  const { language, setLanguage, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/" || /^\/(es|en|pt)$/.test(location.pathname);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (!isHome) {
      e.preventDefault();
      navigate(`/${language}${hash}`);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-[15px] tracking-tight">
            Project<span className="text-muted-foreground"> Evaluator</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <a href="#analyzer" onClick={(e) => handleNavClick(e, "#analyzer")} className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {t("nav.analyzer")}
          </a>
          <a href="#pricing" onClick={(e) => handleNavClick(e, "#pricing")} className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {t("nav.pricing")}
          </a>
          <a href="#features" onClick={(e) => handleNavClick(e, "#features")} className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {t("nav.features")}
          </a>
          <div className="ml-2 h-5 w-px bg-border" />
          <div className="ml-1 flex items-center gap-0.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            {(Object.keys(LANGUAGE_CONFIG) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  if (/^\/(es|en|pt)(\/|$)/.test(location.pathname)) {
                    navigate(`/${lang}${location.search}${location.hash}`);
                  }
                }}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  language === lang
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {LANGUAGE_CONFIG[lang].flag}
              </button>
            ))}
          </div>
          <div className="ml-2 h-5 w-px bg-border" />
          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
