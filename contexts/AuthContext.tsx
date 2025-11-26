import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, pass: string) => boolean;
  register: (userData: Partial<User>) => boolean;
  logout: () => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('goolzon_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [followedTeams, setFollowedTeams] = useState<string[]>(() => {
    const saved = localStorage.getItem('goolzon_followed');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFollow = (teamName: string) => {
     setFollowedTeams(prev => {
        const next = prev.includes(teamName) ? prev.filter(t => t !== teamName) : [...prev, teamName];
        localStorage.setItem('goolzon_followed', JSON.stringify(next));
        return next;
     });
  };

  const login = (username: string, pass: string): boolean => {
    if (pass.length < 3) return false;

    if (username.toLowerCase() === 'admin' && pass === 'admin123') {
        const adminUser: User = {
            id: 'admin-001',
            name: 'المدير العام',
            username: 'admin',
            email: 'admin@gulfsports.dev',
            password: '', 
            joinDate: new Date().toISOString(),
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=10b981&textColor=ffffff'
        };
        setCurrentUser(adminUser);
        localStorage.setItem('goolzon_user', JSON.stringify(adminUser));
        return true;
    }

    const user: User = {
        id: Date.now().toString(),
        name: 'مشجع خليجي',
        username: username,
        email: `${username}@example.com`,
        password: '',
        joinDate: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };
    setCurrentUser(user);
    localStorage.setItem('goolzon_user', JSON.stringify(user));
    return true;
  };

  const register = (data: Partial<User>): boolean => {
      if (data.username?.toLowerCase() === 'admin') {
          return false;
      }
      const user: User = {
          id: Date.now().toString(),
          name: data.name || 'User',
          username: data.username || 'user',
          email: data.email || 'user@mail.com',
          password: '',
          joinDate: new Date().toISOString(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`
      };
      setCurrentUser(user);
      localStorage.setItem('goolzon_user', JSON.stringify(user));
      return true;
  };

  const logout = () => {
      setCurrentUser(null);
      localStorage.removeItem('goolzon_user');
  };

  const value = { currentUser, login, register, logout, followedTeams, toggleFollow };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};