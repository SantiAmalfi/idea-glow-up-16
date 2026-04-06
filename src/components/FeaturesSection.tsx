import { motion } from "framer-motion";
import { Calculator, Globe, FileDown, ShieldCheck, BarChart3, Zap } from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "NPV, IRR & ROI",
    description: "Industry-standard financial metrics computed instantly with step-by-step breakdowns.",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    description: "Analyze in USD, ARS, MXN, EUR, or GBP with locale-aware formatting.",
  },
  {
    icon: FileDown,
    title: "PDF & Excel Export",
    description: "Download professional reports ready for board presentations or further analysis.",
  },
  {
    icon: BarChart3,
    title: "Scenario Modeling",
    description: "Toggle between optimistic, base, and pessimistic growth scenarios instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Tax-Aware",
    description: "Accounts for tax rates in cash flow calculations with loss carryforward logic.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "No sign-up required. Enter your data and get results in milliseconds.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Everything you need to evaluate investments
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Built for analysts, founders, and finance teams who need fast, reliable projections.
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
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-colors group"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
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
