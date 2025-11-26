

import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Category } from '../types';
import { PlayCircle, Clock } from 'lucide-react';

const VideosPage: React.FC = () => {
      const { articles } = useData();
      const displayVideos = articles.filter(a => a.category === Category.VIDEO);
  
      return (
          <div className="container mx-auto px-4 py-8">
               <h1 className="text-3xl font-black text-white mb-8 flex items-center border-r-4 border-red-600 pr-4">
                  <PlayCircle className="ml-3 text-red-600" size={32} />
                  أحدث الفيديوهات والملخصات
              </h1>
              {displayVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayVideos.map((video) => (
                        <Link to={`/article/${video.id}`} key={video.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-red-900/50 transition-all shadow-lg group">
                            <div className="relative aspect-video bg-black">
                                {video.videoEmbedId ? (
                                    <iframe 
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${video.videoEmbedId}`} 
                                        title={video.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                        <img src={video.imageUrl} alt={video.title} className="w-full h-full object-cover opacity-50"/>
                                        <PlayCircle size={48} className="absolute text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] bg-red-600/20 text-red-500 px-2 py-1 rounded font-bold">ملخص</span>
                                    <div className="flex items-center text-xs text-slate-500">
                                        <Clock size={12} className="ml-1" />
                                        <span>{new Date(video.date).toLocaleDateString('ar-SA')}</span>
                                    </div>
                                </div>
                                <h3 className="font-bold text-white text-lg line-clamp-2 mb-2 group-hover:text-red-500 transition-colors">{video.title}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
                    <p className="text-slate-500">لا يوجد محتوى فيديو متاح حالياً.</p>
                </div>
              )}
          </div>
      )
}

export default VideosPage;
