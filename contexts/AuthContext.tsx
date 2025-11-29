import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  followedTeams: string[];
  toggleFollow: (teamName: string) => void;
  dreamSquad: any;
  updateDreamSquad: (squad: any) => Promise<void>;
  profileLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);
  const [dreamSquad, setDreamSquad] = useState<any>({});
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Load non-user-specific data from local storage
    const savedFollows = localStorage.getItem('goolzon_followed_teams');
    if (savedFollows) setFollowedTeams(JSON.parse(savedFollows));

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setProfileLoading(false);
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setDreamSquad({});
        setProfileLoading(false);
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (user: SupabaseUser) => {
    setProfileLoading(true);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      setProfileLoading(false);
      return;
    }

    if (profile) {
      const appUser: User = {
        id: user.id,
        email: user.email!,
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        role: profile.role,
        joinDate: user.created_at,
        status: profile.status,
        dreamSquad: profile.dream_squad || {},
      };
      setCurrentUser(appUser);
      setIsAdmin(profile.role === 'admin');
      setDreamSquad(profile.dream_squad || {});
    }
    setProfileLoading(false);
  };
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    const isAdminUser = data.user?.id && (await supabase.from('profiles').select('role').eq('id', data.user.id).single()).data?.role === 'admin';
    return { success: true, isAdmin: isAdminUser }; 
  };

  const register = async (userData: any) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          username: userData.username,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
        }
      }
    });
    if (error) return { success: false, error: error.message };
    // The handle_new_user trigger in Supabase will create the profile.
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const toggleFollow = (team: string) => {
    // This functionality is not stored in the database in the current schema,
    // so we will keep it in localStorage for now.
    const newFollows = followedTeams.includes(team)
      ? followedTeams.filter(t => t !== team)
      : [...followedTeams, team];
    setFollowedTeams(newFollows);
    localStorage.setItem('goolzon_followed_teams', JSON.stringify(newFollows));
  };

  const updateDreamSquad = async (squad: any) => {
    if (!currentUser) return;
    setDreamSquad(squad); // Optimistic update
    const { error } = await supabase
      .from('profiles')
      .update({ dream_squad: squad })
      .eq('id', currentUser.id);
    if (error) {
      console.error("Failed to update dream squad:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, login, logout, register, followedTeams, toggleFollow, dreamSquad, updateDreamSquad, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
