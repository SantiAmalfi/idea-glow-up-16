import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, BarChart3, User, Calendar, FileText, Edit, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { toast } from "sonner";

interface AnalysisRecord {
  id: string;
  project_name: string | null;
  created_at: string;
  input_data: Record<string, unknown> | null;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, isPremium, subscriptionEnd, analysisCount, remainingAnalyses, openCustomerPortal, createCheckout } = useAuth();
  const { t } = useI18n();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAnalyses();
  }, [user, navigate]);

  const fetchAnalyses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("analysis_usage")
        .select("id, project_name, created_at, input_data" as any)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      setAnalyses((data as any) || []);
    } catch (e) {
      console.error("Error fetching analyses:", e);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleLoadAnalysis = (analysis: AnalysisRecord) => {
    if (!analysis.input_data) {
      toast.info(t("settings.noDataSaved"));
      return;
    }
    sessionStorage.setItem("loadAnalysis", JSON.stringify(analysis.input_data));
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("auth.backHome")}
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t("settings.profile")}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-muted-foreground text-xs mb-1">{t("settings.plan")}</p>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  {isPremium ? (
                    <><Crown className="h-4 w-4 text-primary" /> Premium</>
                  ) : (
                    <>{t("pricing.free")}</>
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-muted-foreground text-xs mb-1">{t("settings.analysesUsed")}</p>
                <p className="font-semibold text-foreground">
                  {analysisCount}
                  {!isPremium && remainingAnalyses !== null && (
                    <span className="text-muted-foreground font-normal"> / {analysisCount + remainingAnalyses}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-primary" />
              {t("settings.subscription")}
            </h2>
            {isPremium ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm text-foreground font-medium">⭐ {t("settings.premiumActive")}</p>
                  {subscriptionEnd && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("settings.renewsOn")} {new Date(subscriptionEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button onClick={openCustomerPortal} variant="outline" className="flex-1 gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {t("pricing.manage")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {t("settings.cancelSub")} · {t("settings.changePlan")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("settings.upgradeDesc")}</p>
                <div className="flex gap-3">
                  <Button onClick={() => createCheckout("annual")} className="flex-1">
                    {t("pricing.annual")} — $10.000/{t("pricing.perYear")}
                  </Button>
                  <Button onClick={() => createCheckout("lifetime")} variant="outline" className="flex-1">
                    {t("pricing.lifetime")} — $25.000
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Analysis history — limited to 10, ordered by date desc */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t("settings.myAnalyses")}
              </h2>
              <span className="text-xs text-muted-foreground">
                {analyses.length}/10
              </span>
            </div>
            {loadingAnalyses ? (
              <p className="text-sm text-muted-foreground">{t("settings.loading")}</p>
            ) : analyses.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("settings.noAnalyses")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analyses.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <BarChart3 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {a.project_name || t("settings.untitledProject")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                      {isPremium && a.input_data && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadAnalysis(a)}
                          className="gap-1 text-primary text-xs h-7 px-2"
                        >
                          <Edit className="h-3 w-3" />
                          {t("settings.loadAnalysis")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
