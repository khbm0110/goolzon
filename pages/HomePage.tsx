

import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { useSettings } from '../contexts/SettingsContext';
import NewsCard from '../components/NewsCard';
import StandingsWidget from '../components/StandingsWidget';
import TeamLogo from '../components/TeamLogo';
import { NewsCardSkeleton, MatchRowSkeleton } from '../components/Skeletons';
import { Category } from '../types';
import { 
  TrendingUp, 
  ChevronLeft,
  Loader2,
  PlayCircle
} from 'lucide-react';
import { POPULAR_CLUBS } from '../constants';

const SectionHeader: React.FC<{ title: string; link?: string }> = ({ title, link }) => (
  <div className="flex items-center justify-between mb-4 border-r-4 border-primary pr-3 bg-gradient-to-l from-slate-900 to-transparent p-2 rounded-r">
    <h2 className="text-xl font-black text-white">{title}</h2>
    {link && (
      <Link to={link} className="text-xs text-primary hover:text-emerald-400 flex items-center transition-colors font-bold">
        المزيد <ChevronLeft size={14} />
      </Link>
    )}
  </div>
);

const HomePage: React.FC = () => {
  const { articles, matches, standings, isLoadingInitial } = useData();
  const { isAIGenerating, setSelectedMatch } = useUI();
  const { featureFlags } = useSettings();
  
  const breakingNews = articles.filter(a => a.isBreaking);
  const featuredArticle = breakingNews.length > 0 ? breakingNews[0] : articles[0];
  const latestNews = articles.filter(a => a.id !== featuredArticle?.id && a.category !== Category.VIDEO).slice(0, 6);
  const videoArticles = articles.filter(a => a.category === Category.VIDEO).slice(0, 3);
  
  const displayMatches = matches;
  const displayStandings = standings;

  const leagueSections = [
    { key: Category.ENGLAND, title: 'الدوري الإنجليزي', link: '/country/england' },
    { key: Category.SPAIN, title: 'الدوري الإسباني', link: '/country/spain' },
    { key: Category.SAUDI, title: 'الدوري السعودي', link: '/country/saudi' },
    { key: Category.UAE, title: 'الكرة الإماراتية', link: '/country/uae' },
  ];

  return (
    <div className="pb-12">
      {isAIGenerating && featureFlags.autopilot && (
        <div className="bg-emerald-900/20 border-b border-emerald-900/50 py-2 transition-all duration-500">
           <div className="container mx-auto px-4 flex items-center justify-center text-xs text-emerald-400 font-bold animate-pulse">
              <Loader2 size={12} className="mr-2 animate-spin" />
              غرفة الأخبار الذكية تعمل الآن: جاري البحث عن أخبار حصرية، صور عالية الجودة، وتوليد المقالات...
           </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
             {isLoadingInitial ? (
                <NewsCardSkeleton featured={true} />
             ) : (
                featuredArticle ? <NewsCard article={featuredArticle} featured={true} /> : <div className="h-full w-full bg-slate-900 rounded-xl flex items-center justify-center text-slate-500">لا توجد مقالات لعرضها.</div>
             )}
           </div>
           <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full">
                 <h3 className="font-bold text-white mb-4 text-sm flex items-center border-b border-slate-800 pb-2">
                   <TrendingUp size={16} className="ml-2 text-primary" />
                   الأكثر قراءة
                 </h3>
                 <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
                   {isLoadingInitial ? (
                      Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex gap-3 items-center">
                            <div className="w-6 h-6 bg-slate-800 rounded animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 bg-slate-800 rounded animate-pulse" />
                                <div className="h-3 w-full bg-slate-800 rounded animate-pulse" />
                            </div>
                        </div>
                      ))
                   ) : (
                       articles.slice(1, 6).sort((a,b) => b.views - a.views).map((article, idx) => (
                         <Link key={idx} to={`/article/${article.id}`} className="flex gap-3 group items-start">
                           <span className="text-2xl font-black text-slate-700 group-hover:text-primary transition-colors leading-none mt-1">{idx + 1}</span>
                           <div>
                             <span className="text-[10px] text-primary mb-1 block">{article.category}</span>
                             <h4 className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{article.title}</h4>
                           </div>
                         </Link>
                       ))
                   )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 container mx-auto px-4">
        <div className={`space-y-12 ${featureFlags.matches ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
           <section>
             <SectionHeader title="آخر الأخبار" />
             <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {isLoadingInitial ? (
                  Array(6).fill(0).map((_, i) => <NewsCardSkeleton key={i} />)
               ) : (
                  latestNews.map(article => (
                    <NewsCard key={article.id} article={article} />
                  ))
               )}
             </div>
           </section>

           {featureFlags.clubs && (
             <section>
                <SectionHeader title="أشهر الأندية" />
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {POPULAR_CLUBS.map((club) => (
                    <Link key={club.id} to={`/club/${club.id}`} className="flex flex-col items-center justify-center bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-primary/50 transition-all hover:-translate-y-1 group">
                      <div className="w-16 h-16 mb-3 relative flex items-center justify-center">
                         <div className="absolute inset-0 bg-primary/5 rounded-full filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <TeamLogo src={club.logo} alt={club.name} className="w-14 h-14 object-contain z-10 drop-shadow-lg" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center truncate w-full">{club.name}</span>
                      <span className="text-[10px] text-slate-500 mt-1 bg-slate-950 px-2 py-0.5 rounded-full">{club.country}</span>
                    </Link>
                  ))}
                </div>
             </section>
           )}

           {featureFlags.videos && videoArticles.length > 0 && (
             <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-slate-900"></div>
               <SectionHeader title="فيديو وملخصات" link="/videos" />
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {videoArticles.map(article => (
                   <Link to={`/article/${article.id}`} key={article.id} className="group cursor-pointer">
                     <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-slate-950">
                       <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <PlayCircle size={24} className="text-white ml-1" />
                         </div>
                       </div>
                     </div>
                     <h3 className="text-sm font-bold text-white group-hover:text-red-500 transition-colors line-clamp-2">{article.title}</h3>
                   </Link>
                 ))}
               </div>
             </section>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {leagueSections.map((section) => {
                const sectionArticles = articles.filter(a => a.category === section.key).slice(0, 3);
                if (sectionArticles.length === 0 && !isLoadingInitial) return null;

                return (
                  <section key={section.key} className="bg-slate-900/30 rounded-xl p-4 border border-slate-800/50">
                    <SectionHeader title={section.title} link={section.link} />
                    <div className="space-y-4">
                      {isLoadingInitial ? Array(3).fill(0).map((_, i) => <NewsCardSkeleton key={i} compact/>)
                       : sectionArticles.map(article => (
                        <NewsCard key={article.id} article={article} compact={true} />
                      ))}
                    </div>
                  </section>
                );
              })}
           </div>
        </div>

        {featureFlags.matches && (
          <div className="lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              <StandingsWidget standings={displayStandings} />
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                 <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">مباريات اليوم</h3>
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">مباشر</span>
                 </div>
                 <div className="divide-y divide-slate-800">
                   {isLoadingInitial && displayMatches.length === 0 ? (
                      Array(5).fill(0).map((_, i) => <MatchRowSkeleton key={i} />)
                   ) : displayMatches.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                          لا توجد مباريات جارية اليوم
                      </div>
                   ) : (
                       displayMatches.slice(0, 5).map(match => (
                         <div key={match.id} onClick={() => setSelectedMatch(match)} className="p-3 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                           <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                             <span>{match.league}</span>
                             <span className={match.status === 'LIVE' ? 'text-red-500 font-bold' : ''}>{match.time}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 w-1/3">
                                <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-6 h-6" />
                                <span className="text-xs font-bold text-slate-200 truncate group-hover:text-primary transition-colors">{match.homeTeam}</span>
                              </div>
                              <div className="font-mono font-bold text-accent text-lg">
                                {match.status === 'UPCOMING' ? <span className="text-slate-600 text-sm">vs</span> : `${match.scoreHome} - ${match.scoreAway}`}
                              </div>
                              <div className="flex items-center gap-2 flex-row-reverse w-1/3">
                                <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-6 h-6" />
                                <span className="text-xs font-bold text-slate-200 truncate group-hover:text-primary transition-colors">{match.awayTeam}</span>
                              </div>
                           </div>
                         </div>
                       ))
                   )}
                   <div className="p-2 text-center bg-slate-800/50">
                      <Link to="/matches" className="text-xs text-primary font-bold block w-full py-1 hover:text-white transition-colors">عرض كل المباريات</Link>
                   </div>
                 </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-center border border-indigo-800/50">
                <h3 className="text-white font-bold mb-2">حمل تطبيقنا</h3>
                <p className="text-slate-400 text-xs mb-4">تابع أخبار ناديك المفضل لحظة بلحظة</p>
                <button className="bg-white text-indigo-900 w-full py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors">قريباً</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;