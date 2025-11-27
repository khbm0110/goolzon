
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Search, Check, Plus, Users, ArrowRight } from 'lucide-react';
import TeamLogo from '../components/TeamLogo';

const ClubsPage: React.FC = () => {
  const { clubs } = useData();
  const { followedTeams, toggleFollow } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClubs = useMemo(() => {
    return clubs.filter(club => 
      club.name.includes(searchQuery) || 
      club.englishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.country?.includes(searchQuery)
    );
  }, [clubs, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
           <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <Shield className="text-primary" size={32} />
             أندية goolzon
           </h1>
           <p className="text-slate-400 mt-2 text-sm">ابحث عن ناديك المفضل وتابعه للحصول على آخر أخباره في صفحتك الشخصية.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
           <Search className="absolute right-3 top-3.5 text-slate-500" size={18} />
           <input 
             type="text" 
             placeholder="ابحث عن نادٍ (الهلال، النصر، ريال مدريد...)"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pr-10 text-white focus:border-primary outline-none transition-colors shadow-sm"
           />
        </div>
      </div>

      {/* Grid Section */}
      {filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredClubs.map(club => {
            const isFollowing = followedTeams.includes(club.name);
            const primaryColor = club.colors?.primary || '#10b981';

            return (
              <div key={club.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                {/* Cover & Logo Area */}
                <div className="relative h-24 bg-slate-950">
                   <div className="absolute inset-0 opacity-50">
                      {club.coverImage && <img src={club.coverImage} className="w-full h-full object-cover" alt="cover"/>}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                   </div>
                   <div className="absolute -bottom-8 right-4 w-16 h-16 bg-slate-800 rounded-xl p-1 border-4 border-slate-900 shadow-lg flex items-center justify-center">
                      <TeamLogo src={club.logo} alt={club.name} className="w-12 h-12" />
                   </div>
                </div>

                {/* Info Area */}
                <div className="pt-10 px-5 pb-5">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{club.name}</h3>
                        <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block mt-1">{club.country}</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 border-t border-slate-800/50 pt-3 mt-3">
                      <div className="flex items-center gap-1">
                         <Users size={12} />
                         <span>{club.fanCount?.toLocaleString()} مشجع</span>
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="flex gap-2">
                      <button 
                        onClick={() => toggleFollow(club.name)}
                        className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          isFollowing 
                            ? 'bg-slate-800 text-white hover:bg-red-500/10 hover:text-red-500' 
                            : 'bg-primary text-slate-900 hover:bg-emerald-400'
                        }`}
                      >
                         {isFollowing ? <><Check size={16} /> متابع</> : <><Plus size={16} /> متابعة</>}
                      </button>
                      <Link 
                        to={`/club/${club.id}`}
                        className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
                        title="زيارة الصفحة"
                      >
                         <ArrowRight size={20} />
                      </Link>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <Search size={48} className="text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-300 mb-2">لم يتم العثور على أندية</h3>
            <p className="text-slate-500 text-sm">جرب البحث باسم آخر أو تحقق من الكتابة.</p>
        </div>
      )}
    </div>
  );
};

export default ClubsPage;
