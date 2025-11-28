import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getSupabase } from '../services/supabaseClient';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  role: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();

    const { subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setIsAdmin(false);
      } else if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setCurrentUser({
                id: session.user.id,
                email: session.user.email || "",
                name: data.name || "مشجع",
                username: data.username || "user",
                avatar: data.avatar,
                role: data.role || "user",
              });
              setIsAdmin(data.role === "admin");
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error("Login error:", error.message);
  };

  const logout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
