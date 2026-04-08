import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t("auth.checkEmail"));
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-foreground text-xl tracking-tight">
              Project <span className="text-primary">Evaluator</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isSignUp ? t("auth.signUp") : t("auth.signIn")}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isSignUp ? t("auth.signUpDesc") : t("auth.signInDesc")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          {isSignUp && (
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "..." : isSignUp ? t("auth.signUp") : t("auth.signIn")}
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? t("auth.hasAccount") : t("auth.noAccount")}
            </button>
          </div>
        </form>

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
