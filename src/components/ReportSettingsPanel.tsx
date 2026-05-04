import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Palette, Type, Image, FileText, Upload, X, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReportSettings {
  template_id: string;
  header_title: string;
  header_subtitle: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  logo_url: string | null;
}

const DEFAULT_SETTINGS: ReportSettings = {
  template_id: "professional",
  header_title: "",
  header_subtitle: "",
  primary_color: "#0f172a",
  secondary_color: "#10b981",
  accent_color: "#94a3b8",
  font_family: "helvetica",
  logo_url: null,
};

const TEMPLATES = [
  { id: "professional", labelKey: "report.tplProfessional" as const, desc: "report.tplProfessionalDesc" as const },
  { id: "modern", labelKey: "report.tplModern" as const, desc: "report.tplModernDesc" as const },
  { id: "minimal", labelKey: "report.tplMinimal" as const, desc: "report.tplMinimalDesc" as const },
  { id: "corporate", labelKey: "report.tplCorporate" as const, desc: "report.tplCorporateDesc" as const },
];

const FONTS = [
  { id: "helvetica", label: "Helvetica" },
  { id: "times", label: "Times New Roman" },
  { id: "courier", label: "Courier" },
];

export function useReportSettings() {
  const { user, isPremium } = useAuth();
  const [settings, setSettings] = useState<ReportSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const resolveLogoUrl = useCallback(async (logoUrl: string | null) => {
    if (!logoUrl) return null;
    const storagePath = logoUrl.match(/company-logos\/(.+?)(?:\?|$)/)?.[1] ?? logoUrl;
    if (storagePath.startsWith("http")) return logoUrl;

    const { data } = await supabase.storage
      .from("company-logos")
      .createSignedUrl(storagePath, 60 * 60);

    return data?.signedUrl ?? null;
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!user || !isPremium) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("report_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const logoUrl = await resolveLogoUrl(data.logo_url);
        setSettings({
          template_id: data.template_id,
          header_title: data.header_title || "",
          header_subtitle: data.header_subtitle || "",
          primary_color: data.primary_color || "#0f172a",
          secondary_color: data.secondary_color || "#10b981",
          accent_color: data.accent_color || "#94a3b8",
          font_family: data.font_family || "helvetica",
          logo_url: logoUrl,
        });
      }
    } catch (e) {
      console.error("Error fetching report settings:", e);
    } finally {
      setLoading(false);
    }
  }, [user, isPremium, resolveLogoUrl]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  return { settings, setSettings, loading, refetch: fetchSettings };
}

interface ReportSettingsPanelProps {
  settings: ReportSettings;
  onChange: (settings: ReportSettings) => void;
  onSave: () => void;
  saving?: boolean;
}

export default function ReportSettingsPanel({ settings, onChange, onSave, saving }: ReportSettingsPanelProps) {
  const { user, isPremium } = useAuth();
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);

  if (!user || !isPremium) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-center">
        <Lock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">{t("report.premiumOnly")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("report.premiumOnlyDesc")}</p>
      </div>
    );
  }

  const update = (partial: Partial<ReportSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("report.logoTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData, error: signedUrlError } = await supabase.storage
        .from("company-logos")
        .createSignedUrl(path, 60 * 60);
      if (signedUrlError) throw signedUrlError;

      update({ logo_url: urlData.signedUrl });
      toast.success(t("report.logoUploaded"));
    } catch (err: any) {
      toast.error(err.message || "Error uploading logo");
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => update({ logo_url: null });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-border bg-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {t("report.customizeReport")}
        </h3>
        <Button onClick={onSave} disabled={saving} size="sm" className="gap-1.5">
          <Check className="h-3.5 w-3.5" />
          {saving ? "..." : t("report.save")}
        </Button>
      </div>

      {/* Template Selection */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">{t("report.template")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => update({ template_id: tpl.id })}
              className={`rounded-md border p-3 text-left transition-all ${
                settings.template_id === tpl.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-medium text-foreground">{t(tpl.labelKey)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(tpl.desc)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Image className="h-3.5 w-3.5" />
          {t("report.companyLogo")}
        </Label>
        {settings.logo_url ? (
          <div className="flex items-center gap-3">
            <div className="h-12 w-24 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
              <img src={settings.logo_url} alt="Logo" className="max-h-10 max-w-20 object-contain" />
            </div>
            <Button variant="ghost" size="sm" onClick={removeLogo} className="text-destructive">
              <X className="h-3.5 w-3.5 mr-1" />
              {t("report.removeLogo")}
            </Button>
          </div>
        ) : (
          <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border hover:border-primary/30 p-4 transition-colors">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading ? "..." : t("report.uploadLogo")}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Header Customization */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5" />
          {t("report.headerCustom")}
        </Label>
        <Input
          placeholder={t("report.headerTitlePh")}
          value={settings.header_title}
          onChange={(e) => update({ header_title: e.target.value })}
        />
        <Input
          placeholder={t("report.headerSubtitlePh")}
          value={settings.header_subtitle}
          onChange={(e) => update({ header_subtitle: e.target.value })}
        />
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5" />
          {t("report.colors")}
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{t("report.primaryColor")}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => update({ primary_color: e.target.value })}
                className="h-8 w-8 rounded-md border border-border cursor-pointer"
              />
              <Input
                value={settings.primary_color}
                onChange={(e) => update({ primary_color: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{t("report.secondaryColor")}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.secondary_color}
                onChange={(e) => update({ secondary_color: e.target.value })}
                className="h-8 w-8 rounded-md border border-border cursor-pointer"
              />
              <Input
                value={settings.secondary_color}
                onChange={(e) => update({ secondary_color: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{t("report.accentColor")}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.accent_color}
                onChange={(e) => update({ accent_color: e.target.value })}
                className="h-8 w-8 rounded-md border border-border cursor-pointer"
              />
              <Input
                value={settings.accent_color}
                onChange={(e) => update({ accent_color: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">{t("report.font")}</Label>
        <div className="flex gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => update({ font_family: f.id })}
              className={`flex-1 rounded-md border px-3 py-2 text-sm transition-all ${
                settings.font_family === f.id
                  ? "border-primary bg-primary/5 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
