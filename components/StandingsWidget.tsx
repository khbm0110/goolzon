import React, { useState } from 'react';
import { Standing, Category } from '../types';
import TeamLogo from './TeamLogo';

interface StandingsWidgetProps {
  standings: Standing[];
}

const StandingsWidget: React.FC<StandingsWidgetProps> = ({ standings }) => {
  const [activeTab, setActiveTab] = useState<string>('SAUDI');

  const tabs = [
    { key: 'SAUDI', label: 'السعودية' },
    { key: 'UAE', label: 'الإمارات' },
    { key: 'QATAR', label: 'قطر' },
    { key: 'KUWAIT', label: 'الكويت' },
  ];

  const filteredStandings = standings
    .filter(s => s.league === activeTab)
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-white text-sm">ترتيب الدوري</h3>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-bold whitespace-nowrap px-3 transition-colors ${
              activeTab === tab.key 
                ? 'text-white bg-slate-800 border-b-2 border-primary' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="min-h-[200px]">
        {filteredStandings.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="text-slate-500 bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="py-2 px-2 w-8 text-center">#</th>
                <th className="py-2 px-2 text-right">الفريق</th>
                <th className="py-2 px-2 w-8 text-center">لعب</th>
                <th className="py-2 px-2 w-8 text-center font-bold text-white">ن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredStandings.map((team) => (
                <tr key={team.team} className="hover:bg-slate-800/30 transition-colors group">
                  <td className={`py-2 px-2 text-center font-bold ${team.rank <= 3 ? 'text-primary' : 'text-slate-500'}`}>
                    {team.rank}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <TeamLogo src={team.logo} alt={team.team} className="w-5 h-5" />
                      <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{team.team}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-500">{team.played}</td>
                  <td className="py-2 px-2 text-center font-bold text-white">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <p>لا توجد بيانات حالياً</p>
          </div>
        )}
      </div>
      <div className="p-2 text-center bg-slate-800/50 border-t border-slate-800">
        <a href="#" className="text-[10px] text-primary font-bold block w-full hover:text-white transition-colors">جدول الترتيب الكامل</a>
      </div>
    </div>
  );
};

export default StandingsWidget;