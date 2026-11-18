import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

function getOAuthError() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return query.get("error") || hash.get("error");
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    let active = true;
    let settled = false;

    const finish = (path: "/" | "/auth", showError = false) => {
      if (!active || settled) return;
      settled = true;
      if (showError) toast.error(t("auth.googleError"));
      navigate(path, { replace: true });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish("/");
    });

    if (getOAuthError()) {
      finish("/auth", true);
    } else {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) finish("/auth", true);
        else if (session) finish("/");
      });
    }

    const timeout = window.setTimeout(() => {
      finish("/auth", true);
    }, 15000);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate, t]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        {t("auth.loadingSession")}
      </div>
    </div>
  );
}
