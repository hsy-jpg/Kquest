import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAnonymous: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;
  const isAnonymous = user?.is_anonymous ?? false;

  const signUp = async (email: string, password: string) => {
    if (isAnonymous) {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) throw new Error(error.message);
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAnonymous, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
