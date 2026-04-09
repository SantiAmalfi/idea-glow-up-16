import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const FREE_ANALYSIS_LIMIT = 3;

const STRIPE_PRODUCTS = {
  monthly: {
    price_id: "price_1TK2uKBoacFP6CQ0JIabOKxW",
    product_id: "prod_UIeCPZk88cRV7s",
  },
  annual: {
    price_id: "price_1TK2ulBoacFP6CQ01B6tJ8Rj",
    product_id: "prod_UIeD6eb4uFUyi2",
  },
} as const;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  subscriptionEnd: string | null;
  analysisCount: number;
  canAnalyze: boolean;
  remainingAnalyses: number | null;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  refreshAnalysisCount: () => Promise<void>;
  recordAnalysis: (projectName?: string, inputData?: Record<string, unknown>) => Promise<boolean>;
  createCheckout: (interval: "monthly" | "annual") => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  stripeProducts: typeof STRIPE_PRODUCTS;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  const canAnalyze = isPremium || analysisCount < FREE_ANALYSIS_LIMIT;
  const remainingAnalyses = isPremium ? null : FREE_ANALYSIS_LIMIT - analysisCount;

  const checkSubscription = useCallback(async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setIsPremium(data?.subscribed ?? false);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (e) {
      console.error("Error checking subscription:", e);
    }
  }, [session]);

  const refreshAnalysisCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("get_user_analysis_count", { p_user_id: user.id });
      if (error) throw error;
      setAnalysisCount(data ?? 0);
    } catch (e) {
      console.error("Error fetching analysis count:", e);
    }
  }, [user]);

  const recordAnalysis = useCallback(async (projectName?: string, inputData?: Record<string, unknown>): Promise<boolean> => {
    if (!user) return false;
    if (!isPremium && analysisCount >= FREE_ANALYSIS_LIMIT) return false;

    try {
      const { error } = await supabase.from("analysis_usage").insert({
        user_id: user.id,
        project_name: projectName || null,
        input_data: isPremium && inputData ? inputData : null,
      } as any);
      if (error) throw error;
      setAnalysisCount((c) => c + 1);
      return true;
    } catch (e) {
      console.error("Error recording analysis:", e);
      return false;
    }
  }, [user, isPremium, analysisCount]);

  const createCheckout = useCallback(async (interval: "monthly" | "annual") => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { priceId: STRIPE_PRODUCTS[interval].price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      console.error("Error creating checkout:", e);
    }
  }, [session]);

  const openCustomerPortal = useCallback(async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      console.error("Error opening portal:", e);
    }
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsPremium(false);
    setSubscriptionEnd(null);
    setAnalysisCount(0);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      checkSubscription();
      refreshAnalysisCount();
    }
  }, [session, checkSubscription, refreshAnalysisCount]);

  // Periodic subscription check
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  return (
    <AuthContext.Provider
      value={{
        user, session, loading, isPremium, subscriptionEnd,
        analysisCount, canAnalyze, remainingAnalyses,
        signOut, checkSubscription, refreshAnalysisCount,
        recordAnalysis, createCheckout, openCustomerPortal,
        stripeProducts: STRIPE_PRODUCTS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
