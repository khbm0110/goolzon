

import React from 'react';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { Match } from '../types';
import TeamLogo from '../components/TeamLogo';
import { Calendar } from 'lucide-react';

const MatchesPage: React.FC = () => {
    const { matches } = useData();
    const { setSelectedMatch } = useUI();
    
    const displayMatches = matches;

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
                 لا توجد مباريات مجدولة لليوم في الدوريات المختارة
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
                      <div className="flex items-center gap-4 flex-1 w-full md:w-auto justify-end md:justify-start order-1 md:order-1">
                        <span className="font-bold text-slate-200 text-lg group-hover:text-primary transition-colors">{match.homeTeam}</span>
                        <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-10 h-10 drop-shadow-md" />
                      </div>
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

export default MatchesPage;