
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
  Twitter,
  Facebook,
  Copy,
  Send,
  User as UserIcon
} from 'lucide-react';
// The 'Share' icon from lucide-react doesn't always render correctly.
// A custom SVG for WhatsApp provides better consistency.
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);


const ArticleDetailPage: React.FC = () => {
    const { articles } = useData();
    const { id } = useParams<{ id: string }>();
    const article = articles.find(a => a.id === id);
    const [likes, setLikes] = useState(0);
    const [fires, setFires] = useState(0);
    const [isCopied, setIsCopied] = useState(false);

    if (!article) return <div className="p-10 text-center text-white">المقال غير موجود</div>;

    const articleUrl = window.location.href;
    const encodedTitle = encodeURIComponent(article.title);
    
    const socialLinks = {
        twitter: `https://twitter.com/intent/tweet?url=${articleUrl}&text=${encodedTitle}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${articleUrl}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${articleUrl}`,
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(articleUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    // Mock comments
    const mockComments = [
        { user: 'خالد السبيعي', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=khalid`, time: 'منذ 5 دقائق', text: 'تحليل رائع وموضوعي كالعادة. شكراً goolzon!' },
        { user: 'فاطمة أحمد', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=fatima`, time: 'منذ 20 دقيقة', text: 'أتفق مع كل كلمة، الفريق يحتاج إلى مهاجم صريح في أقرب وقت.' },
        { user: 'مشجع اتحادي', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=ittihadfan`, time: 'منذ ساعة', text: 'مقال جميل لكن أعتقد أن المدرب أخطأ في التبديلات. بالتوفيق للعميد.' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
            <div className="mb-6 text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-800 text-primary font-bold text-xs mb-3 border border-slate-700">{article.category}</span>
                <h1 className="text-3xl md:text-5xl font-black text-white mt-2 leading-tight lg:leading-tight">{article.title}</h1>
                <div className="flex items-center text-slate-400 mt-6 text-sm space-x-6 space-x-reverse border-y border-slate-800 py-4">
                    <span className="flex items-center font-bold text-slate-300"><Users size={16} className="ml-2 text-primary"/> {article.author}</span>
                    <span className="flex items-center"><Clock size={16} className="ml-2"/> {new Date(article.date).toLocaleDateString('ar-SA')}</span>
                </div>
            </div>
            
            {article.category === Category.VIDEO && article.videoEmbedId ? (
                 <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden mb-8 bg-black shadow-2xl border border-slate-800">
                    <iframe 
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${article.videoEmbedId}`} 
                        title={article.title}
                        allowFullScreen
                    ></iframe>
                 </div>
            ) : (
                <div className="w-full max-w-3xl mx-auto h-[300px] md:h-[500px] rounded-xl overflow-hidden mb-8 bg-slate-800 shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-50"></div>
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                </div>
            )}
            
            <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed font-sans text-right">
                <p className="text-xl font-bold text-white mb-8 leading-9 border-r-4 border-primary pr-6 bg-slate-900/30 py-4 rounded-r">{article.summary}</p>
                <div dangerouslySetInnerHTML={{__html: article.content.replace(/\n/g, '<br/>')}} />
            </div>

            <div className="mt-12 py-8 border-t border-b border-slate-800 flex flex-col items-center gap-8">
                <div>
                    <h3 className="text-white font-bold mb-4 text-center">شارك الخبر</h3>
                    <div className="flex gap-4">
                        <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 rounded-full flex items-center justify-center border border-[#1DA1F2]/20 group" title="مشاركة على تويتر">
                            <Twitter size={20} className="text-[#1DA1F2] group-hover:scale-110 transition-transform" />
                        </a>
                        <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 rounded-full flex items-center justify-center border border-[#1877F2]/20 group" title="مشاركة على فيسبوك">
                            <Facebook size={20} className="text-[#1877F2] group-hover:scale-110 transition-transform" />
                        </a>
                        <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-full flex items-center justify-center border border-[#25D366]/20 group" title="مشاركة على واتساب">
                            <WhatsAppIcon />
                        </a>
                         <button onClick={handleCopyLink} className="w-12 h-12 bg-slate-700/20 hover:bg-slate-700/40 rounded-full flex items-center justify-center border border-slate-700/40 group" title="نسخ الرابط">
                            <Copy size={20} className={`text-slate-400 group-hover:scale-110 transition-all ${isCopied ? 'text-primary' : ''}`} />
                        </button>
                    </div>
                     {isCopied && <p className="text-primary text-xs mt-2 animate-pulse text-center">تم نسخ الرابط!</p>}
                </div>
                
                <div>
                    <h3 className="text-white font-bold mb-6 flex items-center justify-center">
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
            </div>

            <div className="pt-6 flex flex-wrap gap-2 text-right">
                <span className="text-sm text-slate-500 ml-2">كلمات مفتاحية:</span>
                {['دوري أبطال آسيا', 'الدوري المحلي', 'الخليج', 'كرة قدم'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-900 text-slate-400 text-xs rounded-full hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                        #{tag}
                    </span>
                ))}
            </div>

            <div className="mt-12 text-right">
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-3">التعليقات ({mockComments.length})</h2>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-8">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                            <UserIcon className="w-full h-full text-slate-600 p-2" />
                        </div>
                        <form className="flex-1" onSubmit={(e) => { e.preventDefault(); alert('تم إرسال تعليقك (محاكاة)'); }}>
                            <textarea
                                placeholder="أضف تعليقك هنا..."
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none transition-colors"
                            ></textarea>
                            <div className="flex justify-end mt-3">
                                <button type="submit" className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-2">
                                    <Send size={16} /> نشر التعليق
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div className="space-y-6">
                    {mockComments.map((comment, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                                <img src={comment.avatar} alt={comment.user} />
                            </div>
                            <div className="flex-1 bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-primary">{comment.user}</h4>
                                    <span className="text-xs text-slate-500">{comment.time}</span>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ArticleDetailPage;