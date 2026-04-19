import { LogOut, Crown, User, Settings, BarChart3, CreditCard, Zap, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu() {
  const { user, isPremium, subscriptionEnd, remainingAnalyses, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  if (!user) {
    return (
      <button
        onClick={() => navigate("/auth")}
        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
      >
        {t("auth.signIn")}
      </button>
    );
  }

  const goToPricing = () => {
    if (window.location.pathname !== "/") {
      navigate("/#pricing");
      return;
    }
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
          <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
            {isPremium ? (
              <Crown className="h-3.5 w-3.5 text-primary" />
            ) : (
              <User className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
          <span className="text-sm text-foreground hidden sm:inline">
            {user.email?.split("@")[0]}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2">
          <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPremium ? (
              <span className="text-primary font-medium inline-flex items-center gap-1">
                <Crown className="h-3 w-3" /> Premium
              </span>
            ) : (
              <>{t("pricing.free")} · {remainingAnalyses} {t("auth.remaining")}</>
            )}
          </p>
          {isPremium && subscriptionEnd && (
            <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {t("settings.renewsOn")} {new Date(subscriptionEnd).toLocaleDateString()}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t("menu.account")}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          {t("nav.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <BarChart3 className="h-4 w-4 mr-2" />
          {t("settings.myAnalyses")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t("menu.subscription")}
        </DropdownMenuLabel>
        {isPremium ? (
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <CreditCard className="h-4 w-4 mr-2" />
            {t("pricing.manage")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={goToPricing}>
            <Zap className="h-4 w-4 mr-2 text-primary" />
            <span className="text-primary font-medium">{t("pricing.upgrade")}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {t("auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
