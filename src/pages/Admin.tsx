import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Shield, ShieldOff, Users, BarChart3, Trash2, UserCog } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { toast } from "sonner";
import Seo from "@/components/Seo";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  is_admin: boolean;
  is_premium: boolean;
  subscription_end: string | null;
  analysis_count: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    if (!isAdmin) { navigate("/"); toast.error("Acceso denegado"); return; }
    fetchUsers();
  }, [user, isAdmin, loading, navigate]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const [profilesRes, rolesRes, subsRes, analysesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, email, display_name, created_at"),
        supabase.from("user_roles" as any).select("user_id, role").eq("role", "admin"),
        supabase.from("subscriptions").select("user_id, status, next_payment_date, created_at").order("created_at", { ascending: false }),
        supabase.from("analysis_usage").select("user_id"),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const adminIds = new Set(((rolesRes.data as any[]) || []).map((r) => r.user_id));
      const subsByUser = new Map<string, { status: string; next_payment_date: string | null }>();
      ((subsRes.data as any[]) || []).forEach((s) => {
        if (!subsByUser.has(s.user_id)) subsByUser.set(s.user_id, s);
      });
      const countsByUser = new Map<string, number>();
      ((analysesRes.data as any[]) || []).forEach((a) => {
        countsByUser.set(a.user_id, (countsByUser.get(a.user_id) || 0) + 1);
      });

      const rows: UserRow[] = (profilesRes.data || []).map((p: any) => {
        const sub = subsByUser.get(p.user_id);
        const isPremium = sub?.status === "authorized" &&
          (!sub.next_payment_date || new Date(sub.next_payment_date) > new Date());
        return {
          user_id: p.user_id,
          email: p.email,
          display_name: p.display_name,
          created_at: p.created_at,
          is_admin: adminIds.has(p.user_id),
          is_premium: !!isPremium,
          subscription_end: sub?.next_payment_date ?? null,
          analysis_count: countsByUser.get(p.user_id) || 0,
        };
      });

      rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setUsers(rows);
    } catch (e) {
      console.error(e);
      toast.error("Error cargando usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleAdmin = async (u: UserRow) => {
    try {
      if (u.is_admin) {
        if (u.user_id === user?.id) { toast.error("No podés quitarte tu propio rol admin"); return; }
        const { error } = await supabase.from("user_roles" as any).delete()
          .eq("user_id", u.user_id).eq("role", "admin");
        if (error) throw error;
        toast.success("Rol admin removido");
      } else {
        const { error } = await supabase.from("user_roles" as any).insert({ user_id: u.user_id, role: "admin" });
        if (error) throw error;
        toast.success("Rol admin asignado");
      }
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  };

  const togglePremium = async (u: UserRow) => {
    try {
      if (u.is_premium) {
        const { error } = await supabase.from("subscriptions").update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        }).eq("user_id", u.user_id).eq("status", "authorized");
        if (error) throw error;
        toast.success("Premium revocado");
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          user_id: u.user_id,
          preapproval_id: `admin-grant-${crypto.randomUUID()}`,
          status: "authorized",
          amount: 25000,
          currency: "ARS",
          payer_email: u.email,
          last_payment_date: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10).toISOString(),
        });
        if (error) throw error;
        toast.success("Premium otorgado");
      }
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  };

  const deleteAnalyses = async (u: UserRow) => {
    try {
      const { error } = await supabase.from("analysis_usage").delete().eq("user_id", u.user_id);
      if (error) throw error;
      toast.success("Análisis borrados");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  };

  const filtered = users.filter((u) =>
    !filter || u.email?.toLowerCase().includes(filter.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading || !isAdmin) return null;

  const stats = {
    total: users.length,
    premium: users.filter((u) => u.is_premium).length,
    admins: users.filter((u) => u.is_admin).length,
    analyses: users.reduce((s, u) => s + u.analysis_count, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Admin Panel — Project Evaluator"
        description="Administer users, roles and platform analytics for Project Evaluator."
        path="/admin"
      />
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-primary/15 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">Gestión de usuarios, suscripciones y roles</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Usuarios", value: stats.total, icon: Users },
              { label: "Premium", value: stats.premium, icon: Crown },
              { label: "Admins", value: stats.admins, icon: Shield },
              { label: "Análisis", value: stats.analyses, icon: BarChart3 },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-semibold text-foreground mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div className="rounded-md border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" /> Usuarios
              </h2>
              <input
                type="text"
                placeholder="Buscar por email o nombre..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground w-64 max-w-full"
              />
            </div>

            {loadingUsers ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin usuarios</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Usuario</th>
                      <th className="py-2 px-3 font-medium">Plan</th>
                      <th className="py-2 px-3 font-medium">Rol</th>
                      <th className="py-2 px-3 font-medium text-center">Análisis</th>
                      <th className="py-2 px-3 font-medium">Registro</th>
                      <th className="py-2 pl-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.user_id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 pr-3">
                          <p className="font-medium text-foreground truncate max-w-[200px]">{u.email}</p>
                          {u.display_name && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.display_name}</p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {u.is_premium ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                              <Crown className="h-3 w-3" /> Premium
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Free</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {u.is_admin ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                              <Shield className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Usuario</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-foreground">{u.analysis_count}</td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              onClick={() => togglePremium(u)}
                              title={u.is_premium ? "Revocar Premium" : "Otorgar Premium"}
                            >
                              <Crown className={`h-3.5 w-3.5 ${u.is_premium ? "text-primary" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              onClick={() => toggleAdmin(u)}
                              disabled={u.user_id === user?.id && u.is_admin}
                              title={u.is_admin ? "Quitar admin" : "Hacer admin"}
                            >
                              {u.is_admin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                            </Button>
                            {u.analysis_count > 0 && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Borrar análisis?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Se eliminarán los {u.analysis_count} análisis de {u.email}. Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteAnalyses(u)}>Borrar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
