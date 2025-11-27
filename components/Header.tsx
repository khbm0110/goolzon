
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, Trophy, Activity, Youtube, Calendar, Bell, User as UserIcon, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface HeaderProps {
  onSearchClick?: () => void;
  isAutopilotEnabled?: boolean;
  onToggleAutopilot?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { currentUser, followedTeams } = useAuth();
  const { featureFlags } = useSettings();

  const navItems = [
    { label: 'الرئيسية', path: '/' },
    { label: 'الأندية', path: '/clubs', hidden: !featureFlags.clubs },
    { label: 'دوري الأبطال', path: '/country/champions-league' },
    { label: 'الدوري الإنجليزي', path: '/country/england' },
    { label: 'الدوري الإسباني', path: '/country/spain' },
    { label: 'الدوري السعودي', path: '/country/saudi' },
    { label: 'الدوري الإماراتي', path: '/country/uae' },
    { label: 'تحليلات', path: '/analysis', hidden: !featureFlags.analysis },
  ].filter(item => !item.hidden);

  return (
    <header className="bg-secondary border-b border-slate-800 sticky top-0 z-50 shadow-lg shadow-slate-950/50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex justify-between items-center h-16">
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-slate-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 space-x-reverse group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-700 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform relative">
               <Trophy className="text-white" size={20} />
               <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white leading-none">gool<span className="text-primary">zon</span></span>
              <span className="text-10px text-slate-400 tracking-widest font-bold">نبض الكرة العالمية</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-4 space-x-reverse overflow-x-auto no-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-bold whitespace-nowrap transition-colors duration-200 ${
                  location.pathname === item.path 
                    ? 'text-primary border-b-2 border-primary py-5' 
                    : 'text-slate-300 hover:text-white py-5 border-b-2 border-transparent'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3 space-x-reverse">
             {/* Notifications */}
             <div className="relative group cursor-pointer hidden sm:block">
                <Bell size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                {followedTeams.length > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-slate-900"></span>
                   </span>
                )}
             </div>

            {featureFlags.matches && (
                 <Link to="/matches" className="text-slate-300 hover:text-primary transition-colors hidden sm:block" title="المباريات">
                  <Calendar size={20} />
                </Link>
            )}
            
            {featureFlags.videos && (
                <Link to="/videos" className="text-slate-300 hover:text-red-500 transition-colors hidden sm:block" title="فيديو">
                  <Youtube size={20} />
                </Link>
            )}

            <button 
              onClick={onSearchClick}
              className="text-slate-300 hover:text-primary transition-colors"
            >
              <Search size={20} />
            </button>
            
            {featureFlags.userSystem && (
              currentUser ? (
                <Link 
                  to="/profile" 
                  className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 overflow-hidden"
                  title="الملف الشخصي"
                >
                  {currentUser.avatar ? <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover"/> : <UserIcon size={16} />}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:flex items-center px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition-colors border border-primary/30"
                >
                  <LogIn size={14} className="ml-1" />
                  دخول
                </Link>
              )
            )}

            <Link 
              to="/admin" 
              className="hidden md:flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-bold text-slate-200 transition-colors border border-slate-700"
            >
              <Activity size={14} className="ml-2" />
              النشر
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === item.path
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-800 my-2 pt-2">
                {featureFlags.userSystem && (
                  currentUser ? (
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-slate-300 hover:text-white font-bold text-primary">
                      مرحباً، {currentUser.name}
                    </Link>
                  ) : (
                    <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-slate-300 hover:text-white">
                      تسجيل الدخول
                    </Link>
                  )
                )}
                {featureFlags.matches && <Link to="/matches" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-slate-300 hover:text-white">مباريات اليوم</Link>}
                {featureFlags.videos && <Link to="/videos" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-slate-300 hover:text-white">فيديو</Link>}
                {featureFlags.clubs && <Link to="/clubs" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-slate-300 hover:text-white">الأندية</Link>}
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-accent">لوحة التحكم</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
