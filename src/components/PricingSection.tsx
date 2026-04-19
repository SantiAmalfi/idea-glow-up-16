import { motion } from "framer-motion";
import { Check, Crown, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

export default function PricingSection() {
  const { user, isPremium, createSubscription, cancelSubscription } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleUpgrade = async () => {
    setLoadingCheckout(true);
    try {
      await createSubscription();
    } catch (e: any) {
      toast.error(e?.message || "Error iniciando el pago");
      setLoadingCheckout(false);
    }
  };

  const handleSignUpToPay = () => {
    sessionStorage.setItem("pendingCheckout", "1");
    navigate("/auth");
  };

  const plans = [
    {
      name: t("pricing.free"),
      price: "$0",
      interval: t("pricing.forever"),
      features: [
        t("pricing.freeFeature1"),
        t("pricing.freeFeature2"),
        t("pricing.freeFeature3"),
      ],
      current: user && !isPremium,
    },
    {
      name: t("pricing.annual"),
      price: "$25.000 ARS",
      interval: t("pricing.perYear"),
      features: [
        t("pricing.premFeature1"),
        t("pricing.premFeature2"),
        t("pricing.premFeature3"),
        t("pricing.premFeature4"),
      ],
      highlight: true,
      isPaid: true,
    },
  ];

  return (
    <section id="pricing" className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary uppercase tracking-widest mb-4">
          <Crown className="h-3 w-3" />
          {t("pricing.badge")}
        </div>
        <h2 className="text-3xl font-bold text-foreground">{t("pricing.title")}</h2>
        <p className="text-muted-foreground mt-2">{t("pricing.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className={`rounded-2xl border p-6 flex flex-col ${
              plan.highlight
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card"
            } ${plan.current ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              {plan.current && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                  {t("pricing.current")}
                </span>
              )}
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground ml-1">/{plan.interval}</span>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.isPaid ? (
              isPremium ? (
                <Button variant="outline" onClick={cancelSubscription} className="w-full">
                  {t("pricing.manage")}
                </Button>
              ) : user ? (
                <Button
                  onClick={createSubscription}
                  className="w-full"
                  variant="default"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  {t("pricing.upgrade")}
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")} variant="default" className="w-full">
                  {t("pricing.signUpFirst")}
                </Button>
              )
            ) : (
              <Button variant="outline" disabled={!!plan.current} className="w-full">
                {plan.current ? t("pricing.current") : t("pricing.getStarted")}
              </Button>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
