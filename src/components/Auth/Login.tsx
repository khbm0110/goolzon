
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, AlertCircle, ArrowRight, Shield, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleQuickLogin = (type: 'ADMIN' | 'USER') => {
      if (type === 'ADMIN') {
          setFormData({ email: 'admin@goolzon.com', password: 'password123' });
      } else {
          setFormData({ email: 'demo@goolzon.com', password: 'password123' });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
        const result = await login(formData.email, formData.password);
        if (result.success) {
            // Check if user is admin and redirect accordingly
            if (result.isAdmin) {
                navigate('/admin');
            } else {
                navigate('/profile');
            }
        } else {
            setError(result.error || 'فشل تسجيل الدخول. تحقق من بياناتك.');
        }
    } catch (err: any) {
        setError(err.message || 'فشل تسجيل الدخول. حاول مرة أخرى.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm transition-colors">
            <ArrowRight size={16} className="ml-1"/> العودة للرئيسية
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">تسجيل الدخول</h1>
          <p className="text-slate-400 text-sm">أهلاً بك مجدداً في goolzon</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="flex flex-col items-center justify-center p-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors group"
            >
                <Shield className="text-red-500 mb-1 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-xs font-bold text-red-400">حساب مدير</span>
            </button>
            <button 
                type="button"
                onClick={() => handleQuickLogin('USER')}
                className="flex flex-col items-center justify-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors group"
            >
                <Users className="text-blue-500 mb-1 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-xs font-bold text-blue-400">مستخدم تجريبي</span>
            </button>
        </div>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">أو استخدم البريد</span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 mr-1">البريد الإلكتروني</label>
            <div className="relative">
              <User className="absolute right-3 top-3 text-slate-500" size={18} />
              <input 
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
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
            className="w-full bg-primary hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] mt-6 flex items-center justify-center disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
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
        
      </div>
    </div>
  );
};

export default Login;
