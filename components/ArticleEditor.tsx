import React, { useState, useEffect } from 'react';
import { Article, Category } from '../types';
import { Save, X, Wand2, Loader2, Image as ImageIcon } from 'lucide-react';
import { generateArticleContent } from '../services/geminiService';

interface ArticleEditorProps {
    initialData: Partial<Article>;
    onSave: (article: Article) => Promise<void>;
    onCancel: () => void;
    mode: 'NEW' | 'EDIT';
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ initialData, onSave, onCancel, mode }) => {
    const [article, setArticle] = useState<Partial<Article>>(initialData);
    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setArticle(initialData);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setArticle(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateAI = async () => {
        if (!aiTopic) {
            alert('Please enter a topic for the AI to write about.');
            return;
        }
        setIsGenerating(true);
        try {
            const generated = await generateArticleContent(aiTopic);
            if (generated) {
                const categoryValues = Object.values(Category) as string[];
                const safeCategory = categoryValues.includes(generated.category)
                    ? generated.category as Category
                    : Category.SAUDI;

                setArticle(prev => ({
                    ...prev,
                    title: generated.title,
                    summary: generated.summary,
                    content: generated.content,
                    category: safeCategory,
                    imageUrl: generated.imageUrl,
                    isBreaking: generated.hasNews,
                }));
            } else {
                alert('فشل الذكاء الاصطناعي في إنشاء المحتوى. يرجى التأكد من تكوين مفتاح API بشكل صحيح في متغيرات بيئة Vercel والمحاولة مرة أخرى.');
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert('An error occurred while generating the article.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!article.title || !article.summary || !article.content) {
            alert('Please fill in title, summary, and content.');
            return;
        }
        onSave(article as Article);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-800 bg-slate-950">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wand2 className="text-primary" />
                    {mode === 'NEW' ? 'مقال جديد' : `تعديل مقال: ${initialData.title}`}
                </h2>
                <p className="text-slate-400 text-sm mt-2">
                    املأ الحقول يدويًا أو استخدم مساعد الذكاء الاصطناعي لإنشاء محتوى حصري.
                </p>
            </div>

            {/* AI Generation Section */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="أدخل موضوعًا (مثال: نتيجة مباراة الهلال والنصر الأخيرة)"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none"
                        disabled={isGenerating}
                    />
                    <button
                        type="button"
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                        {isGenerating ? 'جاري الكتابة...' : 'اكتب يا AI'}
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300">العنوان</label>
                        <input name="title" value={article.title || ''} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" required />
                    </div>
                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300">القسم</label>
                        <select name="category" value={article.category || Category.SAUDI} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                            {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">الملخص</label>
                    <textarea name="summary" value={article.summary || ''} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" required />
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">المحتوى الكامل (يدعم HTML)</label>
                    <textarea name="content" value={article.content || ''} onChange={handleChange} rows={10} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none font-mono" placeholder="<p>اكتب هنا...</p>" required />
                </div>

                {/* Image & Video */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300">رابط الصورة</label>
                         <div className="relative">
                           <ImageIcon className="absolute right-3 top-3.5 text-slate-500" size={16} />
                           <input name="imageUrl" value={article.imageUrl || ''} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pr-10 text-white focus:border-primary outline-none" placeholder="https://..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300">معرف فيديو يوتيوب (اختياري)</label>
                        <input name="videoEmbedId" value={article.videoEmbedId || ''} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="dQw4w9WgXcQ" />
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-slate-800 flex justify-end gap-4">
                    <button type="button" onClick={onCancel} className="px-8 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-colors">
                        إلغاء
                    </button>
                    <button type="submit" className="px-8 py-3 rounded-xl bg-primary text-slate-900 font-black hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                        <Save size={18} /> حفظ المقال
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ArticleEditor;