import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Player } from '../types';
import { getSupabase } from '../services/supabaseClient';

const ADMIN_EMAIL = 'admin@goolzon.dev';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  profileLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
  register: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  followedTeams: string[];
  toggleFollow: (teamName: string) => Promise<void>;
  dreamSquad: Record<number, Player & { clubLogo?: string }>;
  updateDreamSquad: (squad: Record<number, Player & { clubLogo?: string }>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);
  const [dreamSquad, setDreamSquad] = useState<Record<number, Player & { clubLogo?: string }>>({});

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
        setProfileLoading(false);
        // Fallback for local admin without Supabase
        if (currentUser?.id === 'local-admin') {
            setIsAdmin(true);
        } else {
            setCurrentUser(null);
            setIsAdmin(false);
        }
        return;
    }

    const manageUserProfile = async (authUser: any) => {
        setProfileLoading(true);
        const isUserAdmin = authUser.email === ADMIN_EMAIL;
        
        // 1. Check for an existing profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
        
        let finalProfileData = profileData;

        // 2. If no profile exists, create one
        if (profileError && profileError.code === 'PGRST116') { // 'PGRST116' is Supabase code for "Not Found"
            console.log("No profile found for user, creating one...");
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({ 
                    id: authUser.id, 
                    email: authUser.email, 
                    name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
                    username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
                    avatar: authUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
                    followed_teams: [],
                    dream_squad: {}
                })
                .select()
                .single();
            
            if (createError) {
                console.error("Error creating user profile:", createError);
                setProfileLoading(false);
                return;
            }
            finalProfileData = newProfile;
        }

        // 3. Set application state from profile
        if (finalProfileData) {
             const appUser: User = {
                id: authUser.id,
                email: authUser.email || '',
                name: finalProfileData.name || (isUserAdmin ? 'المدير العام' : 'مشجع'),
                username: finalProfileData.username || 'user',
                avatar: finalProfileData.avatar,
                joinDate: authUser.created_at || new Date().toISOString(),
                password: '',
            };
            setCurrentUser(appUser);
            setIsAdmin(isUserAdmin);
            setFollowedTeams(finalProfileData.followed_teams || []);
            setDreamSquad(finalProfileData.dream_squad || {});
        }
        setProfileLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setIsAdmin(false);
            setFollowedTeams([]);
            setDreamSquad({});
            setProfileLoading(false);
        } else if (session?.user) {
            manageUserProfile(session.user);
        } else {
            setProfileLoading(false); // No user session
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleFollow = async (teamName: string) => {
    const supabase = getSupabase();
    if (!supabase || !currentUser) return;

    const next = followedTeams.includes(teamName) 
        ? followedTeams.filter(t => t !== teamName) 
        : [...followedTeams, teamName];
    
    setFollowedTeams(next); // Optimistic update

    const { error } = await supabase
      .from('profiles')
      .update({ followed_teams: next })
      .eq('id', currentUser.id);

    if (error) {
        console.error("Error updating followed teams:", error);
        setFollowedTeams(followedTeams); // Revert on error
    }
  };
  
  const updateDreamSquad = async (squad: Record<number, Player & { clubLogo?: string }>) => {
    const supabase = getSupabase();
    if (!supabase || !currentUser) return;
    
    setDreamSquad(squad); // Optimistic update

    const { error } = await supabase
        .from('profiles')
        .update({ dream_squad: squad })
        .eq('id', currentUser.id);

    if (error) {
        console.error("Error updating dream squad:", error);
        // Optionally revert state
    }
  };


  const login = async (email: string, pass: string) => {
    const supabase = getSupabase();
    const isAdminAttempt = email === ADMIN_EMAIL;

    if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
        }
        // onAuthStateChange will handle setting the user state
        return { success: true, isAdmin: isAdminAttempt };
    }
    
    if (isAdminAttempt && pass === 'admin123') {
        const adminProfile: User = {
            id: 'local-admin',
            email: ADMIN_EMAIL, name: 'المدير (إعداد)', username: 'admin_setup',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`,
            joinDate: new Date().toISOString(), password: '',
        };
        setCurrentUser(adminProfile);
        setIsAdmin(true);
        setProfileLoading(false);
        return { success: true, isAdmin: true };
    }

    return { success: false, error: 'النظام غير مهيأ حالياً. يرجى مراجعة مسؤول الموقع.' };
  };

  const register = async (data: Partial<User>) => {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'النظام غير مهيأ حالياً.' };
    
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
        return { success: false, error: error.message.includes('unique constraint') ? 'هذا البريد الإلكتروني مسجل مسبقًا.' : error.message };
    }
    // onAuthStateChange will handle profile creation on first login
    return { success: true };
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase && currentUser && currentUser.id !== 'local-admin') {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const value = { 
      currentUser, isAdmin, profileLoading, login, register, logout, 
      followedTeams, toggleFollow,
      dreamSquad, updateDreamSquad
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};