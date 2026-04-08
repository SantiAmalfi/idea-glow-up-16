import { LogOut, Crown, User, Settings, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu() {
  const { user, isPremium, remainingAnalyses, signOut, openCustomerPortal } = useAuth();
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
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPremium ? (
              <span className="text-primary font-medium">⭐ Premium</span>
            ) : (
              <>{t("pricing.free")} · {remainingAnalyses} {t("auth.remaining")}</>
            )}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          {t("nav.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <BarChart3 className="h-4 w-4 mr-2" />
          {t("settings.myAnalyses")}
        </DropdownMenuItem>
        {isPremium && (
          <DropdownMenuItem onClick={openCustomerPortal}>
            <Crown className="h-4 w-4 mr-2" />
            {t("pricing.manage")}
          </DropdownMenuItem>
        )}
        {!isPremium && (
          <DropdownMenuItem onClick={() => {
            const el = document.getElementById("pricing");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}>
            <Crown className="h-4 w-4 mr-2" />
            {t("pricing.upgrade")}
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
