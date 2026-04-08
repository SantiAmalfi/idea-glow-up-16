import { TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/50 bg-card/50 mt-20">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-bold text-foreground">
              Project <span className="text-primary">Evaluator</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t("footer.disclaimer")}
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Project Evaluator
          </p>
        </div>
      </div>
    </footer>
  );
}
