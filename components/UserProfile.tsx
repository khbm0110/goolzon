import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, LayoutTemplate, Settings, Trophy, Users, Plus, X, Search, LogOut, Loader2 } from 'lucide-react';
import { Player, ClubProfile } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { getSupabase } from '../services/supabaseClient';

const FORMATION_433 = [
    { id: 0, role: 'GK', top: '85%', left: '50%' },
    { id: 1, role: 'LB', top: '65%', left: '15%' },
    { id: 2, role: 'CB', top: '70%', left: '35%' },
    { id: 3, role: 'CB', top: '70%', left: '65%' },
    { id: 4, role: 'RB', top: '65%', left: '85%' },
    { id: 5, role: 'CM', top: '45%', left: '30%' },
    { id: 6, role: 'CDM', top: '55%', left: '50%' },
    { id: 7, role: 'CM', top: '45%', left: '70%' },
    { id: 8, role: 'LW', top: '20%', left: '15%' },
    { id: 9, role: 'ST', top: '15%', left: '50%' },
    { id: 10, role: 'RW', top: '20%', left: '85%' },
];

const UserProfile: React.FC = () => {
    const { clubs } = useData();
    const { currentUser, logout } = useAuth();
    const { apiConfig } = useSettings();
    const navigate = useNavigate();
    const [showTactics, setShowTactics] = useState(true);
    const [dreamSquad, setDreamSquad] = useState<Record<number, Player & { clubLogo?: string }>>({});
    const [isLoadingSquad, setIsLoadingSquad] = useState(true);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    // Effect to load data on mount
    useEffect(() => {
        const loadSquad = async () => {
            if (!currentUser) {
                setIsLoadingSquad(false);
                return;
            }
    
            const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
            if (supabase) {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('dream_squad')
                    .eq('id', currentUser.id)
                    .single();
    
                if (data && data.dream_squad) {
                    setDreamSquad(data.dream_squad);
                } else {
                    const saved = localStorage.getItem(`goolzon_dream_squad_${currentUser.id}`);
                    setDreamSquad(saved ? JSON.parse(saved) : {});
                }
            } else {
                const saved = localStorage.getItem(`goolzon_dream_squad_${currentUser.id}`);
                setDreamSquad(saved ? JSON.parse(saved) : {});
            }
            setIsLoadingSquad(false);
        };
    
        loadSquad();
    }, [currentUser, apiConfig.supabaseUrl, apiConfig.supabaseKey]);
    
    // Effect to save data on change
    useEffect(() => {
        if (!currentUser || isLoadingSquad) return;
    
        const saveSquad = async () => {
            const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
            localStorage.setItem(`goolzon_dream_squad_${currentUser.id}`, JSON.stringify(dreamSquad));

            if (supabase) {
                const { error } = await supabase
                    .from('user_profiles')
                    .upsert({ id: currentUser.id, dream_squad: dreamSquad });
    
                if (error) {
                    console.error("Error saving dream squad to Supabase:", error);
                }
            }
        };
    
        saveSquad();
    }, [dreamSquad, currentUser, apiConfig.supabaseUrl, apiConfig.supabaseKey, isLoadingSquad]);

    const allPlayers = clubs.flatMap(c => c.squad.map(p => ({ ...p, clubLogo: c.logo, clubName: c.name })));

    const handleSlotClick = (slotId: number) => {
        setActiveSlot(slotId);
        setIsSelectorOpen(true);
    };

    const handleSelectPlayer = (player: Player & { clubLogo?: string }) => {
        if (activeSlot !== null) {
            setDreamSquad(prev => ({ ...prev, [activeSlot]: player }));
            setIsSelectorOpen(false);
            setActiveSlot(null);
        }
    };

    const handleRemovePlayer = (e: React.MouseEvent, slotId: number) => {
        e.stopPropagation();
        setDreamSquad(prev => {
            const newState = { ...prev };
            delete newState[slotId];
            return newState;
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const squadPlayers = Object.values(dreamSquad) as (Player & { clubLogo?: string })[];
    const totalRating = squadPlayers.reduce((acc: number, player) => acc + (player.rating || 0), 0);
    const averageRating = squadPlayers.length > 0 ? Math.round(totalRating / 11) : 0;

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            <div className="relative h-[550px] md:h-[600px] bg-slate-900 group border-b border-slate-800">
                <div className="absolute top-24 right-4 z-50 flex gap-2">
                    <button 
                        onClick={() => setShowTactics(!showTactics)}
                        className="bg-slate-900/80 backdrop-blur border border-slate-700 text-white p-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-emerald-500 hover:text-slate-900 transition-all shadow-xl hover:scale-105"
                    >
                        {showTactics ? <><Shield size={18} /> عرض الغلاف</> : <><LayoutTemplate size={18} /> تشكيلة الأحلام</>}
                    </button>
                </div>

                <div className="absolute inset-0">
                    {!showTactics ? (
                        <>
                            <img 
                                src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1200" 
                                alt="Cover" 
                                className="w-full h-full object-cover opacity-60" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                            
                            <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col md:flex-row items-center md:items-end gap-6">
                                <div className="w-32 h-32 rounded-full border-4 border-emerald-500 bg-slate-800 overflow-hidden shadow-2xl relative">
                                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt={currentUser.username} />
                                </div>
                                <div className="text-center md:text-right pb-2">
                                    <h1 className="text-4xl font-black text-white mb-2">{currentUser.name}</h1>
                                    <p className="text-slate-400 font-bold flex items-center justify-center md:justify-start gap-2">
                                        <Trophy size={16} className="text-yellow-500" />
                                        @{currentUser.username} • عضو منذ {new Date(currentUser.joinDate).getFullYear()}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <InteractivePitch 
                            squad={dreamSquad} 
                            onSlotClick={handleSlotClick} 
                            onRemovePlayer={handleRemovePlayer}
                            isLoading={isLoadingSquad}
                        />
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Settings size={20} className="text-emerald-500"/> إعدادات الحساب</h3>
                        <ul className="space-y-3 text-slate-400 text-sm">
                            <li className="p-3 bg-slate-950 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">تعديل الملف الشخصي</li>
                            <li className="p-3 bg-slate-950 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">إشعارات المباريات</li>
                            <li 
                                onClick={handleLogout}
                                className="p-3 bg-slate-950 rounded-lg hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors flex items-center justify-between text-slate-300"
                            >
                                تسجيل الخروج
                                <LogOut size={16} />
                            </li>
                        </ul>
                    </div>
                    
                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={20} className="text-emerald-500"/> إحصائيات التشكيلة</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                                <span className="text-slate-500 text-xs font-bold block mb-1">التقييم العام</span>
                                <span className="text-2xl font-black text-yellow-500">
                                    {averageRating}
                                </span>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                                <span className="text-slate-500 text-xs font-bold block mb-1">عدد اللاعبين</span>
                                <span className="text-2xl font-black text-white">
                                    {Object.values(dreamSquad).length} / 11
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isSelectorOpen && (
                <PlayerSelectorModal 
                    players={allPlayers}
                    onSelect={handleSelectPlayer}
                    onClose={() => setIsSelectorOpen(false)}
                    positionLabel={activeSlot !== null ? FORMATION_433[activeSlot].role : ''}
                />
            )}
        </div>
    );
};

const InteractivePitch: React.FC<{ 
    squad: Record<number, Player & { clubLogo?: string }>;
    onSlotClick: (id: number) => void;
    onRemovePlayer: (e: React.MouseEvent, id: number) => void;
    isLoading: boolean;
}> = ({ squad, onSlotClick, onRemovePlayer, isLoading }) => {
    if (isLoading) {
        return (
            <div className="w-full h-full bg-emerald-800 relative overflow-hidden flex justify-center items-center shadow-inner">
                <Loader2 size={48} className="text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-emerald-800 relative overflow-hidden flex justify-center items-center shadow-inner animate-in fade-in zoom-in-95 duration-500 selection-none">
            <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none"></div>
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 border-2 border-white/20 rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/50 rounded-full pointer-events-none"></div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-16 md:h-24 border-2 border-white/20 rounded-b-xl border-t-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-16 md:h-24 border-2 border-white/20 rounded-t-xl border-b-0 pointer-events-none"></div>

            <div className="w-full h-full max-w-lg mx-auto relative">
                {FORMATION_433.map(slot => {
                    const player = squad[slot.id];
                    return (
                        <div 
                            key={slot.id} 
                            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all"
                            style={{ top: slot.top, left: slot.left }}
                            onClick={() => onSlotClick(slot.id)}
                        >
                            {player ? (
                                <div className="relative group cursor-pointer">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-900 border-4 border-yellow-500 flex flex-col items-center justify-center p-1 shadow-lg animate-in zoom-in-75">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700">
                                            {player.image ? <img src={player.image} alt={player.name} className="w-full h-full object-cover"/> : <User size="100%" className="text-slate-600 p-1"/>}
                                        </div>
                                        <span className="text-[10px] md:text-xs font-bold text-white truncate max-w-[50px] md:max-w-[70px] mt-1">{player.name.split(' ').pop()}</span>
                                    </div>
                                    <button
                                        onClick={(e) => onRemovePlayer(e, slot.id)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/30 border-2 border-dashed border-white/30 flex flex-col items-center justify-center cursor-pointer hover:bg-white/20 transition-colors group">
                                    <Plus size={20} className="text-white/50 group-hover:text-white transition-colors" />
                                    <span className="text-[10px] text-white/50 group-hover:text-white font-bold">{slot.role}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PlayerSelectorModal: React.FC<{
  players: (Player & { clubLogo?: string; clubName?: string })[];
  onSelect: (player: Player & { clubLogo?: string }) => void;
  onClose: () => void;
  positionLabel: string;
}> = ({ players, onSelect, onClose, positionLabel }) => {
  const [query, setQuery] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState<(Player & { clubLogo?: string; clubName?: string })[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const lowerQuery = query.toLowerCase().trim();
    const filtered = lowerQuery === ''
      ? players
      : players.filter(p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          (p as any).clubName?.toLowerCase().includes(lowerQuery)
        );
    
    const sorted = [...filtered].sort((a, b) => b.rating - a.rating);
    setFilteredPlayers(sorted);
  }, [query, players]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder={`ابحث عن لاعب لمركز ${positionLabel}...`}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-lg outline-none font-bold"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {filteredPlayers.length === 0 ? (
             <div className="text-center py-10 text-slate-500">
               لا يوجد لاعبون يطابقون بحثك.
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredPlayers.slice(0, 100).map(player => ( // Limiting to 100 for performance
                <button
                  key={player.id}
                  onClick={() => onSelect(player)}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-primary/50 transition-all hover:bg-slate-800 text-right group flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                     {player.image ? <img src={player.image} alt={player.name} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate group-hover:text-primary">{player.name}</span>
                      <span className="text-xs font-mono bg-slate-800 px-1 rounded text-yellow-500">{player.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                      {player.clubLogo && <img src={player.clubLogo} className="w-3 h-3 object-contain" />}
                      <span>{(player as any).clubName}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default UserProfile;