
import React from 'react';
import { Match } from '../types';
import TeamLogo from './TeamLogo';

interface MatchTickerProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

const MatchTicker: React.FC<MatchTickerProps> = ({ matches, onMatchClick }) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800 py-3 overflow-x-auto no-scrollbar">
      <div className="container mx-auto px-4 flex space-x-4 space-x-reverse min-w-max items-center">
        <div className="flex items-center text-accent text-xs font-bold pl-4 border-l border-slate-800">
          <span className="animate-pulse w-2 h-2 bg-accent rounded-full ml-2"></span>
          مباريات اليوم
        </div>
        
        {matches.length === 0 ? (
           <div className="text-slate-500 text-xs px-4">
               لا توجد مباريات جارية اليوم في الدوريات المختارة
           </div>
        ) : (
          matches.map((match) => (
            <button 
              key={match.id} 
              onClick={() => onMatchClick && onMatchClick(match)}
              className="flex items-center bg-slate-900 rounded px-4 py-2 min-w-[260px] border border-slate-800 hover:border-primary/50 hover:bg-slate-800 transition-all group text-right"
            >
              <div className="flex flex-col items-center w-8">
                 <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-6 h-6 group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">{match.homeTeam}</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center px-3">
                 <div className="text-sm font-bold text-white tracking-wider font-mono">
                   {match.status === 'UPCOMING' ? (
                     <span className="text-slate-500">{match.time}</span>
                   ) : (
                     <div className="flex items-center gap-2">
                       <span>{match.scoreHome}</span>
                       <span className="text-slate-600">-</span>
                       <span>{match.scoreAway}</span>
                     </div>
                   )}
                 </div>
                 <span className={`text-[10px] font-bold ${match.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                   {match.status === 'LIVE' ? 'مباشر' : match.status === 'FINISHED' ? 'انتهت' : match.league}
                 </span>
              </div>

              <div className="flex flex-col items-center w-8">
                 <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-6 h-6 group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">{match.awayTeam}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default MatchTicker;
