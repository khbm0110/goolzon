import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { getSupabase } from '../services/supabaseClient';
import { useSettings } from './SettingsContext';

const ADMIN_EMAIL = 'admin@goolzon.dev';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
  register: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  followedTeams: string[];
  toggleFollow: (teamName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { supabaseConfig } = useSettings();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [followedTeams, setFollowedTeams] = useState<string[]>(() => {
    const saved = localStorage.getItem('goolzon_followed');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const supabase = getSupabase(supabaseConfig.url, supabaseConfig.anonKey);
    if (!supabase) {
        if (currentUser?.id !== 'local-admin') {
            setCurrentUser(null);
            setIsAdmin(false);
        }
        return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setIsAdmin(false);
        } else if (session?.user) {
            const user = session.user;
            const isUserAdmin = user.email === ADMIN_EMAIL;
            
            const profile: User = {
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || (isUserAdmin ? 'المدير العام' : 'مشجع'),
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
                joinDate: user.created_at || new Date().toISOString(),
                password: '', // Should not be stored
            };
            
            setCurrentUser(profile);
            setIsAdmin(isUserAdmin);
        }
    });

    // Initial check
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const isUserAdmin = user.email === ADMIN_EMAIL;
             const profile: User = {
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || (isUserAdmin ? 'المدير العام' : 'مشجع'),
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
                joinDate: user.created_at || new Date().toISOString(),
                password: '',
            };
            setCurrentUser(profile);
            setIsAdmin(isUserAdmin);
        }
    }
    checkUser();

    return () => subscription.unsubscribe();
  }, [supabaseConfig]);

  const toggleFollow = (teamName: string) => {
     setFollowedTeams(prev => {
        const next = prev.includes(teamName) ? prev.filter(t => t !== teamName) : [...prev, teamName];
        localStorage.setItem('goolzon_followed', JSON.stringify(next));
        return next;
     });
  };

  const login = async (email: string, pass: string) => {
    const supabase = getSupabase(supabaseConfig.url, supabaseConfig.anonKey);
    const isAdminAttempt = email === ADMIN_EMAIL;

    // Case 1: Supabase is configured
    if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
        }
        return { success: true, isAdmin: isAdminAttempt };
    }
    
    // Case 2: Supabase is NOT configured - Admin Fallback Login
    if (isAdminAttempt && pass === 'admin123') {
        console.warn("Performing local fallback login for admin setup.");
        const adminProfile: User = {
            id: 'local-admin',
            email: ADMIN_EMAIL,
            name: 'المدير (إعداد)',
            username: 'admin_setup',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`,
            joinDate: new Date().toISOString(),
            password: '',
        };
        setCurrentUser(adminProfile);
        setIsAdmin(true);
        return { success: true, isAdmin: true };
    }

    // Case 3: Supabase is NOT configured - Regular User
    return { success: false, error: 'النظام غير مهيأ حالياً. يرجى مراجعة مسؤول الموقع.' };
  };

  const register = async (data: Partial<User>) => {
    const supabase = getSupabase(supabaseConfig.url, supabaseConfig.anonKey);
    if (!supabase) return { success: false, error: 'النظام غير مهيأ حالياً. يرجى مراجعة مسؤول الموقع.' };
    
    if (!data.email || !data.password) return { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان.' };

    const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                name: data.name,
                username: data.username,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`
            }
        }
    });

    if (error) {
        if (error.message.includes('unique constraint')) {
            return { success: false, error: 'هذا البريد الإلكتروني مسجل مسبقًا.' };
        }
        return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    const supabase = getSupabase(supabaseConfig.url, supabaseConfig.anonKey);
    // Sign out from Supabase only if it's configured and the user isn't the local admin
    if (supabase && currentUser && currentUser.id !== 'local-admin') {
      await supabase.auth.signOut();
    }
    // Always clear local state
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const value = { currentUser, isAdmin, login, register, logout, followedTeams, toggleFollow };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
