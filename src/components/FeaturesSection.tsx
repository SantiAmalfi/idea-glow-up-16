import { motion } from "framer-motion";
import { Calculator, Globe, FileDown, ShieldCheck, BarChart3, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function FeaturesSection() {
  const { t } = useI18n();

  const features = [
    { icon: Calculator, title: t("features.npvTitle"), description: t("features.npvDesc") },
    { icon: Globe, title: t("features.currencyTitle"), description: t("features.currencyDesc") },
    { icon: FileDown, title: t("features.exportTitle"), description: t("features.exportDesc") },
    { icon: BarChart3, title: t("features.scenarioTitle"), description: t("features.scenarioDesc") },
    { icon: ShieldCheck, title: t("features.taxTitle"), description: t("features.taxDesc") },
    { icon: Zap, title: t("features.instantTitle"), description: t("features.instantDesc") },
  ];

  return (
    <section id="features" className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {t("features.title")}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          {t("features.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 * i }}
            className="rounded-md border border-border bg-card p-5 hover:border-primary/30 transition-colors group"
          >
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
