import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Seo from "@/components/Seo";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();

  useEffect(() => {
    setPendingCheckout(sessionStorage.getItem("pendingCheckout") === "1");
    setPendingAnalysis(sessionStorage.getItem("pendingAnalysis") === "1");
  }, []);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleAbortCheckout = () => {
    sessionStorage.removeItem("pendingCheckout");
    setPendingCheckout(false);
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success(t("auth.resetLinkSent"));
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        // With auto-confirm enabled, signUp returns a session immediately
        if (data.session) {
          toast.success("¡Bienvenido!");
          navigate("/");
        } else {
          // Fallback: try sign in (in case session wasn't returned)
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            toast.success(t("auth.checkEmail"));
          } else {
            navigate("/");
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });

      if (result.error) {
        toast.error(t("auth.googleError"));
        return;
      }

      if (result.redirected) {
        return;
      }

      navigate("/", { replace: true });
    } catch {
      toast.error(t("auth.googleError"));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Seo
        title="Sign In — Project Evaluator"
        description="Sign in or create a free account to analyze investments with NPV, IRR, ROI and payback metrics."
        path="/auth"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-foreground text-xl tracking-tight">
              Project <span className="text-primary">Evaluator</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isForgotPassword ? t("auth.resetPassword") : isSignUp ? t("auth.signUp") : t("auth.signIn")}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isForgotPassword ? t("auth.resetPasswordDesc") : isSignUp ? t("auth.signUpDesc") : t("auth.signInDesc")}
          </p>
          {pendingAnalysis && !pendingCheckout && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-3 rounded-md border border-primary/30 bg-primary/5 text-xs text-primary">
              <Lock className="h-3 w-3 shrink-0" />
              {t("auth.registerToAnalyzeHint")}
            </div>
          )}
          {pendingCheckout && (
            <div className="mt-4 inline-flex flex-col items-center gap-2 px-4 py-3 rounded-md border border-primary/30 bg-primary/5 text-xs text-primary">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                {t("pricing.pendingHint")}
              </span>
              <button
                type="button"
                onClick={handleAbortCheckout}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                {t("pricing.cancelPending")}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-md border border-border bg-card p-6 space-y-4">
          {!isForgotPassword && (
            <>
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full h-11 gap-2.5 border px-3 text-sm font-medium leading-5 hover:opacity-90"
                style={{ backgroundColor: "#131314", borderColor: "#8E918F", color: "#E3E3E3", fontFamily: '"Google Sans", Inter, sans-serif' }}
              >
                <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                </svg>
                {googleLoading ? t("auth.loadingSession") : t("auth.continueGoogle")}
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">{t("auth.orEmail")}</span>
                <Separator className="flex-1" />
              </div>
            </>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-muted-foreground">{t("auth.name")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    placeholder={t("auth.namePlaceholder")}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">{t("auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading || googleLoading} className="w-full">
              {loading ? "..." : isForgotPassword ? t("auth.sendResetLink") : isSignUp ? t("auth.signUp") : t("auth.signIn")}
            </Button>
          </form>

          {!isForgotPassword && !isSignUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <p className="text-xs text-muted-foreground text-center">
              {t("auth.verificationNote")}
            </p>
          )}

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); }}
              className="text-primary hover:underline"
            >
              {isForgotPassword ? t("auth.hasAccount") : isSignUp ? t("auth.hasAccount") : t("auth.noAccount")}
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("auth.backHome")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
