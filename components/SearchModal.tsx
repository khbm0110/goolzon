import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronLeft } from 'lucide-react';
import { Article } from '../types';
import { Link } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, articles }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }
    
    const searchTerms = query.toLowerCase().split(' ');
    const filtered = articles.filter(article => {
      const title = article.title.toLowerCase();
      const content = article.content.toLowerCase();
      return searchTerms.every(term => title.includes(term) || content.includes(term));
    });
    setResults(filtered.slice(0, 5));
  }, [query, articles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Input */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="ابحث عن فريق، لاعب، أو بطولة..."
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

        {/* Results */}
        <div className="overflow-y-auto p-2">
          {query && results.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              لا توجد نتائج مطابقة لـ "{query}"
            </div>
          )}
          
          {!query && (
             <div className="p-4">
               <span className="text-xs font-bold text-slate-500 mb-2 block">كلمات شائعة</span>
               <div className="flex flex-wrap gap-2">
                 {['الهلال', 'النصر', 'رونالدو', 'الدوري السعودي', 'الكويت'].map(tag => (
                   <button 
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm transition-colors"
                   >
                     {tag}
                   </button>
                 ))}
               </div>
             </div>
          )}

          {results.map(article => (
            <Link 
              key={article.id} 
              to={`/article/${article.id}`}
              onClick={onClose}
              className="flex items-start gap-4 p-3 hover:bg-slate-800/50 rounded-xl transition-colors group"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-primary font-bold px-1.5 py-0.5 bg-primary/10 rounded">{article.category}</span>
                    <span className="text-[10px] text-slate-500">{new Date(article.date).toLocaleDateString('ar-SA')}</span>
                 </div>
                 <h4 className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{article.title}</h4>
                 <p className="text-xs text-slate-400 line-clamp-1 mt-1">{article.summary}</p>
              </div>
              <ChevronLeft size={16} className="text-slate-600 mt-2" />
            </Link>
          ))}
        </div>
        
        {results.length > 0 && (
          <div className="bg-slate-950 p-2 text-center border-t border-slate-800 text-[10px] text-slate-500">
             عرض {results.length} نتائج
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;