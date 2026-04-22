import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const FREE_ANALYSIS_LIMIT = 3;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  subscriptionEnd: string | null;
  analysisCount: number;
  canAnalyze: boolean;
  remainingAnalyses: number | null;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  refreshAnalysisCount: () => Promise<void>;
  recordAnalysis: (projectName?: string, inputData?: Record<string, unknown>) => Promise<boolean>;
  createSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const canAnalyze = isPremium || analysisCount < FREE_ANALYSIS_LIMIT;
  const remainingAnalyses = isPremium ? null : FREE_ANALYSIS_LIMIT - analysisCount;

  const checkSubscription = useCallback(async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke("mp-check-subscription", {
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

  const createSubscription = useCallback(async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke("mp-create-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        // Same-tab redirect avoids popup blockers and keeps the flow continuous
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e) {
      console.error("Error creating subscription:", e);
      throw e;
    }
  }, [session]);

  const cancelSubscription = useCallback(async () => {
    if (!session) return;
    try {
      const { error } = await supabase.functions.invoke("mp-cancel-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      await checkSubscription();
    } catch (e) {
      console.error("Error cancelling subscription:", e);
    }
  }, [session, checkSubscription]);

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
        recordAnalysis, createSubscription, cancelSubscription,
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
