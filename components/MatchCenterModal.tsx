// FIX: Removed reference to "vite/client" which was causing a resolution error.

import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Share2, BarChart2, Users, AlertCircle, Loader2 } from 'lucide-react';
import { Match, MatchDetails, MatchEvent } from '../types';
import TeamLogo from './TeamLogo';
import { fetchFixtureDetails } from '../services/apiFootball';

interface MatchCenterModalProps {
  match: Match | null;
  onClose: () => void;
}

const MatchCenterModal: React.FC<MatchCenterModalProps> = ({ match, onClose }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'LINEUPS' | 'SUMMARY'>('STATS');
  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (match) {
      setLoading(true);
      setDetails(null); // Reset details when a new match is opened
      
      const loadDetails = async () => {
          // In a Vite project, environment variables are accessed via import.meta.env.
          // FIX: Using type assertion as a workaround for misconfigured Vite/TS environment.
          const API_FOOTBALL_KEY = (import.meta as any).env.VITE_APIFOOTBALL_KEY;
          let data: MatchDetails | null = null;
          
          if (API_FOOTBALL_KEY) {
              try {
                  data = await fetchFixtureDetails(API_FOOTBALL_KEY, match.id);
                  if (!data) {
                      console.warn("API returned no details for fixture", match.id);
                  }
              } catch (e) {
                  console.warn("API Fetch failed.", e);
              }
          } else {
            console.warn("Match details cannot be fetched without an API key.");
          }
          
          setDetails(data);
          setLoading(false);
      };

      loadDetails();
    } else {
        setDetails(null);
    }
  }, [match]);

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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      );
    }
    if (!details) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-slate-500">
          <AlertCircle size={32} className="mb-2" />
          <p>تفاصيل المباراة غير متاحة حالياً.</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'STATS':
        return (
          <div className="space-y-4 text-sm animate-in fade-in">
            <StatRow label="التسديدات" valueHome={stats.shotsHome} valueAway={stats.shotsAway} />
            <StatRow label="تسديدات على المرمى" valueHome={stats.shotsOnTargetHome} valueAway={stats.shotsOnTargetAway} />
            <StatRow label="الركنيات" valueHome={stats.cornersHome} valueAway={stats.cornersAway} />

            <div className="pt-4">
              <div className="w-full bg-slate-800 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-l-full" style={{ width: `${stats.possession}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-2 px-1">
                <span className="font-mono font-bold text-slate-300">{stats.possession}%</span>
                <span className="font-bold">الاستحواذ</span>
                <span className="font-mono font-bold text-slate-300">{100 - stats.possession}%</span>
              </div>
            </div>
          </div>
        );
      case 'LINEUPS':
        const hasLineups = details.lineups.home.length > 0 || details.lineups.away.length > 0;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
             {hasLineups ? (
               <>
                 <div>
                    <h4 className="font-bold text-white mb-3 text-center">{match.homeTeam}</h4>
                    <ul className="text-slate-300 text-sm space-y-2 text-center">
                        {details.lineups.home.map((p: string, i: number) => <li key={i} className="bg-slate-800/50 p-2 rounded-md">{p}</li>)}
                    </ul>
                 </div>
                 <div>
                    <h4 className="font-bold text-white mb-3 text-center">{match.awayTeam}</h4>
                    <ul className="text-slate-300 text-sm space-y-2 text-center">
                        {details.lineups.away.map((p: string, i: number) => <li key={i} className="bg-slate-800/50 p-2 rounded-md">{p}</li>)}
                    </ul>
                 </div>
               </>
             ) : (
                <div className="col-span-full text-center text-slate-500 py-10">
                    لم يتم الإعلان عن التشكيلات بعد.
                </div>
             )}
          </div>
        );
      case 'SUMMARY':
        const EventIcon = ({type}: {type: MatchEvent['type']}) => {
          switch(type) {
            case 'GOAL': return <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0" />;
            case 'YELLOW': return <div className="w-4 h-4 bg-yellow-400 flex-shrink-0" />;
            case 'RED': return <div className="w-4 h-4 bg-red-500 flex-shrink-0" />;
            case 'SUB': return <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex-shrink-0" />;
            default: return null;
          }
        };
        return (
             <div className="animate-in fade-in">
                <ul className="space-y-3">
                    {details.events.length > 0 ? details.events.map((e, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm p-2 bg-slate-800/50 rounded-md">
                        <span className="font-mono text-slate-400">{e.time}</span>
                        <EventIcon type={e.type} />
                        <span className="font-bold text-white">{e.player}</span>
                        <span className="text-slate-500">({e.team === 'HOME' ? match.homeTeam : match.awayTeam})</span>
                      </li>
                    )) : (
                       <div className="text-center text-slate-500 py-10">
                           لا توجد أحداث رئيسية مسجلة.
                       </div>
                    )}
                </ul>
             </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity"
      ></div>

      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-sm text-slate-400">
             <MapPin size={14}/> {match.league}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
             <Clock size={14}/> {new Date().toLocaleDateString('ar-SA')}
          </div>
        </div>

        {/* Score Header */}
        <div className="p-6 bg-slate-800/50 flex items-center justify-around text-white">
            <div className="flex items-center gap-4 flex-1 justify-end">
                <span className="font-bold text-xl text-right">{match.homeTeam}</span>
                <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-12 h-12"/>
            </div>
            <div className="px-6 text-center">
                 <div className="text-4xl font-black font-mono tracking-wider">
                     {match.status === 'UPCOMING' ? (
                         <span className="text-slate-500 text-3xl">{match.time}</span>
                     ) : (
                         <span>{match.scoreHome} - {match.scoreAway}</span>
                     )}
                 </div>
                 <span className={`text-xs font-bold uppercase mt-1 ${match.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                     {match.status === 'LIVE' ? `${match.time}` : match.status === 'FINISHED' ? 'انتهت' : 'لم تبدأ'}
                 </span>
            </div>
            <div className="flex items-center gap-4 flex-1">
                <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-12 h-12"/>
                <span className="font-bold text-xl">{match.awayTeam}</span>
            </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
            <button onClick={() => setActiveTab('STATS')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'STATS' ? 'text-primary border-b-2 border-primary bg-slate-800' : 'text-slate-400 hover:bg-slate-800/50'}`}><BarChart2 size={16}/> إحصائيات</button>
            <button onClick={() => setActiveTab('LINEUPS')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'LINEUPS' ? 'text-primary border-b-2 border-primary bg-slate-800' : 'text-slate-400 hover:bg-slate-800/50'}`}><Users size={16}/> التشكيلة</button>
            <button onClick={() => setActiveTab('SUMMARY')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'SUMMARY' ? 'text-primary border-b-2 border-primary bg-slate-800' : 'text-slate-400 hover:bg-slate-800/50'}`}><Share2 size={16}/> ملخص</button>
        </div>
        
        <div className="p-6 overflow-y-auto min-h-[200px]">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

// StatRow helper component
const StatRow: React.FC<{label: string, valueHome: number, valueAway: number}> = ({label, valueHome, valueAway}) => (
    <div className="flex justify-between items-center">
        <span className="font-bold text-slate-300 w-8 text-center">{valueHome}</span>
        <span className="text-slate-400 flex-1 text-center">{label}</span>
        <span className="font-bold text-slate-300 w-8 text-center">{valueAway}</span>
    </div>
);


export default MatchCenterModal;