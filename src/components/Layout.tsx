import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from './Header';
import MatchTicker from './MatchTicker';
import SearchModal from './SearchModal';
import MatchCenterModal from './MatchCenterModal';
import SponsorsBanner from './SponsorsBanner';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { useSettings } from '../contexts/SettingsContext';
import { Trophy, Home, Calendar, Users, PlayCircle } from 'lucide-react';

const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { articles, matches } = useData();
  const { selectedMatch, setSelectedMatch } = useUI();
  const { featureFlags } = useSettings();
  const location = useLocation();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const bottomNavItems = [
    { label: 'الرئيسية', path: '/', icon: Home },
    { label: 'المباريات', path: '/matches', icon: Calendar, hidden: !featureFlags.matches },
    { label: 'تشكيلتي', path: '/profile', icon: Users },
    { label: 'فيديو', path: '/videos', icon: PlayCircle, hidden: !featureFlags.videos },
  ].filter(item => !item.hidden);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary selection:text-slate-900">
      <Header 
        onSearchClick={() => setIsSearchOpen(true)} 
      />
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        articles={articles}
      />
      <MatchCenterModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      
      {featureFlags.matches && <MatchTicker matches={matches} onMatchClick={setSelectedMatch} />}
      
      {/* Added pb-20 to ensure content isn't hidden behind the bottom nav on mobile */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>

      <SponsorsBanner />

      <footer className="bg-slate-900 border-t border-slate-800 py-12 mt-0 mb-16 md:mb-0">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-4">
                 <Trophy className="text-primary" size={24} />
                 <span className="text-2xl font-black text-white">gool<span className="text-primary">zon</span></span>
               </div>
               <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                 المنصة الرياضية الأولى في الخليج العربي. تغطية شاملة للدوريات السعودية، الإماراتية، القطرية، الكويتية، العمانية، والبحرينية.
                 نقدم الخبر بدقة، والتحليل بعمق، والمتعة بجودة عالية.
               </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">الأقسام</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link></li>
                <li><Link to="/matches" className="hover:text-primary transition-colors">مباريات اليوم</Link></li>
                <li><Link to="/videos" className="hover:text-primary transition-colors">فيديو</Link></li>
                <li><Link to="/analysis" className="hover:text-primary transition-colors">مقالات وتحليلات</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-primary transition-colors">للإعلان معنا</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">اتصل بنا</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} goolzon. جميع الحقوق محفوظة.</p>
            <p className="mt-2 md:mt-0">صنع بشغف للكرة الخليجية</p>
          </div>
          <div className="border-t border-slate-800/50 mt-8 pt-6 text-center">
             <p className="text-[10px] text-slate-600 max-w-3xl mx-auto leading-relaxed">
                إخلاء مسؤولية: موقع goolzon هو منصة إخبارية ومجتمعية مستقلة. جميع أسماء الأندية، الشعارات، والعلامات التجارية المعروضة في الموقع هي ملكية حصرية لأصحابها المعنيين وتستخدم هنا لأغراض التعريف والإخبار فقط بموجب مبدأ الاستخدام العادل. نحن لا ندعي أي علاقة رسمية مع أي من الأندية أو الاتحادات الرياضية المذكورة إلا إذا نص على ذلك صراحة.
             </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50 md:hidden pb-safe">
         <div className="flex justify-around items-center h-16">
            {bottomNavItems.map((item) => {
               const isActive = location.pathname === item.path;
               return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                     <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                     </div>
                     <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-slate-500'}`}>{item.label}</span>
                  </Link>
               );
            })}
         </div>
      </div>
    </div>
  );
};

export default Layout;