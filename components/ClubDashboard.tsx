import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, MapPin, Trophy, User, Activity, Check, Instagram, Twitter, Calendar, Info, Loader2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import TeamLogo from './TeamLogo';
import NewsCard from './NewsCard';
import { Match, Player, PlayerSeasonStats } from '../types';
import { getSupabase } from '../services/supabaseClient';

const ClubDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { articles, standings, matches, clubs } = useData();
  const { toggleFollow, followedTeams } = useAuth();
  const [activeTab, setActiveTab] = useState<'HOME' | 'SQUAD' | 'TROPHIES'>('HOME');
  const [simulatedFanCount, setSimulatedFanCount] = useState(0);
  const [squadWithStats, setSquadWithStats] = useState<Player[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const clubId = id?.toLowerCase();
  const club = clubs.find(c => c.id === clubId);

  useEffect(() => {
    if (club) {
        setSimulatedFanCount(club.fanCount || 50000);
        const interval = setInterval(() => {
          if (Math.random() > 0.7) {
            setSimulatedFanCount(prev => prev + Math.floor(Math.random() * 3) + 1);
          }
        }, 3000);
        return () => clearInterval(interval);
    }
  }, [club]);

  useEffect(() => {
    const fetchAndAggregateStats = async () => {
        if (!club || !club.apiFootballId || !club.squad) {
            setSquadWithStats(club?.squad || []);
            setIsLoadingStats(false);
            return;
        }

        setIsLoadingStats(true);
        const supabase = getSupabase();
        if (!supabase) {
             setSquadWithStats(club.squad);
             setIsLoadingStats(false);
             return;
        }

        const { data: performances, error } = await supabase
            .from('player_performances')
            .select('*')
            .eq('team_api_id', club.apiFootballId);

        if (error) {
            console.error("Error fetching player performances:", error);
            setSquadWithStats(club.squad);
            setIsLoadingStats(false);
            return;
        }
        
        const squadWithAggregatedStats = club.squad.map(player => {
            const playerPerformances = performances ? performances.filter(p => p.player_api_id === player.apiFootballId) : [];
            
            const seasonStats: PlayerSeasonStats = playerPerformances.reduce((acc, perf) => {
                return {
                    matches: acc.matches + 1,
                    goals: acc.goals + (perf.goals || 0),
                    assists: acc.assists + (perf.assists || 0),
                    rating: acc.rating + (perf.rating || 0),
                };
            }, { matches: 0, goals: 0, assists: 0, rating: 0 });

            if (seasonStats.matches > 0) {
                 seasonStats.rating = parseFloat((seasonStats.rating / seasonStats.matches).toFixed(1));
            }

            return { ...player, seasonStats };
        });

        setSquadWithStats(squadWithAggregatedStats);
        setIsLoadingStats(false);
    };

    fetchAndAggregateStats();
  }, [club]);

  if (!club) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center p-8 bg-slate-900 rounded-xl border border-slate-800">
            <h2 className="text-2xl font-bold mb-2">عذراً</h2>
            <p className="text-slate-400">بيانات هذا النادي غير متوفرة حالياً.</p>
            <Link to="/" className="text-primary mt-4 inline-block font-bold hover:underline">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const isFollowing = followedTeams.includes(club.name);
  const currentStanding = standings.find(s => s.team === club.name);

  const handleFollow = () => {
    toggleFollow(club.name);
    if (!isFollowing) {
        setSimulatedFanCount(prev => prev + 1);
    } else {
        setSimulatedFanCount(prev => prev - 1);
    }
  };

  const clubArticles = articles.filter(a => a.title.includes(club.name));

  const upcomingMatches = matches.filter(m => 
    (m.homeTeam === club.name || m.awayTeam === club.name) && 
    m.status === 'UPCOMING'
  );

  const displayMatches = upcomingMatches.length > 0 ? upcomingMatches : [
    {
        id: 'mock-upcoming', homeTeam: club.name, homeLogo: club.logo, awayTeam: 'الخصم القادم', awayLogo: '',
        scoreHome: null, scoreAway: null, time: '20:00 م', status: 'UPCOMING', league: 'الدوري المحلي', country: club.country
    } as Match
  ];

  const primaryColor = club.colors?.primary || '#10b981';
  const secondaryColor = club.colors?.secondary || '#0f172a';
  const textColor = club.colors?.text || '#ffffff';

  return (
    <div className="bg-slate-950 min-h-screen pb-12">
      <div className="relative h-[450px] md:h-[500px]">
        <div className="absolute inset-0">
            <img 
                src={club.coverImage || "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200"} 
                alt={club.name} 
                className="w-full h-full object-cover" 
            />
            <div 
                className="absolute inset-0 opacity-90"
                style={{ background: `linear-gradient(to bottom, transparent 20%, ${secondaryColor} 90%, #020617 100%)` }}
            ></div>
        </div>

        <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-8 relative z-10 pointer-events-none">
           <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pointer-events-auto">
              <div className="relative group">
                 <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl p-1 shadow-2xl transform transition-transform group-hover:scale-105" style={{ boxShadow: `0 0 40px ${primaryColor}40` }}>
                    <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 relative">
                        <TeamLogo src={club.logo} alt={club.name} className="w-28 h-28 object-contain" />
                    </div>
                 </div>
                 {isFollowing && (
                     <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-slate-950 shadow-lg">
                        <Check size={16} strokeWidth={4} />
                     </div>
                 )}
              </div>

              <div className="flex-1 text-center md:text-right text-white pb-2">
                 <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
                    <h1 className="text-4xl md:text-5xl font-black drop-shadow-lg">{club.name}</h1>
                    <span className="bg-slate-800/80 backdrop-blur border border-slate-600/50 text-slate-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mx-auto md:mx-0">
                       <Info size={10} />
                       صفحة جماهيرية
                    </span>
                 </div>
                 <p className="text-lg opacity-90 font-medium mb-3">{club.nickname} • تأسس {club.founded}</p>
                 <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-300 font-bold">
                    <span className="flex items-center gap-1"><MapPin size={14} style={{color: primaryColor}} /> {club.stadium}</span>
                    <span className="flex items-center gap-1"><User size={14} style={{color: primaryColor}} /> {club.coach}</span>
                    <span className="flex items-center gap-1"><Users size={14} style={{color: primaryColor}} /> {simulatedFanCount.toLocaleString()} مشجع</span>
                 </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                 <button 
                    onClick={handleFollow}
                    className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-black text-lg shadow-lg transition-all active:scale-95 hover:brightness-110"
                    style={{ backgroundColor: isFollowing ? '#ffffff' : primaryColor, color: isFollowing ? '#0f172a' : textColor }}
                 >
                    {isFollowing ? <><Check size={20} /> مُتابَع</> : <><Activity size={20} /> تابِع الفريق</>}
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-3 space-y-6">
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 text-lg border-b border-slate-800 pb-2">عن النادي</h3>
                    <ul className="space-y-4 text-sm text-slate-400">
                        <li className="flex justify-between items-center border-b border-slate-800 pb-2"><span>التأسيس</span><span className="text-white font-mono">{club.founded}</span></li>
                        <li className="flex justify-between items-center border-b border-slate-800 pb-2"><span>الملعب</span><span className="text-white">{club.stadium}</span></li>
                        <li className="flex justify-between items-center border-b border-slate-800 pb-2"><span>المدرب</span><span className="text-white">{club.coach}</span></li>
                    </ul>
                 </div>
                 
                 {currentStanding && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                       <h3 className="font-bold text-white mb-6 text-lg border-b border-slate-800 pb-2 relative z-10">ترتيب الفريق</h3>
                       <div className="flex items-center justify-between mb-6 relative z-10">
                          <div className="text-center">
                             <span className="block text-3xl font-black text-white" style={{color: primaryColor}}>#{currentStanding.rank}</span>
                             <span className="text-[10px] text-slate-400 font-bold">المركز</span>
                          </div>
                          <div className="w-px h-10 bg-slate-800"></div>
                          <div className="text-center">
                             <span className="block text-2xl font-black text-white">{currentStanding.points}</span>
                             <span className="text-[10px] text-slate-400 font-bold">نقطة</span>
                          </div>
                       </div>
                    </div>
                 )}
             </div>

             <div className="lg:col-span-9">
                 <div className="flex border-b border-slate-800 mb-6 overflow-x-auto no-scrollbar">
                    {['HOME', 'SQUAD', 'TROPHIES'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'text-white border-[var(--active-color)]' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                            style={{ '--active-color': primaryColor } as any}
                        >
                           {tab === 'HOME' ? 'الرئيسية' : tab === 'SQUAD' ? 'قائمة اللاعبين' : 'خزينة البطولات'}
                        </button>
                    ))}
                 </div>

                 <div className="min-h-[400px]">
                    {activeTab === 'HOME' && (
                        <div className="space-y-6">
                            {clubArticles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {clubArticles.map(article => <NewsCard key={article.id} article={article} />)}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800 border-dashed text-slate-500">لا توجد أخبار حديثة.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'SQUAD' && (
                        isLoadingStats ? (
                            <div className="flex justify-center items-center h-64">
                               <Loader2 size={32} className="animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                               {squadWithStats.length > 0 ? squadWithStats.map((player, idx) => (
                                   <PlayerCard key={idx} player={player} primaryColor={primaryColor} clubLogo={club.logo} />
                               )) : (
                                   <div className="col-span-full text-center py-10 text-slate-500">قائمة اللاعبين غير متوفرة حالياً</div>
                               )}
                            </div>
                        )
                    )}

                    {activeTab === 'TROPHIES' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                            {club.trophies?.map((trophy, idx) => (
                                <div key={idx} className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-[var(--hover-color)] transition-all flex flex-col items-center justify-center text-center group" style={{'--hover-color': primaryColor} as any}>
                                    <Trophy size={32} style={{color: primaryColor}} className="mb-4 drop-shadow-lg" />
                                    <h3 className="text-white font-bold text-lg mb-2">{trophy.name}</h3>
                                    <span className="text-3xl font-black text-slate-700 group-hover:text-white transition-colors">{trophy.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

const PlayerCard: React.FC<{ player: Player; primaryColor: string; clubLogo: string }> = ({ player, primaryColor, clubLogo }) => {
    let cardBg = "bg-slate-800";
    let textColor = "text-slate-200";
    let accentColor = "text-slate-400";
    let borderColor = "border-slate-700";
    let overlayGradient = "from-slate-900/50 to-transparent";

    if (player.rating >= 85) {
        cardBg = "bg-gradient-to-br from-[#46390b] via-[#856c1e] to-[#2a2206]";
        textColor = "text-[#fde047]";
        accentColor = "text-[#fef08a]";
        borderColor = "border-[#a16207]";
        overlayGradient = "from-[#2a2206]/80 to-transparent";
    } else if (player.rating >= 80) {
        cardBg = "bg-gradient-to-br from-slate-600 via-slate-500 to-slate-800";
        textColor = "text-white";
        accentColor = "text-slate-200";
        borderColor = "border-slate-400";
    }

    return (
        <div className={`relative w-full aspect-[2/3] rounded-t-3xl rounded-b-2xl overflow-hidden border ${borderColor} ${cardBg} shadow-2xl hover:-translate-y-2 transition-transform duration-300 group`}>
            <div className="absolute top-0 left-0 w-full h-2/3 z-10">
                <div className="absolute top-6 left-5 flex flex-col items-center gap-1 z-30 w-12">
                     <span className={`text-3xl font-black leading-none ${textColor}`}>{player.rating}</span>
                     <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{player.position}</span>
                     <div className="w-8 h-[1px] bg-white/30 my-1"></div>
                     {player.nationality && <img src={player.nationality} alt="Nation" className="w-8 h-5 object-cover rounded shadow-sm mb-1" />}
                     {clubLogo && (
                         <div className="w-8 h-8 flex items-center justify-center">
                             <img src={clubLogo} alt="Club" className="w-full h-full object-contain drop-shadow-md" />
                         </div>
                     )}
                </div>
                <div className="absolute bottom-0 right-[-10px] w-4/5 h-full z-20 flex items-end justify-end">
                    {player.image ? (
                        <img 
                            src={player.image} 
                            alt={player.name} 
                            className="w-full h-auto object-contain drop-shadow-2xl filter contrast-110 transform group-hover:scale-105 transition-transform duration-500" 
                        />
                    ) : (
                        <User size={120} className="text-white/20" />
                    )}
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 z-20 flex flex-col justify-end pb-3 px-3">
                 <div className={`absolute bottom-0 left-0 w-full h-full bg-gradient-to-t ${overlayGradient} z-0`}></div>
                 <div className="relative z-10 text-center">
                     <h3 className={`font-black text-lg uppercase tracking-wide truncate px-2 mb-2 ${textColor}`}>{player.name}</h3>
                     {player.seasonStats && player.seasonStats.matches > 0 && (
                        <div className="flex justify-center gap-4 mb-2">
                           <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-400">أهداف</span>
                                <span className="text-lg font-black text-white">{player.seasonStats.goals}</span>
                           </div>
                           <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-400">صناعة</span>
                                <span className="text-lg font-black text-white">{player.seasonStats.assists}</span>
                           </div>
                           <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-400">تقييم</span>
                                <span className="text-lg font-black text-white">{player.seasonStats.rating}</span>
                           </div>
                        </div>
                     )}
                     <div className="w-full h-[1px] bg-white/20 mb-2 mx-auto w-4/5"></div>
                     <div className="grid grid-cols-6 gap-x-1 gap-y-1 text-center px-1">
                        <StatItem label="PAC" value={player.stats?.pac} color={accentColor} />
                        <StatItem label="SHO" value={player.stats?.sho} color={accentColor} />
                        <StatItem label="PAS" value={player.stats?.pas} color={accentColor} />
                        <StatItem label="DRI" value={player.stats?.dri} color={accentColor} />
                        <StatItem label="DEF" value={player.stats?.def} color={accentColor} />
                        <StatItem label="PHY" value={player.stats?.phy} color={accentColor} />
                    </div>
                 </div>
            </div>
        </div>
    );
};

const StatItem: React.FC<{ label: string; value?: number; color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col items-center">
        <span className={`text-[9px] ${color} opacity-70 font-bold tracking-widest`}>{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value || '-'}</span>
    </div>
);

export default ClubDashboard;