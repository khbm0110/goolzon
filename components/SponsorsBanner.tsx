import React from 'react';
import { useData } from '../contexts/DataContext';
import { Handshake } from 'lucide-react';

const SponsorsBanner: React.FC = () => {
    const { sponsors } = useData();
    const activeSponsors = sponsors.filter(s => s.active);

    if (activeSponsors.length === 0) return null;

    return (
        <div className="bg-slate-950 border-t border-slate-900 py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest opacity-70">
                        <Handshake size={14} />
                        شركاء النجاح
                    </div>
                    
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                        {activeSponsors.map(sponsor => (
                            <a 
                                key={sponsor.id} 
                                href={sponsor.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="group relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                                title={sponsor.name}
                            >
                                <img 
                                    src={sponsor.logo} 
                                    alt={sponsor.name} 
                                    className="h-8 md:h-12 w-auto object-contain transition-transform group-hover:scale-110" 
                                />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorsBanner;