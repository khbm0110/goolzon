

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Category } from '../types';
import NewsCard from '../components/NewsCard';
import { Trophy } from 'lucide-react';

const CountryPage: React.FC = () => {
    const { articles } = useData();
    const location = useLocation();
    
    const categoryMap: Record<string, Category> = {
      '/country/saudi': Category.SAUDI,
      '/country/uae': Category.UAE,
      '/country/qatar': Category.QATAR,
      '/country/kuwait': Category.KUWAIT,
      '/country/oman': Category.OMAN,
      '/country/bahrain': Category.BAHRAIN,
      '/country/england': Category.ENGLAND,
      '/country/spain': Category.SPAIN,
      '/country/italy': Category.ITALY,
      '/country/germany': Category.GERMANY,
      '/country/champions-league': Category.CHAMPIONS_LEAGUE,
      '/analysis': Category.ANALYSIS,
    };
  
    const currentCategory = categoryMap[location.pathname] || Category.SAUDI;
    const filteredArticles = articles.filter(a => a.category === currentCategory);
  
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
          <div>
             <span className="text-primary text-sm font-bold tracking-widest uppercase mb-1 block">تغطية خاصة</span>
             <h1 className="text-3xl md:text-5xl font-black text-white">{currentCategory}</h1>
          </div>
          <div className="hidden md:block">
              <Trophy size={48} className="text-slate-800" />
          </div>
        </div>
  
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
            <p className="text-slate-500">لا توجد أخبار حالياً في هذا القسم.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    );
};

export default CountryPage;