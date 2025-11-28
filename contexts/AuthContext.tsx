
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getSupabase } from '../services/supabaseClient';

// هذا هو البريد الإلكتروني الخاص بالمدير الرئيسي
// قم بتسجيل حساب جديد بهذا البريد ليكون مديراً تلقائياً
const MASTER_ADMIN_EMAIL = 'admin@goolzon.com';

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setCurrentUser(null);
        setIsAdmin(false);
        setProfileLoading(false);
        return;
      }

      const user = session.user;
      const email = user.email;
      const isMasterAdmin = email === MASTER_ADMIN_EMAIL;

      // === تجاوز قاعدة البيانات للمدير العام ===
      // إذا كان البريد هو بريد المدير، نعطيه الصلاحيات فوراً دون النظر لقاعدة البيانات
      if (isMasterAdmin) {
          setIsAdmin(true);
          setCurrentUser({
                id: user.id,
                email: email || "",
                name: "المدير العام",
                username: "admin",
                avatar: "", // لا صورة افتراضية من القاعدة
                role: "admin",
                joinDate: new Date().toISOString()
          });
          setProfileLoading(false);
          return; // نخرج هنا ولا نكمل البحث في قاعدة البيانات
      }

      // للمستخدمين العاديين، نبحث في قاعدة البيانات
      setIsAdmin(false); // افتراضياً ليس مديراً

      try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (data) {
             setCurrentUser({
                id: user.id,
                email: email || "",
                name: data.name || "مشجع",
                username: data.username || "user",
                avatar: data.avatar,
                role: "user", // دائماً مستخدم عادي إذا لم يكن الإيميل الرئيسي
                joinDate: data.created_at || new Date().toISOString()
             });
             
             if (data.dream_squad) setDreamSquad(data.dream_squad);
             if (data.followed_teams) setFollowedTeams(data.followed_teams);

          } else {
             // إذا لم يوجد بروفايل في القاعدة، ننشئ مستخدم محلي مؤقت
             setCurrentUser({
                id: user.id,
                email: email || "",
                name: "User",
                username: "user",
                role: "user",
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    
    // التحقق الفوري من المدير
    if (email === MASTER_ADMIN_EMAIL) {
        return { success: true, isAdmin: true };
    }
    
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
    
    // نحاول إنشاء بروفايل، لكن لا نوقف العملية إذا فشل (بسبب عدم وجود الجدول مثلاً)
    if (data.user) {
        try {
            await supabase.from('profiles').insert([{
                id: data.user.id,
                name: userData.name,
                username: userData.username,
                role: 'user', // الجميع مستخدمون، المدير يحدد بالإيميل فقط
                email: userData.email
            }]);
        } catch (e) {
            console.warn("Profile creation skipped/failed, likely no table. Login will still work.");
        }
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
    if (supabase && currentUser && !isAdmin) { // لا نحاول التحديث للمدير إذا لم يكن له سجل
      supabase.from('profiles').update({ followed_teams: newFollows }).eq('id', currentUser.id).then();
    }
  };

  const updateDreamSquad = (squad: any) => {
    setDreamSquad(squad);
    localStorage.setItem('goolzon_dream_squad', JSON.stringify(squad));

    const supabase = getSupabase();
    if (supabase && currentUser && !isAdmin) {
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
