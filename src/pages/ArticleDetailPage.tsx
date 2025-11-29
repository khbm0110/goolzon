import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Category } from '../types';
import NewsCard from '../components/NewsCard';
import CommentsPanel from '../components/CommentsPanel';
import { 
  Users, 
  Clock,
  Twitter,
  Facebook,
  Copy,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

const ArticleDetailPage: React.FC = () => {
    const { articles, comments, addComment, updateCommentStatus } = useData();
    const { id } = useParams<{ id: string }>();
    const article = articles.find(a => a.id === id);
    
    const [isCopied, setIsCopied] = useState(false);
    const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
    const [articleLikes, setArticleLikes] = useState(124);
    const [isLiked, setIsLiked] = useState(false);

    if (!article) return <div className="p-10 text-center text-white">المقال غير موجود</div>;

    const relatedArticles = articles
        .filter(a => a.category === article.category && a.id !== article.id)
        .slice(0, 4);
    
    const articleComments = comments.filter(c => c.articleId === article.id && c.status !== 'hidden');

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

    const handleLikeArticle = () => {
        setArticleLikes(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(prev => !prev);
    };

    const handleReportComment = (commentId: string) => {
        updateCommentStatus(commentId, 'reported');
        alert('شكراً لك. تم إرسال بلاغك وسيتم مراجعته.');
    };
    
    const handleAddComment = (text: string, parentId?: string) => {
        addComment({
            text,
            articleId: article.id,
            user: 'زائر',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest_user'
        }, parentId);
    };

    return (
        <>
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

                <div className="mt-8 pt-8 border-t border-slate-800 flex flex-wrap gap-2 text-right">
                    <span className="text-sm text-slate-500 ml-2">كلمات مفتاحية:</span>
                    {['دوري أبطال آسيا', 'الدوري المحلي', 'الخليج', 'كرة قدم'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-slate-900 text-slate-400 text-xs rounded-full hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <button onClick={handleLikeArticle} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isLiked ? 'text-primary bg-primary/10' : 'text-slate-300 hover:bg-slate-800'}`}>
                                <ThumbsUp size={18} />
                                <span className="font-bold">إعجاب</span>
                                <span className="font-bold text-xs bg-slate-700/50 px-1.5 py-0.5 rounded-full">{articleLikes}</span>
                            </button>
                            <button onClick={() => setIsCommentsPanelOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <MessageCircle size={18} />
                                <span className="font-bold">التعليقات</span>
                                <span className="font-bold text-xs bg-slate-700/50 px-1.5 py-0.5 rounded-full">{articleComments.length}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold hidden sm:inline">شارك:</span>
                            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg text-slate-400 transition-colors bg-slate-800/50 hover:bg-slate-800 hover:text-[#1DA1F2]">
                                <Twitter size={16} />
                            </a>
                            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg text-slate-400 transition-colors bg-slate-800/50 hover:bg-slate-800 hover:text-[#1877F2]">
                                <Facebook size={16} />
                            </a>
                            <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg text-slate-400 transition-colors bg-slate-800/50 hover:bg-slate-800 hover:text-[#25D366]">
                                <WhatsAppIcon />
                            </a>
                            <button onClick={handleCopyLink} className="p-2.5 rounded-lg text-slate-400 transition-colors bg-slate-800/50 hover:bg-slate-800 hover:text-primary">
                                <Copy size={16} className={isCopied ? 'text-primary' : ''} />
                            </button>
                        </div>
                    </div>
                    {isCopied && <p className="text-primary text-xs mt-2 text-right">تم نسخ الرابط!</p>}
                </div>

                {relatedArticles.length > 0 && (
                    <div className="mt-12 text-right">
                        <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-3">قد يعجبك أيضاً</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {relatedArticles.map(related => (
                                <NewsCard key={related.id} article={related} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <CommentsPanel
                isOpen={isCommentsPanelOpen}
                onClose={() => setIsCommentsPanelOpen(false)}
                commentsData={articleComments}
                onAddComment={handleAddComment}
                onReportComment={handleReportComment}
            />
        </>
    );
}

export default ArticleDetailPage;