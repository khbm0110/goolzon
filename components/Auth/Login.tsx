
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
// FIX: Replaced useApp with useAuth to correctly access login function.
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate API delay
    setTimeout(() => {
      const success = login(formData.username, formData.password);

      if (success) {
        navigate('/profile');
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm transition-colors">
            <ArrowRight size={16} className="ml-1"/> العودة للرئيسية
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">تسجيل الدخول</h1>
          <p className="text-slate-400 text-sm">أهلاً بك مجدداً في Gulf Sports</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 mr-1">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3 top-3 text-slate-500" size={18} />
              <input 
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="اسم المستخدم"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-white focus:border-primary outline-none transition-colors"
                style={{ direction: 'ltr', textAlign: 'right' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between">
                <label className="text-xs font-bold text-slate-400 mr-1">كلمة المرور</label>
                <a href="#" className="text-xs text-primary hover:underline">نسيت كلمة المرور؟</a>
            </div>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-slate-500" size={18} />
              <input 
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-white focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] mt-6 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'دخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            سجل الآن
          </Link>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-600">
            <p>للوصول إلى لوحة التحكم: استخدم <code className="font-mono bg-slate-800 px-1 rounded text-slate-400">admin</code> / <code className="font-mono bg-slate-800 px-1 rounded text-slate-400">admin123</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;