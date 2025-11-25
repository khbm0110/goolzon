
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import Header from './components/Header';
import MatchTicker from './components/MatchTicker';
import NewsCard from './components/NewsCard';
import TeamLogo from './components/TeamLogo';
import StandingsWidget from './components/StandingsWidget';
import SearchModal from './components/SearchModal';
import MatchCenterModal from './components/MatchCenterModal';
import AdminDashboard from './components/AdminDashboard';
import ClubDashboard from './components/ClubDashboard';
import UserProfile from './components/UserProfile';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { NewsCardSkeleton, MatchRowSkeleton } from './components/Skeletons';
import { Article, Category, Match, Standing, ClubProfile, Player, User, FeatureFlags, ApiConfig } from './types';
import { INITIAL_ARTICLES, INITIAL_MATCHES, INITIAL_STANDINGS, GULF_CLUBS, CLUB_DATABASE } from './constants';
import { generateArticleContent } from './services/geminiService';
import { getSmartImageUrl } from './services/imageService';
import { fetchLiveMatches, fetchStandings } from './services/apiFootball';
import { 
  TrendingUp, 
  Trophy, 
  Users, 
  Calendar,
  PlayCircle,
  Clock,
  ChevronLeft,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Flame,
  MessageCircle
} from 'lucide-react';

// --- Configuration ---
// Auto-Pilot Interval: Every 5 minutes (300,000ms) to ensure steady flow without overwhelming quota
const AUTOPILOT_INTERVAL = 300000; 
// Match Sync Interval: Every 60 seconds
const MATCH_SYNC_INTERVAL = 60000;

