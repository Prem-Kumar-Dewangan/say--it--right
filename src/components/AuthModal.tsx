import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Sparkles, CheckCircle2, ArrowRight, Database } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register, loginAsDemo, dbStatus, openDbExplorer } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await login(email, password);
        if (!res.success) setError(res.error || 'Failed to sign in.');
      } else {
        const res = await register(name, email, password);
        if (!res.success) setError(res.error || 'Failed to register.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-2xl border border-stone-200 shadow-xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Banner */}
        <div className="p-6 bg-stone-900 text-stone-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Vault</span>
            </div>
            {dbStatus.connected && (
              <button
                type="button"
                onClick={() => {
                  closeAuthModal();
                  openDbExplorer();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-[10px] text-emerald-300 font-medium transition-colors cursor-pointer"
                title="Click to inspect all database records"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <Database className="w-3 h-3 text-emerald-400" />
                <span>DB Active (Inspect)</span>
              </button>
            )}
          </div>
          <h2 className="text-xl font-editorial font-medium text-white">
            {tab === 'login' ? 'Welcome Back' : 'Create Account in Database'}
          </h2>
          <p className="text-xs text-stone-300">
            Your credentials and coached messages are saved directly into the secure database.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-100 border-b border-stone-200">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          {tab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-stone-300 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In' : 'Create My Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Quick Demo Login Alternative */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">Want to test quickly?</span>
            <button
              type="button"
              onClick={loginAsDemo}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
            >
              Instant Demo Sign In ⚡
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
