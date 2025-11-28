import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getSupabase } from '../services/supabaseClient';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  role: string;
  joinDate: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  followedTeams: string[];
  toggleFollow: (teamName: string) => void;
  dreamSquad: any;
  updateDreamSquad: (squad: any) => void;
  profileLoading: boolean;
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
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);
  const [dreamSquad, setDreamSquad] = useState<any>({});
  const [profileLoading, setProfileLoading] = useState(true);

  // Load local state
  useEffect(() => {
    const savedFollows = localStorage.getItem('goolzon_followed_teams');
    if (savedFollows) setFollowedTeams(JSON.parse(savedFollows));

    const savedSquad = localStorage.getItem('goolzon_dream_squad');
    if (savedSquad) setDreamSquad(JSON.parse(savedSquad));
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setProfileLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
                joinDate: data.created_at || new Date().toISOString()
              });
              setIsAdmin(data.role === "admin");
              if (data.dream_squad) setDreamSquad(data.dream_squad);
              if (data.followed_teams) setFollowedTeams(data.followed_teams);
            }
            setProfileLoading(false);
          })
          .catch(() => setProfileLoading(false));
      } else {
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "System error" };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    
    // Check admin role locally for immediate feedback, though effect handles it
    // We rely on the effect to set state
    return { success: true, isAdmin: false }; 
  };

  const register = async (userData: any) => {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "System error" };

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          username: userData.username,
        }
      }
    });

    if (error) return { success: false, error: error.message };
    
    // Create profile
    if (data.user) {
        await supabase.from('profiles').insert([{
            id: data.user.id,
            name: userData.name,
            username: userData.username,
            role: 'user',
            email: userData.email
        }]);
    }

    return { success: true };
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const toggleFollow = (team: string) => {
    const newFollows = followedTeams.includes(team)
      ? followedTeams.filter(t => t !== team)
      : [...followedTeams, team];
    
    setFollowedTeams(newFollows);
    localStorage.setItem('goolzon_followed_teams', JSON.stringify(newFollows));

    const supabase = getSupabase();
    if (supabase && currentUser) {
      supabase.from('profiles').update({ followed_teams: newFollows }).eq('id', currentUser.id).then();
    }
  };

  const updateDreamSquad = (squad: any) => {
    setDreamSquad(squad);
    localStorage.setItem('goolzon_dream_squad', JSON.stringify(squad));

    const supabase = getSupabase();
    if (supabase && currentUser) {
      supabase.from('profiles').update({ dream_squad: squad }).eq('id', currentUser.id).then();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAdmin, 
      login, 
      logout, 
      register, 
      followedTeams, 
      toggleFollow, 
      dreamSquad, 
      updateDreamSquad, 
      profileLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};