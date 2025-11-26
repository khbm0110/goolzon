
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Category } from '../types';
import { 
  Users, 
  Clock,
  ThumbsUp,
  ThumbsDown,
  Flame,
  MessageCircle,
  PlayCircle
} from 'lucide-react';

const ArticleDetailPage: React.FC = () => {
    const { articles } = useData();
    const { id } = useParams<{ id: string }>();
    const article = articles.find(a => a.id === id);
    const [likes, setLikes] = useState(0);
    const [fires, setFires] = useState(0);

    if (!article) return <div className="p-10 text-center text-white">المقال غير موجود</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded bg-slate-800 text-primary font-bold text-xs mb-3 border border-slate-700">{article.category}</span>
                <h1 className="text-3xl md:text-5xl font-black text-white mt-2 leading-tight lg:leading-tight">{article.title}</h1>
                <div className="flex items-center text-slate-400 mt-6 text-sm space-x-6 space-x-reverse border-y border-slate-800 py-4">
                    <span className="flex items-center font-bold text-slate-300"><Users size={16} className="ml-2 text-primary"/> {article.author}</span>
                    <span className="flex items-center"><Clock size={16} className="ml-2"/> {new Date(article.date).toLocaleDateString('ar-SA')}</span>
                </div>
            </div>
            
            {article.category === Category.VIDEO && article.videoEmbedId ? (
                 <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 bg-black shadow-2xl border border-slate-800">
                    <iframe 
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${article.videoEmbedId}`} 
                        title={article.title}
                        allowFullScreen
                    ></iframe>
                 </div>
            ) : (
                <div className="w-full h-[300px] md:h-[500px] rounded-xl overflow-hidden mb-8 bg-slate-800 shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-50"></div>
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                </div>
            )}
            
            <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed font-sans">
                <p className="text-xl font-bold text-white mb-8 leading-9 border-r-4 border-primary pr-6 bg-slate-900/30 py-4 rounded-r">{article.summary}</p>
                <div dangerouslySetInnerHTML={{__html: article.content.replace(/\n/g, '<br/>')}} />
            </div>

            <div className="mt-12 py-8 border-t border-b border-slate-800 flex flex-col items-center">
                <h3 className="text-white font-bold mb-6 flex items-center">
                    <MessageCircle className="ml-2" size={20} />
                    كيف وجدت هذا المقال؟
                </h3>
                <div className="flex gap-6">
                    <button 
                        onClick={() => setLikes(p => p + 1)}
                        className="flex flex-col items-center group"
                    >
                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-primary group-hover:bg-primary/10 transition-all mb-2">
                             <ThumbsUp size={24} className="text-slate-400 group-hover:text-primary transition-colors group-active:scale-125 duration-150" />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{124 + likes}</span>
                    </button>

                    <button 
                         onClick={() => setFires(p => p + 1)}
                         className="flex flex-col items-center group"
                    >
                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-orange-500 group-hover:bg-orange-500/10 transition-all mb-2">
                             <Flame size={24} className="text-slate-400 group-hover:text-orange-500 transition-colors group-active:scale-125 duration-150" />
                        </div>
                         <span className="text-xs text-slate-500 font-mono">{89 + fires}</span>
                    </button>
                    
                    <button className="flex flex-col items-center group">
                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-red-500 group-hover:bg-red-500/10 transition-all mb-2">
                             <ThumbsDown size={24} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">12</span>
                    </button>
                </div>
            </div>

            <div className="pt-6 flex flex-wrap gap-2">
                <span className="text-sm text-slate-500 ml-2">كلمات مفتاحية:</span>
                {['دوري أبطال آسيا', 'الدوري المحلي', 'الخليج', 'كرة قدم'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-900 text-slate-400 text-xs rounded-full hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default ArticleDetailPage;