// --- Context for Global State ---
interface AppContextType {
  articles: Article[];
  addArticle: (article: Article) => void;
  matches: Match[];
  standings: Standing[];
  clubs: ClubProfile[];
  addClub: (club: ClubProfile) => void;
  updateClub: (club: ClubProfile) => void;
  deleteClub: (id: string) => void;
  transferPlayer: (playerId: string, sourceClubId: string, targetClubId: string, price: number) => void; // New Transfer Logic
  isAIGenerating: boolean;
  lastAIUpdate: Date | null;
  selectedMatch: Match | null;
  setSelectedMatch: (match: Match | null) => void;
  isLoadingInitial: boolean;
  isAutopilot: boolean;
  toggleAutopilot: () => void;
  followedTeams: string[];
  toggleFollow: (teamName: string) => void;
  // Auth
  currentUser: User | null;
  login: (username: string, pass: string) => boolean;
  register: (userData: Partial<User>) => boolean;
  logout: () => void;
  // Features & Settings
  featureFlags: FeatureFlags;
  setFeatureFlag: (key: keyof FeatureFlags, value: boolean) => void;
  apiConfig: ApiConfig;
  setApiConfig: (config: ApiConfig) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

// --- Helper Components ---
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

// --- Pages ---

const HomePage: React.FC = () => {
  const { articles, matches, standings, clubs, isAIGenerating, setSelectedMatch, isLoadingInitial, featureFlags, apiConfig } = useApp();
  
  const breakingNews = articles.filter(a => a.isBreaking);
  const featuredArticle = breakingNews.length > 0 ? breakingNews[0] : articles[0];
  const latestNews = articles.filter(a => a.id !== featuredArticle?.id && a.category !== Category.VIDEO).slice(0, 6);
  const videoArticles = articles.filter(a => a.category === Category.VIDEO).slice(0, 3);
  
  // DETERMINE DISPLAY MATCHES
  const hasApiKey = Boolean(apiConfig.keys.matches);
  const displayMatches = hasApiKey ? matches : INITIAL_MATCHES;

  // Country specific categories for display
  const countrySections = [
    { key: Category.SAUDI, title: 'الدوري السعودي', link: '/country/saudi' },
    { key: Category.UAE, title: 'الكرة الإماراتية', link: '/country/uae' },
    { key: Category.QATAR, title: 'نجوم قطر', link: '/country/qatar' },
    { key: Category.KUWAIT, title: 'الكرة الكويتية', link: '/country/kuwait' },
    { key: Category.OMAN, title: 'الدوري العماني', link: '/country/oman' },
    { key: Category.BAHRAIN, title: 'الكرة البحرينية', link: '/country/bahrain' },
  ];

  return (
    <div className="pb-12">
      {/* AI Status Notification */}
      {isAIGenerating && featureFlags.autopilot && (
        <div className="bg-emerald-900/20 border-b border-emerald-900/50 py-2 transition-all duration-500">
           <div className="container mx-auto px-4 flex items-center justify-center text-xs text-emerald-400 font-bold animate-pulse">
              <Loader2 size={12} className="mr-2 animate-spin" />
              غرفة الأخبار الذكية تعمل الآن: جاري البحث عن أخبار حصرية، صور عالية الجودة، وتوليد المقالات...
           </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
             {isLoadingInitial ? (
                <NewsCardSkeleton featured={true} />
             ) : (
                featuredArticle && <NewsCard article={featuredArticle} featured={true} />
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
                       latestNews.slice(0, 5).map((article, idx) => (
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
        
        {/* Main Content */}
        <div className={`space-y-12 ${featureFlags.matches ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
           
           {/* Latest News Grid */}
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

            {/* Gulf Clubs Section - UPDATED TO LINK TO DASHBOARDS */}
           {featureFlags.clubs && (
             <section>
                <SectionHeader title="أندية الخليج" />
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {clubs.map((club) => (
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

           {/* Videos Section */}
           {featureFlags.videos && videoArticles.length > 0 && (
             <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-slate-900"></div>
               <SectionHeader title="فيديو وملخصات" link="/videos" />
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {videoArticles.map(article => (
                   <div key={article.id} className="group cursor-pointer">
                     <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-slate-950">
                       <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <PlayCircle size={24} className="text-white ml-1" />
                         </div>
                       </div>
                     </div>
                     <h3 className="text-sm font-bold text-white group-hover:text-red-500 transition-colors line-clamp-2">{article.title}</h3>
                   </div>
                 ))}
               </div>
             </section>
           )}

           {/* Country Specific Blocks Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {countrySections.map((section) => {
                const sectionArticles = articles.filter(a => a.category === section.key).slice(0, 3);
                if (sectionArticles.length === 0) return null;

                return (
                  <section key={section.key} className="bg-slate-900/30 rounded-xl p-4 border border-slate-800/50">
                    <SectionHeader title={section.title} link={section.link} />
                    <div className="space-y-4">
                      {sectionArticles.map(article => (
                        <NewsCard key={article.id} article={article} compact={true} />
                      ))}
                    </div>
                  </section>
                );
              })}
           </div>
        </div>

        {/* Sidebar - Matches & Standings */}
        {featureFlags.matches && (
          <div className="lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {/* Standings Widget */}
              <StandingsWidget standings={standings} />

              {/* Matches Widget */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                 <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">مباريات اليوم</h3>
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">مباشر</span>
                 </div>
                 <div className="divide-y divide-slate-800">
                   {isLoadingInitial && displayMatches.length === 0 && !hasApiKey ? (
                      Array(5).fill(0).map((_, i) => <MatchRowSkeleton key={i} />)
                   ) : displayMatches.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                          {hasApiKey ? 'لا توجد مباريات جارية اليوم' : 'لا توجد مباريات'}
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

              {/* Social / Ad Placeholder */}
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

// ... [Keep other pages like CountryPage, MatchesPage, VideosPage, ArticleDetail same as before, no changes needed] ...
// Re-implementing simplified layout/router for brevity as they remain largely unchanged
// But must include MatchesPage logic update to use hasApiKey

const CountryPage: React.FC = () => {
    const { articles } = useApp();
    const location = useLocation();
    
    const categoryMap: Record<string, string> = {
      '/country/saudi': Category.SAUDI,
      '/country/uae': Category.UAE,
      '/country/qatar': Category.QATAR,
      '/country/kuwait': Category.KUWAIT,
      '/country/oman': Category.OMAN,
      '/country/bahrain': Category.BAHRAIN,
      '/analysis': Category.ANALYSIS,
    };
  
    const currentCategory = categoryMap[location.pathname] || Category.SAUDI;
    const filteredArticles = articles.filter(a => a.category === currentCategory);
  
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
          <div>
             <span className="text-primary text-sm font-bold tracking-widest uppercase mb-1 block">تغطية خاصة</span>
             <h1 className="text-3xl md:text-5xl font-black text-white">{currentCategory}</h1>
          </div>
          <div className="hidden md:block">
              <Trophy size={48} className="text-slate-800" />
          </div>
        </div>
  
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
            <p className="text-slate-500">لا توجد أخبار حالياً في هذا القسم.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    );
};

const MatchesPage: React.FC = () => {
    const { matches, setSelectedMatch, apiConfig } = useApp();
    
    // Logic: If API Key exists, strictly use 'matches' (even if empty). If not, use INITIAL_MATCHES.
    const hasApiKey = Boolean(apiConfig.keys.matches);
    const displayMatches = hasApiKey ? matches : INITIAL_MATCHES;

    const groupedMatches = displayMatches.reduce((acc: Record<string, Match[]>, match) => {
      const leagueName = match.league || 'مباريات ودية';
      if (!acc[leagueName]) acc[leagueName] = [];
      acc[leagueName].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
  
    const leagues = Object.keys(groupedMatches);
  
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-black text-white mb-8 flex items-center border-r-4 border-primary pr-4">
          <Calendar className="ml-3 text-primary" size={32} />
          جدول مباريات اليوم
        </h1>
        
        <div className="space-y-8">
          {leagues.length === 0 ? (
             <div className="text-center text-slate-500 py-10 bg-slate-900 rounded-xl">
                 {hasApiKey ? 'لا توجد مباريات مجدولة لليوم في الدوريات المختارة' : 'لا توجد مباريات اليوم'}
             </div>
          ) : leagues.map((league) => {
            const leagueMatches = groupedMatches[league];
            return (
            <div key={league} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                     <div className="w-1 h-6 bg-accent rounded-full"></div>
                     <h2 className="font-bold text-white text-lg">{league}</h2>
                 </div>
                 <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">{leagueMatches[0].country}</span>
              </div>
              <div className="divide-y divide-slate-800/50">
                 {leagueMatches.map(match => (
                   <div key={match.id} onClick={() => setSelectedMatch(match)} className="p-5 flex flex-col md:flex-row items-center justify-between hover:bg-slate-800/30 transition-colors gap-4 cursor-pointer group">
                      {/* Home Team */}
                      <div className="flex items-center gap-4 flex-1 w-full md:w-auto justify-end md:justify-start order-1 md:order-1">
                        <span className="font-bold text-slate-200 text-lg group-hover:text-primary transition-colors">{match.homeTeam}</span>
                        <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-10 h-10 drop-shadow-md" />
                      </div>
  
                      {/* Score/Time */}
                      <div className="flex flex-col items-center justify-center w-full md:w-32 order-2 md:order-2 bg-slate-900 py-2 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                        {match.status === 'UPCOMING' ? (
                          <span className="text-xl font-mono text-slate-400 font-bold">{match.time}</span>
                        ) : (
                          <div className="flex items-center gap-4 text-2xl font-mono font-black text-white">
                             <span>{match.scoreHome}</span>
                             <span className="text-slate-600">:</span>
                             <span>{match.scoreAway}</span>
                          </div>
                        )}
                        <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 ${match.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                          {match.status === 'LIVE' ? 'جاري الآن' : match.status === 'FINISHED' ? 'انتهت' : 'لم تبدأ'}
                        </span>
                      </div>
  
                      {/* Away Team */}
                      <div className="flex items-center gap-4 flex-1 w-full md:w-auto justify-start md:justify-end order-3 md:order-3">
                        <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-10 h-10 drop-shadow-md" />
                        <span className="font-bold text-slate-200 text-lg group-hover:text-primary transition-colors">{match.awayTeam}</span>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )})}
        </div>
      </div>
    );
}

const VideosPage: React.FC = () => {
      const { articles } = useApp();
      const videos = articles.filter(a => a.category === Category.VIDEO);
      
      const displayVideos = videos.length > 0 ? videos : [
          {...INITIAL_ARTICLES[4], id: 'v1'}, 
      ];
  
      return (
          <div className="container mx-auto px-4 py-8">
               <h1 className="text-3xl font-black text-white mb-8 flex items-center border-r-4 border-red-600 pr-4">
                  <PlayCircle className="ml-3 text-red-600" size={32} />
                  أحدث الفيديوهات والملخصات
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayVideos.map((video) => (
                      <div key={video.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-red-900/50 transition-all shadow-lg group">
                          <div className="relative aspect-video bg-black">
                              {video.videoEmbedId ? (
                                  <iframe 
                                      className="w-full h-full"
                                      src={`https://www.youtube.com/embed/${video.videoEmbedId}`} 
                                      title={video.title}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                      allowFullScreen
                                  ></iframe>
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                                      <img src={video.imageUrl} className="w-full h-full object-cover opacity-50"/>
                                      <PlayCircle size={48} className="absolute text-white" />
                                  </div>
                              )}
                          </div>
                          <div className="p-5">
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] bg-red-600/20 text-red-500 px-2 py-1 rounded font-bold">ملخص</span>
                                  <div className="flex items-center text-xs text-slate-500">
                                      <Clock size={12} className="ml-1" />
                                      <span>{new Date(video.date).toLocaleDateString('ar-SA')}</span>
                                  </div>
                              </div>
                              <h3 className="font-bold text-white text-lg line-clamp-2 mb-2 group-hover:text-red-500 transition-colors">{video.title}</h3>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )
}

const ArticleDetail: React.FC = () => {
    const { articles } = useApp();
    const location = useLocation();
    const id = location.pathname.split('/').pop();
    const article = articles.find(a => a.id === id);
    const [likes, setLikes] = useState(0);
    const [fires, setFires] = useState(0);

    if (!article) return <div className="p-10 text-center text-white">المقال غير موجود</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded bg-slate-800 text-primary font-bold text-xs mb-3 border border-slate-700">{article.category}</span>
                <h1 className="text-3xl md:text-5xl font-black text-white mt-2 leading-tight lg:leading-tight">{article.title}</h1>
                <div className="flex items-center text-slate-400 mt-6 text-sm space-x-6 space-x-reverse border-y border-slate-800 py-4">
                    <span className="flex items-center font-bold text-slate-300"><Users size={16} className="ml-2 text-primary"/> {article.author}</span>
                    <span className="flex items-center"><Clock size={16} className="ml-2"/> {new Date(article.date).toLocaleDateString('ar-SA')}</span>
                </div>
            </div>
            
            {article.category === Category.VIDEO && article.videoEmbedId ? (
                 <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 bg-black shadow-2xl border border-slate-800">
                    <iframe 
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${article.videoEmbedId}`} 
                        title={article.title}
                        allowFullScreen
                    ></iframe>
                 </div>
            ) : (
                <div className="w-full h-[300px] md:h-[500px] rounded-xl overflow-hidden mb-8 bg-slate-800 shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-50"></div>
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                </div>
            )}
            
            <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed font-sans">
                <p className="text-xl font-bold text-white mb-8 leading-9 border-r-4 border-primary pr-6 bg-slate-900/30 py-4 rounded-r">{article.summary}</p>
                <div dangerouslySetInnerHTML={{__html: article.content.replace(/\n/g, '<br/>')}} />
            </div>

            {/* Reactions Section */}
            <div className="mt-12 py-8 border-t border-b border-slate-800 flex flex-col items-center">
                <h3 className="text-white font-bold mb-6 flex items-center">
                    <MessageCircle className="ml-2" size={20} />
                    كيف وجدت هذا المقال؟
                </h3>
                <div className="flex gap-6">
                    <button 
                        onClick={() => setLikes(p => p + 1)}
                        className="flex flex-col items-center group"
                    >
                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-primary group-hover:bg-primary/10 transition-all mb-2">
                             <ThumbsUp size={24} className="text-slate-400 group-hover:text-primary transition-colors group-active:scale-125 duration-150" />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{124 + likes}</span>
                    </button>

                    <button 
                         onClick={() => setFires(p => p + 1)}
                         className="flex flex-col items-center group"
                    >
                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-orange-500 group-hover:bg-orange-500/10 transition-all mb-2">
                             <Flame size={24} className="text-slate-400 group-hover:text-orange-500 transition-colors group-active:scale-125 duration-150" />
                        </div>
                         <span className="text-xs text-slate-500 font-mono">{89 + fires}</span>
                    </button>
                    
                    <button className="flex flex-col items-center group">
                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-red-500 group-hover:bg-red-500/10 transition-all mb-2">
                             <ThumbsDown size={24} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">12</span>
                    </button>
                </div>
            </div>

            {/* Tags/Keywords Mock */}
            <div className="pt-6 flex flex-wrap gap-2">
                <span className="text-sm text-slate-500 ml-2">كلمات مفتاحية:</span>
                {['دوري أبطال آسيا', 'الدوري المحلي', 'الخليج', 'كرة قدم'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-900 text-slate-400 text-xs rounded-full hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

// --- Main Layout & App ---

const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { matches, articles, selectedMatch, setSelectedMatch, isAutopilot, toggleAutopilot, featureFlags, apiConfig } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // DETERMINE DISPLAY MATCHES FOR TICKER
  const hasApiKey = Boolean(apiConfig.keys.matches);
  const displayMatches = hasApiKey ? matches : INITIAL_MATCHES;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary selection:text-slate-900">
      <Header 
        onSearchClick={() => setIsSearchOpen(true)} 
        isAutopilotEnabled={isAutopilot}
        onToggleAutopilot={toggleAutopilot}
      />
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        articles={articles}
      />
      <MatchCenterModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      
      {/* Updated Ticker Logic: Use displayMatches. If it's empty (and API key exists), MatchTicker will handle "No Matches" */}
      {featureFlags.matches && <MatchTicker matches={displayMatches} onMatchClick={setSelectedMatch} />}
      
      <main>
        {children}
      </main>
      <footer className="bg-slate-900 border-t border-slate-800 py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-4">
                 <Trophy className="text-primary" size={24} />
                 <span className="text-2xl font-black text-white">Gulf<span className="text-primary">Sports</span></span>
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
            <p>© {new Date().getFullYear()} Gulf Sports. جميع الحقوق محفوظة.</p>
            <p className="mt-2 md:mt-0">صنع بشغف للكرة الخليجية</p>
          </div>
          
          {/* Legal Disclaimer */}
          <div className="border-t border-slate-800/50 mt-8 pt-6 text-center">
             <p className="text-[10px] text-slate-600 max-w-3xl mx-auto leading-relaxed">
                إخلاء مسؤولية: موقع Gulf Sports هو منصة إخبارية ومجتمعية مستقلة. جميع أسماء الأندية، الشعارات، والعلامات التجارية المعروضة في الموقع هي ملكية حصرية لأصحابها المعنيين وتستخدم هنا لأغراض التعريف والإخبار فقط بموجب مبدأ الاستخدام العادل. نحن لا ندعي أي علاقة رسمية مع أي من الأندية أو الاتحادات الرياضية المذكورة إلا إذا نص على ذلك صراحة.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// INITIAL FEATURE FLAGS
const INITIAL_FLAGS: FeatureFlags = {
    matches: true,
    clubs: true,
    mercato: true,
    videos: true,
    analysis: true,
    autopilot: true
};

const INITIAL_API_CONFIG: ApiConfig = {
    provider: 'api-football',
    leagueIds: '307, 308, 309, 301, 306, 312, 315', // Default GCC leagues
    autoSync: true,
    keys: {
        matches: '',
        results: '',
        playersData: '',
        scouting: '',
        gemini: ''
    }
};

const App: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>(() => {
     try {
       const saved = localStorage.getItem('gs_articles');
       return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
     } catch (e) {
       console.error("Failed to load articles from storage, resetting:", e);
       return INITIAL_ARTICLES;
     }
  });

  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => {
    try {
        const saved = localStorage.getItem('gs_flags');
        return saved ? JSON.parse(saved) : INITIAL_FLAGS;
    } catch { return INITIAL_FLAGS; }
  });

  const setFeatureFlag = (key: keyof FeatureFlags, value: boolean) => {
    setFeatureFlags(prev => {
        const newFlags = { ...prev, [key]: value };
        localStorage.setItem('gs_flags', JSON.stringify(newFlags));
        return newFlags;
    });
  };

  // API Config State
  // Use improved initialization to merge with defaults in case local storage is partial
  const [apiConfig, setApiConfigState] = useState<ApiConfig>(() => {
      try {
          const saved = localStorage.getItem('gs_api_config');
          if (saved) {
             const parsed = JSON.parse(saved);
             // Robust merge: keep defaults, overwrite with saved, ensure keys object exists and is merged
             return { 
                ...INITIAL_API_CONFIG, 
                ...parsed, 
                keys: { ...INITIAL_API_CONFIG.keys, ...(parsed.keys || {}) } 
             };
          }
          return INITIAL_API_CONFIG;
      } catch { return INITIAL_API_CONFIG; }
  });

  const setApiConfig = (config: ApiConfig) => {
      setApiConfigState(config);
      localStorage.setItem('gs_api_config', JSON.stringify(config));
  };

  // State for Clubs Management
  const [clubs, setClubs] = useState<ClubProfile[]>(() => {
    try {
      const saved = localStorage.getItem('gs_clubs');
      // If we have saved clubs, use them. Otherwise, initialize from constant DATABASE
      if (saved) return JSON.parse(saved);
      // Initialize with array from Object.values of the constant database
      return Object.values(CLUB_DATABASE);
    } catch {
      return Object.values(CLUB_DATABASE);
    }
  });

  // --- AUTHENTICATION STATE ---
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('gs_users');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('gs_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    localStorage.setItem('gs_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('gs_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('gs_current_user');
  }, [currentUser]);

  const login = (username: string, pass: string) => {
    const user = users.find(u => (u.username === username || u.email === username) && u.password === pass);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const register = (userData: Partial<User>) => {
    if (users.some(u => u.username === userData.username || u.email === userData.email)) return false;
    
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name!,
      username: userData.username!,
      email: userData.email!,
      password: userData.password!,
      joinDate: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}&backgroundColor=b6e3f4`
    };
    
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => setCurrentUser(null);
  
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [lastAIUpdate, setLastAIUpdate] = useState<Date | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isAutopilot, setIsAutopilot] = useState(false); // Default is OFF as requested
  
  // Real Matches State
  const [matches, setMatches] = useState<Match[]>([]);
  // Real Standings State
  const [standings, setStandings] = useState<Standing[]>(INITIAL_STANDINGS);
  
  // Followed Teams State
  const [followedTeams, setFollowedTeams] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('gs_followed_teams');
          return saved ? JSON.parse(saved) : [];
      } catch {
          return [];
      }
  });
  
  // Ref to track generating state within closure
  const isGeneratingRef = useRef(false);
  // Ref to track articles for duplicate checking within interval
  const articlesRef = useRef(articles);

  useEffect(() => {
     // Fake initial loading for Skeleton demonstration
     const timer = setTimeout(() => {
         setIsLoadingInitial(false);
     }, 2000);
     return () => clearTimeout(timer);
  }, []);

  // --- REAL MATCHES API ENGINE ---
  useEffect(() => {
      // If matches feature is disabled or no key provided, do nothing
      if (!featureFlags.matches || !apiConfig.keys.matches) {
          setMatches([]); // Clear real matches to trigger fallback UI in list
          return;
      }

      const syncMatches = async () => {
          console.log("Syncing matches from API Football...");
          const liveMatches = await fetchLiveMatches(apiConfig.keys.matches, apiConfig.leagueIds);
          // Set matches regardless of length. If empty, it means no matches today.
          setMatches(liveMatches); 
      };

      // Initial Sync
      syncMatches();

      // Auto Sync Interval
      let interval: ReturnType<typeof setInterval>;
      if (apiConfig.autoSync) {
          interval = setInterval(syncMatches, MATCH_SYNC_INTERVAL);
      }

      return () => {
          if (interval) clearInterval(interval);
      };
  }, [featureFlags.matches, apiConfig.keys.matches, apiConfig.leagueIds, apiConfig.autoSync]);

  // --- REAL STANDINGS API ENGINE ---
  useEffect(() => {
     if (featureFlags.matches && apiConfig.keys.matches) {
        // Fetch real standings
        fetchStandings(apiConfig.keys.matches, apiConfig.leagueIds).then(res => {
           // If we got results, or if the API call returned empty array (meaning no data for this season/config), 
           // we MUST update the state to reflect reality and remove mock data.
           // However, if the fetch failed (e.g. network error) and returned empty [], we might want to keep existing state 
           // but here we prioritize accuracy. If key is present, we show what API gives.
           setStandings(res);
        });
     }
  }, [featureFlags.matches, apiConfig.keys.matches, apiConfig.leagueIds]);

  // Keep ref in sync
  useEffect(() => {
    articlesRef.current = articles;
    try {
      localStorage.setItem('gs_articles', JSON.stringify(articles));
    } catch (e) {
      console.error("Failed to save articles:", e);
    }
  }, [articles]);

  // Persist followed teams
  useEffect(() => {
      localStorage.setItem('gs_followed_teams', JSON.stringify(followedTeams));
  }, [followedTeams]);

  // Persist Clubs
  useEffect(() => {
    try {
      localStorage.setItem('gs_clubs', JSON.stringify(clubs));
    } catch (e) {
      console.error("Failed to save clubs:", e);
    }
  }, [clubs]);

  const toggleFollow = (teamName: string) => {
      setFollowedTeams(prev => {
          if (prev.includes(teamName)) return prev.filter(t => t !== teamName);
          return [...prev, teamName];
      });
  };

  const addArticle = (article: Article) => {
    setArticles(prevArticles => {
        const exists = prevArticles.some(a => a.title === article.title);
        if (exists) return prevArticles;
        return [article, ...prevArticles];
    });
  };

  const updateArticle = (updatedArticle: Article) => {
    setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  // Club Management Functions
  const addClub = (newClub: ClubProfile) => {
    setClubs(prev => [...prev, newClub]);
  };

  const updateClub = (updatedClub: ClubProfile) => {
    setClubs(prev => prev.map(c => c.id === updatedClub.id ? updatedClub : c));
  };

  const deleteClub = (id: string) => {
    setClubs(prev => prev.filter(c => c.id !== id));
  };

  // --- Transfer API Simulation ---
  const transferPlayer = (playerId: string, sourceClubId: string, targetClubId: string, price: number) => {
     const sourceClub = clubs.find(c => c.id === sourceClubId);
     const targetClub = clubs.find(c => c.id === targetClubId);
     
     if (!sourceClub || !targetClub) return;

     // 1. Find player
     const player = sourceClub.squad.find(p => p.id === playerId);
     if (!player) return;

     // 2. Remove from Source
     const newSourceSquad = sourceClub.squad.filter(p => p.id !== playerId);
     const updatedSourceClub = { ...sourceClub, squad: newSourceSquad };

     // 3. Add to Target (Update dynamic image to new club kit - simulated by just keeping same image for now)
     const newTargetSquad = [...targetClub.squad, player];
     const updatedTargetClub = { ...targetClub, squad: newTargetSquad };

     // 4. Update State
     setClubs(prev => prev.map(c => {
         if (c.id === sourceClubId) return updatedSourceClub;
         if (c.id === targetClubId) return updatedTargetClub;
         return c;
     }));

     // 5. Generate Breaking News
     const newsTitle = `رسمياً: ${player.name} ينتقل من ${sourceClub.name} إلى ${targetClub.name}`;
     const newsSummary = `في صفقة من العيار الثقيل، أعلن نادي ${targetClub.name} عن التعاقد مع النجم ${player.name} قادماً من ${sourceClub.name}.`;
     const newsContent = `
        <p>أتم مجلس إدارة نادي <strong>${targetClub.name}</strong> إجراءات التعاقد مع اللاعب <strong>${player.name}</strong> في صفقة انتقال نهائي.</p>
        <p>وتأتي هذه الصفقة لتدعيم صفوف الفريق للمنافسات القادمة، حيث يعتبر ${player.name} من أبرز اللاعبين في مركزه.</p>
        <p>وقد بلغت قيمة الصفقة حوالي ${price} مليون يورو.</p>
     `;
     
     addArticle({
         id: Date.now().toString(),
         title: newsTitle,
         summary: newsSummary,
         content: newsContent,
         imageUrl: player.image || targetClub.logo,
         category: Category.BREAKING,
         date: new Date().toISOString(),
         author: 'سوق الانتقالات',
         views: 0,
         isBreaking: true
     });
  };

  // --- TRAFFIC SIMULATOR ---
  useEffect(() => {
    const trafficTimer = setInterval(() => {
      setArticles(prev => prev.map(a => {
        const isRecent = new Date(a.date).getTime() > (Date.now() - 86400000);
        if (isRecent && Math.random() > 0.7) {
           return { ...a, views: a.views + Math.floor(Math.random() * 3) + 1 };
        }
        return a;
      }));
    }, 5000);
    return () => clearInterval(trafficTimer);
  }, []);

  // --- AUTOMATED NEWS ENGINE (AUTO-PILOT) ---
  useEffect(() => {
    // If Autopilot is OFF (either global toggle or Feature Flag), do nothing
    if (!isAutopilot || !featureFlags.autopilot) return;

    // Immediately trigger one if it's the first time turning on
    const initialTrigger = setTimeout(async () => {
        if (!isGeneratingRef.current) {
            triggerAutoGeneration();
        }
    }, 5000);

    const interval = setInterval(async () => {
        if (!isGeneratingRef.current) {
            triggerAutoGeneration();
        }
    }, AUTOPILOT_INTERVAL);

    return () => {
        clearInterval(interval);
        clearTimeout(initialTrigger);
    };
  }, [isAutopilot, featureFlags.autopilot]);

  const triggerAutoGeneration = async () => {
      isGeneratingRef.current = true;
      setIsAIGenerating(true);
      
      try {
        // Smart Selection: Pick a random club from the list
        // Use dynamic clubs list if available, else fallback
        const clubsList = clubs.length > 0 ? clubs : GULF_CLUBS;
        const randomClub = clubsList[Math.floor(Math.random() * clubsList.length)];
        const topic = `أخبار ${randomClub.name} اليوم`;
        
        console.log(`Auto-Pilot: Generating news for ${topic}...`);
        
        // Pass existing titles to avoid duplicates
        const existingTitles = articlesRef.current.map(a => a.title);
        
        // PASS DYNAMIC KEY HERE
        const newArticle = await generateArticleContent(topic, apiConfig.keys.gemini, 2, existingTitles);
        
        if (newArticle) {
            const articleObj: Article = {
                id: Date.now().toString(),
                title: newArticle.title,
                summary: newArticle.summary,
                content: newArticle.content,
                imageUrl: newArticle.imageUrl || getSmartImageUrl(randomClub.name),
                category: newArticle.category as Category || Category.SAUDI,
                date: new Date().toISOString(),
                author: 'AI Reporter',
                views: 120,
                isBreaking: false
            };
            
            // Double check duplication before adding
            const isDuplicate = articlesRef.current.some(a => a.title === articleObj.title);
            if (!isDuplicate) {
                addArticle(articleObj);
                setLastAIUpdate(new Date());
            }
        }
      } catch (error) {
        console.error("Auto-Pilot Error:", error);
      } finally {
        setIsAIGenerating(false);
        isGeneratingRef.current = false;
      }
  };

  return (
    <AppContext.Provider value={{ 
      articles, 
      addArticle, 
      matches, 
      standings, 
      clubs,
      addClub,
      updateClub,
      deleteClub,
      transferPlayer,
      isAIGenerating,
      lastAIUpdate,
      selectedMatch,
      setSelectedMatch,
      isLoadingInitial,
      isAutopilot,
      toggleAutopilot: () => setIsAutopilot(!isAutopilot),
      followedTeams,
      toggleFollow,
      currentUser,
      login,
      register,
      logout,
      featureFlags,
      setFeatureFlag,
      apiConfig,
      setApiConfig
    }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/admin" 
              element={
                <AdminDashboard 
                  articles={articles} 
                  onAddArticle={addArticle}
                  onUpdateArticle={updateArticle}
                  onDeleteArticle={deleteArticle}
                />
              } 
            />
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            <Route path="/country/:id" element={<CountryPage />} />
            <Route path="/club/:id" element={<ClubDashboard />} />
            <Route path="/analysis" element={<CountryPage />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/videos" element={<VideosPage />} />
          </Routes>
        </Layout>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
