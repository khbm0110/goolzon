
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Wand2, Loader2, Play, Pause, CheckCircle } from 'lucide-react';
import { Article } from '../types';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';
import { fetchDailyHeadlines, generateArticleContent } from '../services/geminiService';

interface AutopilotTabProps {
    setEditingArticle: (article: Partial<Article> | null) => void;
}

const AutopilotTab: React.FC<AutopilotTabProps> = ({ setEditingArticle }) => {
    const { isAutopilot, toggleAutopilot } = useUI();
    const { addArticle, matches } = useData();
    const [headlines, setHeadlines] = useState<string[]>([]);
    const [isLoadingHeadlines, setIsLoadingHeadlines] = useState(false);
    const [generatingStates, setGeneratingStates] = useState<Record<string, 'idle' | 'loading' | 'done'>>({});
    
    // Fix: Use generic 'any' or ReturnType<typeof setInterval> to avoid NodeJS namespace issues in browser
    const autopilotInterval = useRef<any>(null);

    const loadHeadlines = useCallback(async () => {
        setIsLoadingHeadlines(true);
        setHeadlines([]);
        const fetchedHeadlines = await fetchDailyHeadlines();
        setHeadlines(fetchedHeadlines);
        setGeneratingStates(fetchedHeadlines.reduce((acc, h) => ({ ...acc, [h]: 'idle' }), {}));
        setIsLoadingHeadlines(false);
    }, []);

    useEffect(() => {
        loadHeadlines();
    }, [loadHeadlines]);

    const handleManualGenerate = async (topic: string) => {
        setGeneratingStates(prev => ({ ...prev, [topic]: 'loading' }));
        const generated = await generateArticleContent(topic, matches);
        if (generated) {
            setEditingArticle({
                title: generated.title,
                summary: generated.summary,
                content: generated.content,
                category: generated.category as any,
                imageUrl: generated.imageUrl,
                isBreaking: generated.hasNews,
                sources: generated.sources
            });
            setGeneratingStates(prev => ({ ...prev, [topic]: 'idle' })); 
        } else {
            alert('فشل النظام في إنشاء المقال.');
            setGeneratingStates(prev => ({ ...prev, [topic]: 'idle' }));
        }
    };

    useEffect(() => {
        if (isAutopilot) {
            autopilotInterval.current = setInterval(async () => {
                const availableHeadlines = headlines.filter(h => generatingStates[h] === 'idle');
                if (availableHeadlines.length > 0) {
                    const topic = availableHeadlines[Math.floor(Math.random() * availableHeadlines.length)];
                    setGeneratingStates(prev => ({ ...prev, [topic]: 'loading' }));
                    const generated = await generateArticleContent(topic, matches);
                    if (generated) {
                        const newArticle: Article = {
                            id: `article-${Date.now()}`,
                            date: new Date().toISOString(),
                            author: 'الطيار الآلي',
                            views: Math.floor(Math.random() * 100),
                            title: generated.title,
                            summary: generated.summary,
                            content: generated.content,
                            category: generated.category as any,
                            imageUrl: generated.imageUrl,
                            isBreaking: generated.hasNews,
                            sources: generated.sources,
                        };
                        await addArticle(newArticle);
                        console.log(`Autopilot generated: ${newArticle.title}`);
                        setGeneratingStates(prev => ({ ...prev, [topic]: 'done' }));
                    } else {
                        setGeneratingStates(prev => ({ ...prev, [topic]: 'idle' }));
                    }
                }
            }, 5000); // Faster specific interval for mock demo (5 seconds)
        } else {
            if (autopilotInterval.current) {
                clearInterval(autopilotInterval.current);
            }
        }
        return () => {
            if (autopilotInterval.current) {
                clearInterval(autopilotInterval.current);
            }
        };
    }, [isAutopilot, headlines, generatingStates, addArticle, matches]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl animate-in fade-in">
            <div className="p-4 flex flex-col md:flex-row justify-between md:items-center border-b border-slate-800 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bot className="text-primary"/>الطيار الآلي (Autopilot)</h2>
                    <p className="text-slate-400 text-sm mt-1">محاكاة إنشاء المحتوى (وضع البيانات الوهمية).</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <label htmlFor="autopilot-toggle" className="font-bold text-slate-300">
                        {isAutopilot ? 'الوضع التلقائي: نشط' : 'الوضع التلقائي: متوقف'}
                    </label>
                    <button onClick={toggleAutopilot} className={`p-2 rounded-full transition-colors ${isAutopilot ? 'bg-primary text-slate-900' : 'bg-slate-700 text-white'}`}>
                        {isAutopilot ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                </div>
            </div>
            
            {isAutopilot && (
                <div className="p-4 bg-indigo-900/20 border-b border-indigo-800 text-indigo-300 text-sm flex items-center gap-3">
                    <Loader2 className="animate-spin" size={16}/>
                    <span>الطيار الآلي يعمل الآن ويقوم بتوليد المقالات التجريبية...</span>
                </div>
            )}

            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-300">عناوين الأخبار (محاكاة)</h3>
                    <button onClick={loadHeadlines} disabled={isLoadingHeadlines} className="text-xs font-bold text-primary hover:text-emerald-300 disabled:opacity-50">
                        {isLoadingHeadlines ? 'جاري التحميل...' : 'تحديث العناوين'}
                    </button>
                </div>
                {isLoadingHeadlines ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>)}
                    </div>
                ) : headlines.length > 0 ? (
                    <ul className="space-y-3">
                        {headlines.map(headline => (
                            <li key={headline} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                                <p className="text-slate-300 font-medium flex-1">{headline}</p>
                                <button
                                    onClick={() => handleManualGenerate(headline)}
                                    disabled={generatingStates[headline] === 'loading' || generatingStates[headline] === 'done'}
                                    className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all text-slate-900 bg-primary hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed shrink-0"
                                >
                                    {generatingStates[headline] === 'loading' && <><Loader2 size={16} className="animate-spin" /> جاري التوليد...</>}
                                    {generatingStates[headline] === 'idle' && <><Wand2 size={16} /> إنشاء مقال</>}
                                    {generatingStates[headline] === 'done' && <><CheckCircle size={16} /> تم الإنشاء</>}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        <p>لم يتم العثور على عناوين. اضغط تحديث.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutopilotTab;
