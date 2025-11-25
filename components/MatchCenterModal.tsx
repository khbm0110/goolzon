
import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Share2, BarChart2, Users, AlertCircle, Loader2 } from 'lucide-react';
import { Match, MatchDetails } from '../types';
import TeamLogo from './TeamLogo';
import { getMatchDetails } from '../services/geminiService';
import { fetchFixtureDetails } from '../services/apiFootball';
import { useApp } from '../App';

interface MatchCenterModalProps {
  match: Match | null;
  onClose: () => void;
}

const MatchCenterModal: React.FC<MatchCenterModalProps> = ({ match, onClose }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'LINEUPS' | 'SUMMARY'>('STATS');
  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { apiConfig } = useApp();

  useEffect(() => {
    if (match) {
      setLoading(true);
      
      const loadDetails = async () => {
          let data: MatchDetails | null = null;
          
          // 1. Try API if Key exists
          if (apiConfig.keys.matches) {
              try {
                  data = await fetchFixtureDetails(apiConfig.keys.matches, match.id);
                  if (!data) {
                      // If API return null (e.g. rate limit or error), and we have a key, we might NOT want to show fake data
                      // But for robustness, let's just log it.
                      console.warn("API returned no details for fixture", match.id);
                  }
              } catch (e) {
                  console.warn("API Fetch failed.", e);
              }
          }

          // 2. Fallback to Hybrid Engine ONLY if:
          //    a) No API key is configured (Demo Mode)
          //    b) OR if data is still null AND we want to fallback (but user complained about fake data)
          //    FIX: If API Key exists, do NOT show fake data. Only show fake data if NO key is provided.
          if (!data && !apiConfig.keys.matches) {
             data = await getMatchDetails(match.homeTeam, match.awayTeam, match.scoreHome, match.scoreAway);
          }
          
          setDetails(data);
          setLoading(false);
      };

      loadDetails();
    } else {
        setDetails(null);
    }
  }, [match, apiConfig.keys.matches]);

  if (!match) return null;

  // Fallback default stats if system fails completely
  const stats = details?.stats || {
    possession: 50,
    shotsHome: 0,
    shotsAway: 0,
    shotsOnTargetHome: 0,
    shotsOnTargetAway: 0,
    cornersHome: 0,
    cornersAway: 0,
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header - Scoreboard */}
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 p-6 pb-8 text-center border-b border-slate-800">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
                <X size={20} />
            </button>
            
            <div className="flex items-center justify-center text-[10px] text-slate-400 gap-2 mb-4">
                <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{match.league}</span>
                {details?.summary && (
                     <span className="text-emerald-400 font-bold hidden md:inline-block">- {details.summary}</span>
                )}
            </div>

            <div className="flex items-center justify-between px-4 md:px-12">
                {/* Home */}
                <div className="flex flex-col items-center gap-3 w-1/3">
                    <div className="w-16 h-16 md:w-24 md:h-24 relative">
                         <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                         <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-full h-full relative z-10 drop-shadow-2xl" />
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-white">{match.homeTeam}</h2>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center">
                    {match.status === 'UPCOMING' ? (
                        <div className="text-3xl md:text-5xl font-mono font-black text-slate-500 tracking-widest">{match.time}</div>
                    ) : (
                        <div className="text-4xl md:text-6xl font-mono font-black text-white flex gap-4 drop-shadow-lg">
                            <span>{match.scoreHome}</span>
                            <span className="text-slate-600">:</span>
                            <span>{match.scoreAway}</span>
                        </div>
                    )}
                    <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${match.status === 'LIVE' ? 'bg-red-500/10 text-red-500 border-red-500/50 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {match.status === 'LIVE' ? 'مباشر' : match.status === 'FINISHED' ? 'انتهت' : 'لم تبدأ'}
                    </span>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-3 w-1/3">
                    <div className="w-16 h-16 md:w-24 md:h-24 relative">
                         <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-full h-full relative z-10 drop-shadow-2xl" />
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-white">{match.awayTeam}</h2>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
            {[
                { id: 'STATS', label: 'الإحصائيات', icon: BarChart2 },
                { id: 'LINEUPS', label: 'التشكيلة', icon: Users },
                { id: 'SUMMARY', label: 'أحداث المباراة', icon: AlertCircle },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 min-h-[300px]">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                    <Loader2 size={40} className="animate-spin text-primary" />
                    <p className="text-sm font-bold animate-pulse">جاري جلب البيانات من المصدر...</p>
                </div>
            ) : !details ? (
                <div className="text-center py-12 text-slate-500">
                    <p>لا تتوفر تفاصيل لهذه المباراة حالياً.</p>
                    {apiConfig.keys.matches && <p className="text-xs text-slate-600 mt-2">تأكد من صلاحية مفتاح API أو توفر التغطية لهذه المباراة</p>}
                </div>
            ) : (
                <>
                    {activeTab === 'STATS' && (
                        <div className="space-y-6 max-w-lg mx-auto">
                            <StatBar label="الاستحواذ %" home={stats.possession} away={100 - stats.possession} />
                            <StatBar label="التسديدات" home={stats.shotsHome} away={stats.shotsAway} />
                            <StatBar label="على المرمى" home={stats.shotsOnTargetHome} away={stats.shotsOnTargetAway} />
                            <StatBar label="الركنيات" home={stats.cornersHome} away={stats.cornersAway} />
                        </div>
                    )}
                    
                    {activeTab === 'LINEUPS' && details?.lineups && (
                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                <h3 className="text-center font-bold text-primary mb-4 border-b border-slate-800 pb-2">{match.homeTeam}</h3>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    {details.lineups.home.length > 0 ? details.lineups.home.map((player, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <span className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded-full text-[10px] text-slate-500">{i + 1}</span>
                                            {player}
                                        </li>
                                    )) : <li className="text-center text-slate-500">لم تتوفر التشكيلة بعد</li>}
                                </ul>
                            </div>
                             <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                <h3 className="text-center font-bold text-primary mb-4 border-b border-slate-800 pb-2">{match.awayTeam}</h3>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    {details.lineups.away.length > 0 ? details.lineups.away.map((player, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <span className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded-full text-[10px] text-slate-500">{i + 1}</span>
                                            {player}
                                        </li>
                                    )) : <li className="text-center text-slate-500">لم تتوفر التشكيلة بعد</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SUMMARY' && details?.events && (
                        <div className="space-y-4">
                            {details.events.length > 0 ? (
                                details.events.map((event, idx) => (
                                    <EventRow key={idx} time={event.time} team={event.team} type={event.type} player={event.player} />
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <Clock size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>لا توجد أحداث مسجلة حتى الآن</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
             <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                <Share2 size={14} /> مشاركة المباراة
             </button>
             <span className="text-xs text-slate-600">
                {apiConfig.keys.matches ? 'Powered by API-Sports' : 'Powered by Hybrid Sports Engine'}
             </span>
        </div>
    </div>
    </div>
  );
};

// Helper Components for Match Center
interface StatBarProps {
    label: string;
    home: number;
    away: number;
}

const StatBar: React.FC<StatBarProps> = ({ label, home, away }) => {
    // Prevent division by zero
    const total = (home + away) || 1;
    const homePercent = (home / total) * 100;
    
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>{home}</span>
                <span className="text-slate-500">{label}</span>
                <span>{away}</span>
            </div>
            <div className="flex h-2 bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: `${homePercent}%` }} className="bg-primary transition-all duration-1000" />
                <div style={{ width: `${100 - homePercent}%` }} className="bg-slate-600 transition-all duration-1000" />
            </div>
        </div>
    );
}

interface EventRowProps {
    time: string;
    team: 'HOME' | 'AWAY';
    type: string;
    player: string;
}

const EventRow: React.FC<EventRowProps> = ({ time, team, type, player }) => (
    <div className={`flex items-center gap-4 ${team === 'HOME' ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="w-12 text-center text-xs font-mono text-slate-500">{time}</div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 ${team === 'HOME' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
            <span className="text-sm font-bold text-slate-200">{player}</span>
            {type === 'GOAL' && <span className="text-lg">⚽</span>}
            {type === 'YELLOW' && <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div>}
            {type === 'RED' && <div className="w-3 h-4 bg-red-500 rounded-sm"></div>}
            {type === 'SUB' && <span className="text-lg">🔄</span>}
        </div>
    </div>
);

export default MatchCenterModal;
