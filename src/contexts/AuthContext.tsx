
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// المدير الافتراضي للنسخة التجريبية
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
    const savedUser = localStorage.getItem('goolzon_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAdmin(user.email === MASTER_ADMIN_EMAIL);
    }

    const savedFollows = localStorage.getItem('goolzon_followed_teams');
    if (savedFollows) setFollowedTeams(JSON.parse(savedFollows));

    const savedSquad = localStorage.getItem('goolzon_dream_squad');
    if (savedSquad) setDreamSquad(JSON.parse(savedSquad));
    
    setProfileLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // محاكاة تسجيل الدخول (يقبل أي بريد وكلمة مرور)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password.length < 4) return { success: false, error: "كلمة المرور قصيرة جداً" };

    const isAdminUser = email === MASTER_ADMIN_EMAIL;
    
    const user: User = {
        id: 'mock-user-id',
        email,
        name: isAdminUser ? 'المدير العام' : 'مستخدم تجريبي',
        username: isAdminUser ? 'admin' : 'demo_user',
        role: isAdminUser ? 'admin' : 'user',
        joinDate: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };

    setCurrentUser(user);
    setIsAdmin(isAdminUser);
    localStorage.setItem('goolzon_user', JSON.stringify(user));

    return { success: true, isAdmin: isAdminUser }; 
  };

  const register = async (userData: any) => {
    // محاكاة التسجيل محلياً
    await new Promise(resolve => setTimeout(resolve, 500));

    const user: User = {
        id: `user-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        username: userData.username,
        role: 'user',
        joinDate: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`
    };

    setCurrentUser(user);
    setIsAdmin(false);
    localStorage.setItem('goolzon_user', JSON.stringify(user));
    
    return { success: true };
  };

  const logout = async () => {
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('goolzon_user');
  };

  const toggleFollow = (team: string) => {
    const newFollows = followedTeams.includes(team)
      ? followedTeams.filter(t => t !== team)
      : [...followedTeams, team];
    
    setFollowedTeams(newFollows);
    localStorage.setItem('goolzon_followed_teams', JSON.stringify(newFollows));
  };

  const updateDreamSquad = (squad: any) => {
    setDreamSquad(squad);
    localStorage.setItem('goolzon_dream_squad', JSON.stringify(squad));
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
