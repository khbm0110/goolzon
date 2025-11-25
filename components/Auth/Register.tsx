
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, AtSign, Loader2, AlertCircle, Trophy, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../App';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (formData.username.includes(' ')) {
      setError('اسم المستخدم لا يجب أن يحتوي على مسافات');
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const success = register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (success) {
        navigate('/profile');
      } else {
        setError('اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950">
      
      {/* 1. STADIUM BACKGROUND */}
      <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200" 
            alt="Stadium" 
            className="w-full h-full object-cover opacity-40 scale-110 animate-[pulse_10s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/80 backdrop-blur-sm"></div>
          
          {/* Animated Spotlights */}
          <div className="absolute top-0 left-1/4 w-32 h-full bg-emerald-500/5 rotate-12 blur-3xl animate-[pulse_4s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 right-1/4 w-32 h-full bg-primary/5 -rotate-12 blur-3xl animate-[pulse_5s_ease-in-out_infinite_1s]"></div>
      </div>

      {/* 2. THE CONTRACT CARD (PITCH STYLE) */}
      <div className={`relative z-10 w-full max-w-lg transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        
        {/* Floating Header Icon */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-primary to-emerald-700 rounded-full p-1 shadow-[0_0_40px_rgba(16,185,129,0.4)] z-20 flex items-center justify-center border-4 border-slate-950">
             <Trophy size={40} className="text-white drop-shadow-md" />
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Pitch Lines Decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white rounded-full"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-white/50"></div>
                 <div className="absolute top-0 left-0 w-full h-full border-2 border-white m-4 rounded-xl"></div>
            </div>

            <div className="p-8 pt-16 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">عقد انضمام لاعب</h1>
                    <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest">الموسم الجديد {new Date().getFullYear()}</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-200 text-sm animate-pulse">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Input Group 1 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase mr-1 group-focus-within:text-emerald-400 transition-colors">الاسم الكامل</label>
                            <div className="relative">
                                <UserIcon className="absolute right-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                <input 
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 pr-10 text-white focus:border-emerald-500 outline-none transition-all focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    placeholder="الاسم"
                                />
                            </div>
                        </div>
                        <div className="space-y-1 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase mr-1 group-focus-within:text-emerald-400 transition-colors">اللقب (Username)</label>
                            <div className="relative">
                                <AtSign className="absolute right-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                <input 
                                    type="text"
                                    name="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 pr-10 text-white focus:border-emerald-500 outline-none transition-all focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] text-left"
                                    style={{direction: 'ltr'}}
                                    placeholder="username"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1 group">
                        <label className="text-[10px] font-black text-slate-400 uppercase mr-1 group-focus-within:text-emerald-400 transition-colors">البريد الإلكتروني</label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                            <input 
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 pr-10 text-white focus:border-emerald-500 outline-none transition-all focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {/* Passwords */}
                    <div className="space-y-1 group">
                        <label className="text-[10px] font-black text-slate-400 uppercase mr-1 group-focus-within:text-emerald-400 transition-colors">كلمة المرور</label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                            <input 
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 pr-10 text-white focus:border-emerald-500 outline-none transition-all focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 group">
                         <div className="relative">
                            <Lock className="absolute right-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                            <input 
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 pr-10 text-white focus:border-emerald-500 outline-none transition-all focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                placeholder="تأكيد كلمة المرور"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-900 font-black text-lg py-4 rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_25px_rgba(16,185,129,0.4)] mt-4 flex items-center justify-center gap-2 group"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <CheckCircle2 size={20} className="group-hover:scale-125 transition-transform" />
                                توقيع العقد والانضمام
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <p className="text-slate-400 text-sm">
                        وقعت عقداً سابقاً؟{' '}
                        <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 hover:underline transition-colors">
                             الدخول لغرفة الملابس
                        </Link>
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
