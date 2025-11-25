
import React, { useState, useEffect } from 'react';
import { User, Shield, LayoutTemplate, Settings, Trophy, Users, Plus, X, Search, LogOut } from 'lucide-react';
import { Player, ClubProfile } from '../types';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';

// Define the 4-3-3 Formation Slots
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
    const { clubs, currentUser, logout } = useApp();
    const navigate = useNavigate();
    const [showTactics, setShowTactics] = useState(true); // Default to true to show the feature immediately
    const [dreamSquad, setDreamSquad] = useState<Record<number, Player & { clubLogo?: string }>>(() => {
        try {
            // Ideally use currentUser.id to segregate squads
            const saved = localStorage.getItem(`gs_dream_squad_${currentUser?.id}`);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    // Save squad when changed
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(`gs_dream_squad_${currentUser.id}`, JSON.stringify(dreamSquad));
        }
    }, [dreamSquad, currentUser]);

    // Flatten all players for search
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

    // Calculate squad rating safely
    const squadPlayers = Object.values(dreamSquad) as (Player & { clubLogo?: string })[];
    const totalRating = squadPlayers.reduce((acc: number, player) => acc + (player.rating || 0), 0);
    const averageRating = squadPlayers.length > 0 ? Math.round(totalRating / 11) : 0;

    if (!currentUser) return null; // Should be handled by route protection, but safe check

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            {/* HERO / COVER AREA - WHERE THE DREAM SQUAD LIVES */}
            <div className="relative h-[550px] md:h-[600px] bg-slate-900 group border-b border-slate-800">
                
                {/* TACTICS TOGGLE BUTTON */}
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
                        // PROFILE COVER
                        <>
                            <img 
                                src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1200" 
                                alt="Cover" 
                                className="w-full h-full object-cover opacity-60" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                            
                            {/* Profile Info Overlay */}
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
                        // DREAM SQUAD BUILDER (TACTICAL PITCH)
                        <InteractivePitch 
                            squad={dreamSquad} 
                            onSlotClick={handleSlotClick} 
                            onRemovePlayer={handleRemovePlayer}
                        />
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
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

            {/* PLAYER SELECTOR MODAL */}
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

// --- INTERACTIVE TACTICAL PITCH ---
const InteractivePitch: React.FC<{ 
    squad: Record<number, Player & { clubLogo?: string }>;
    onSlotClick: (id: number) => void;
    onRemovePlayer: (e: React.MouseEvent, id: number) => void;
}> = ({ squad, onSlotClick, onRemovePlayer }) => {
    
    return (
        <div className="w-full h-full bg-emerald-800 relative overflow-hidden flex justify-center items-center shadow-inner animate-in fade-in zoom-in-95 duration-500 selection-none">
            {/* Field Markings */}
            <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none"></div>
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/20 pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 border-2 border-t-0 border-white/20 rounded-b-lg pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 border-2 border-b-0 border-white/20 rounded-t-lg pointer-events-none"></div>

            {/* Grass Texture Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #000 20px, #000 40px)' }}></div>

            {/* Formation Slots */}
            {FORMATION_433.map((slot) => {
                const player = squad[slot.id];
                
                return (
                    <div 
                        key={slot.id} 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10 hover:z-20 transition-all"
                        style={{ top: slot.top, left: slot.left }}
                        onClick={() => onSlotClick(slot.id)}
                    >
                        {player ? (
                            // FILLED SLOT
                            <>
                                <div className="relative">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white shadow-lg overflow-hidden bg-slate-800 relative group-hover:scale-110 transition-transform">
                                        {player.image ? (
                                            <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-full h-full p-2 text-slate-400" />
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => onRemovePlayer(e, slot.id)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                    <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center shadow-md">
                                        {player.clubLogo ? (
                                            <img src={player.clubLogo} className="w-4 h-4 object-contain" />
                                        ) : (
                                            <Shield size={12} className="text-slate-500"/>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-1 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] md:text-xs text-white font-bold border border-slate-700 shadow-sm whitespace-nowrap">
                                    {player.name}
                                </div>
                                <div className="absolute -top-3 -left-2 bg-yellow-500 text-slate-900 text-[10px] font-black rounded w-6 h-4 flex items-center justify-center border border-white shadow-sm">
                                    {player.rating}
                                </div>
                            </>
                        ) : (
                            // EMPTY SLOT
                            <div className="flex flex-col items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-white/50 bg-black/20 flex items-center justify-center group-hover:bg-emerald-600/50 group-hover:border-white transition-colors">
                                    <Plus className="text-white" size={20} />
                                </div>
                                <span className="text-[10px] font-bold text-white/70 bg-black/20 px-1.5 rounded uppercase">{slot.role}</span>
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="absolute top-4 left-4 bg-slate-900/50 backdrop-blur px-3 py-1 rounded text-white text-xs font-mono border border-slate-700 pointer-events-none">
                4-3-3 الهجومية
            </div>
            
            <div className="absolute bottom-4 right-4 pointer-events-none">
                 <div className="flex items-center gap-2 text-[10px] text-white/60 bg-black/30 px-2 py-1 rounded">
                    <span>انقر لإضافة لاعب</span>
                    <div className="w-4 h-4 border border-dashed border-white/50 rounded-full flex items-center justify-center"><Plus size={8}/></div>
                 </div>
            </div>
        </div>
    );
};

// --- PLAYER SELECTOR MODAL ---
const PlayerSelectorModal: React.FC<{
    players: (Player & { clubLogo?: string, clubName?: string })[];
    onSelect: (p: Player & { clubLogo?: string }) => void;
    onClose: () => void;
    positionLabel: string;
}> = ({ players, onSelect, onClose, positionLabel }) => {
    const [search, setSearch] = useState('');
    
    // Simple filter: name matches
    const filteredPlayers = players.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    // Sort by rating desc
    const sortedPlayers = filteredPlayers.sort((a, b) => b.rating - a.rating);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white">اختر لاعب</h3>
                        <span className="text-xs text-primary font-bold uppercase tracking-wider">مركز: {positionLabel}</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 text-slate-500" size={18} />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="ابحث باسم اللاعب..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-white focus:border-primary outline-none text-sm"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {sortedPlayers.length > 0 ? sortedPlayers.map(player => (
                        <button 
                            key={player.id}
                            onClick={() => onSelect(player)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-xl transition-colors group text-right border border-transparent hover:border-slate-700"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative">
                                {player.image ? (
                                    <img src={player.image} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-3 text-slate-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{player.name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                    {player.clubLogo && <img src={player.clubLogo} className="w-3 h-3 object-contain" />}
                                    <span>{player.clubName}</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                    <span>{player.position}</span>
                                </div>
                            </div>
                            <div className={`text-lg font-black ${player.rating >= 85 ? 'text-yellow-500' : 'text-slate-400'}`}>
                                {player.rating}
                            </div>
                        </button>
                    )) : (
                        <div className="text-center py-10 text-slate-500 text-sm">
                            لا يوجد لاعبين مطابقين للبحث
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
