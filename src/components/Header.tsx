import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">
            Invest<span className="text-primary">Calc</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            Pro
          </span>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <a href="#analyzer" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            Analyzer
          </a>
          <a href="#features" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            Features
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
