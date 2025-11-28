import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getSupabase } from '../services/supabaseClient';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  role: string; // Keep for UI compatibility
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setCurrentUser(null);
        setIsAdmin(false);
        setProfileLoading(false);
        return;
      }

      const user = session.user;
      
      try {
          // 1. Check if user exists in 'admins' table
          const { data: adminRecord } = await supabase
            .from('admins')
            .select('id')
            .eq('id', user.id)
            .single();

          const isUserAdmin = !!adminRecord;
          setIsAdmin(isUserAdmin);

          // 2. Get User Profile Data
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
             setCurrentUser({
                id: user.id,
                email: user.email || "",
                name: profile.name || "مشجع",
                username: profile.username || "user",
                avatar: profile.avatar,
                role: isUserAdmin ? 'admin' : 'user',
                joinDate: profile.created_at || new Date().toISOString()
             });
             
             if (profile.dream_squad) setDreamSquad(profile.dream_squad);
             if (profile.followed_teams) setFollowedTeams(profile.followed_teams);
          } else {
             // Fallback if profile missing
             setCurrentUser({
                id: user.id,
                email: user.email || "",
                name: user.user_metadata?.name || "User",
                username: user.user_metadata?.username || "user",
                role: isUserAdmin ? 'admin' : 'user',
                joinDate: new Date().toISOString()
             });
          }
      } catch (err) {
          console.error("Auth Error:", err);
      } finally {
          setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "System error" };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      
      // Check admins table strictly
      let isAdminUser = false;
      if (data.user) {
          const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('id', data.user.id)
            .single();
          
          if (adminData) isAdminUser = true;
      }
      
      return { success: true, isAdmin: isAdminUser }; 
    } catch (e: any) {
      return { success: false, error: e.message || "Login failed" };
    }
  };

  const register = async (userData: any) => {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "System error" };

    try {
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
      
      // Only create a normal profile. Admin must be added manually to 'admins' table via SQL.
      if (data.user) {
          await supabase.from('profiles').insert([{
              id: data.user.id,
              name: userData.name,
              username: userData.username,
              role: 'user', // Always user initially
              email: userData.email
          }]);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Registration failed" };
    }
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