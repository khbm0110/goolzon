'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search, Trophy, Youtube, Calendar, User as UserIcon, LogIn, LogOut, Shield, Sun, Moon, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SearchModal from './SearchModal';
import NotificationsPanel from './NotificationsPanel';
import { data } from '@/lib/data';
import type { Article } from '@/types';

const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/' },
  { label: 'مركز النتائج', path: '/scores' },
  { label: 'الأندية', path: '/clubs' },
  { label: 'دوري الأبطال', path: '/country/champions-league' },
  { label: 'الدوري الإنجليزي', path: '/country/england' },
  { label: 'الدوري الإسباني', path: '/country/spain' },
  { label: 'الدوري السعودي', path: '/country/saudi' },
  { label: 'الدوري الإماراتي', path: '/country/uae' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    data.getArticles().then(setArticles);
  }, []);

  // Close the account dropdown on outside click, and whenever the route changes.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    router.push('/');
  };

  return (
    <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Menu Button */}
          <button className="lg:hidden text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 space-x-reverse group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-700 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform relative">
              <Trophy className="text-[var(--fg)]" size={20} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-[var(--fg)] leading-none">
                gool<span className="text-primary">zon</span>
              </span>
              <span className="text-[10px] text-[var(--fg-subtle)] tracking-widest font-bold">نبض الكرة العالمية</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-4 space-x-reverse overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-bold whitespace-nowrap transition-colors duration-200 ${
                  pathname === item.path
                    ? 'text-primary border-b-2 border-primary py-5'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] py-5 border-b-2 border-transparent'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center gap-1 ${
                  pathname?.startsWith('/admin')
                    ? 'text-red-500 border-b-2 border-red-500 py-5'
                    : 'text-[var(--fg-muted)] hover:text-red-400 py-5 border-b-2 border-transparent'
                }`}
              >
                <Shield size={14} /> لوحة التحكم
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <button onClick={toggleTheme} className="text-[var(--fg-muted)] hover:text-primary transition-colors hidden sm:block" title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الليلي'}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <NotificationsPanel />

            <Link href="/leaderboard" className="text-[var(--fg-muted)] hover:text-accent transition-colors hidden sm:block" title="ترتيب المتوقعين">
              <Trophy size={20} />
            </Link>

            <Link href="/matches" className="text-[var(--fg-muted)] hover:text-primary transition-colors hidden sm:block" title="المباريات">
              <Calendar size={20} />
            </Link>

            <Link href="/videos" className="text-[var(--fg-muted)] hover:text-red-500 transition-colors hidden sm:block" title="فيديو">
              <Youtube size={20} />
            </Link>

            <button onClick={() => setIsSearchOpen(true)} className="text-[var(--fg-muted)] hover:text-primary transition-colors" title="بحث">
              <Search size={20} />
            </button>

            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 pr-0.5 pl-1.5 py-0.5 rounded-full bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors border border-[var(--border)]"
                  title={currentUser.name}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-[var(--bg-surface-3)] flex items-center justify-center flex-shrink-0 relative">
                    {currentUser.avatar ? (
                      <Image src={currentUser.avatar} alt={currentUser.username} fill sizes="28px" className="object-cover" />
                    ) : (
                      <UserIcon size={14} />
                    )}
                  </div>
                  <ChevronDown size={14} className={`hidden sm:block transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="p-3 border-b border-[var(--border-subtle)]">
                      <p className="text-sm font-bold text-[var(--fg)] truncate">{currentUser.name}</p>
                      <p className="text-xs text-[var(--fg-faint)] truncate">@{currentUser.username}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href={isAdmin ? '/admin' : '/profile'}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-[var(--fg-muted)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--fg)] transition-colors"
                      >
                        {isAdmin ? <Shield size={16} /> : <UserIcon size={16} />}
                        {isAdmin ? 'لوحة التحكم' : 'الملف الشخصي'}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-[var(--fg-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      >
                        <LogOut size={16} />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition-colors border border-primary/30"
              >
                <LogIn size={14} className="ml-1" />
                دخول
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.path ? 'bg-[var(--bg-surface-2)] text-[var(--fg)]' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--fg)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-[var(--border-subtle)] my-2 pt-2">
              {currentUser ? (
                <Link href={isAdmin ? '/admin' : '/profile'} onClick={() => setIsOpen(false)} className="block px-3 py-2 text-primary font-bold">
                  مرحباً، {currentUser.name}
                </Link>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)] font-bold flex items-center gap-2">
                  <LogIn size={16} className="text-primary" />
                  تسجيل الدخول
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-red-400 hover:text-red-300 font-bold flex items-center gap-2">
                  <Shield size={16} /> لوحة التحكم
                </Link>
              )}
              <Link href="/matches" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)]">مباريات اليوم</Link>
              <Link href="/leaderboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)]">ترتيب المتوقعين</Link>
              <Link href="/videos" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)]">فيديو</Link>
              <button onClick={toggleTheme} className="w-full text-right px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-2">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الليلي'}
              </button>
              <Link href="/clubs" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)]">الأندية</Link>
              <Link href="/topscorers" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)]">الهدافون</Link>
              <Link href="/compare" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)]">مقارنة الفرق</Link>
              {currentUser && (
                <button onClick={handleLogout} className="w-full text-right px-3 py-2 text-red-500 hover:text-red-400 font-bold flex items-center gap-2 border-t border-[var(--border-subtle)] mt-2 pt-3">
                  <LogOut size={16} /> تسجيل الخروج
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} articles={articles} />
    </header>
  );
}
