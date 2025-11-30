import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient'; 
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  followedTeams: string[];
  toggleFollow: (teamName: string) => void;
  dreamSquad: Record<number, any>;
  updateDreamSquad: (squad: Record<number, any>) => Promise<void>;
  profileLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// Helper for managing dream squad in localStorage
const mockStorage = {
  getDreamSquad: (userId: string) => {
      const item = localStorage.getItem(`goolzon_squad_${userId}`);
      return item ? JSON.parse(item) : {};
  },
  saveDreamSquad: (userId: string, squad: any) => {
      localStorage.setItem(`goolzon_squad_${userId}`, JSON.stringify(squad));
  }
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);
  const [dreamSquad, setDreamSquad] = useState<Record<number, any>>({});
  const [profileLoading, setProfileLoading] = useState(true);

  // Effect to handle auth state changes from the mock client
  useEffect(() => {
    setProfileLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      if (user) {
        // In mock mode, the user object from auth contains the profile data
        const appUser: User = {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || 'مستخدم',
          username: user.user_metadata?.username || 'user',
          avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
          role: user.user_metadata?.role as 'admin' | 'user' || 'user',
          joinDate: user.created_at,
          status: 'active',
          dreamSquad: mockStorage.getDreamSquad(user.id) || {},
        };
        setCurrentUser(appUser);
        setIsAdmin(appUser.role === 'admin');
        setDreamSquad(appUser.dreamSquad);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setDreamSquad({});
      }
      setProfileLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Effect for non-user-specific data
  useEffect(() => {
    const savedFollows = localStorage.getItem('goolzon_followed_teams');
    if (savedFollows) setFollowedTeams(JSON.parse(savedFollows));
  }, []);
  
  const login = async (email: string, password: string) => {
    setProfileLoading(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    setProfileLoading(false);
    if (result.error) return { success: false, error: result.error.message };
    const userRole = result.data.user?.user_metadata?.role || 'user';
    return { success: true, isAdmin: userRole === 'admin' };
  };

  const register = async (userData: any) => {
    setProfileLoading(true);
    const result = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: { data: userData }
    });
    setProfileLoading(false);
    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const toggleFollow = (team: string) => {
    const newFollows = followedTeams.includes(team)
      ? followedTeams.filter(t => t !== team)
      : [...followedTeams, team];
    setFollowedTeams(newFollows);
    localStorage.setItem('goolzon_followed_teams', JSON.stringify(newFollows));
  };

  const updateDreamSquad = async (squad: any) => {
    if (!currentUser) return;
    setDreamSquad(squad); // Optimistic update
    mockStorage.saveDreamSquad(currentUser.id, squad);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, login, logout, register, followedTeams, toggleFollow, dreamSquad, updateDreamSquad, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
