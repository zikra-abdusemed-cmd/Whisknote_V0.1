import React, { useState } from 'react';
import { Sparkles, ChefHat, Lock, Mail, User, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

export const AuthScreen: React.FC = () => {
  const { login, signup, loginDemo, isLoading, error, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);

  // Form states
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [experience, setExperience] = useState<UserProfile['bakingExperience']>('Home Baker');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginMode) {
      await login(email, password);
    } else {
      await signup(name, email, password, experience);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F5] flex flex-col justify-center items-center p-4 selection:bg-[#F0D1C2]">
      {/* Container */}
      <div className="w-full max-w-md bg-[#FFFDF9] border border-[#E8DFD8] rounded-3xl shadow-xl overflow-hidden">
        {/* Top Cozy Header */}
        <div className="bg-gradient-to-b from-[#FAF3EA] to-[#FFFDF9] p-8 text-center border-b border-[#EFE8DF] relative">
          <div className="inline-flex p-3 rounded-2xl bg-[#C26343] text-white shadow-md mb-3">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="font-serif-display text-3xl font-bold text-[#2E2520] tracking-tight">
            WhiskNote
          </h1>
          <p className="text-xs text-[#7A6A61] mt-1.5 font-medium">
            Your cozy personal digital baking notebook & assistant
          </p>

          <div className="flex justify-center items-center gap-1.5 mt-3 text-[11px] font-semibold text-[#588157] bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure cloud account · offline-first sync</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#EFE8DF] bg-[#FAF5EE]/60 text-xs font-bold text-[#7A6A61]">
          <button
            type="button"
            onClick={() => {
              clearError();
              setIsLoginMode(true);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              isLoginMode
                ? 'border-[#C26343] text-[#C26343] bg-white'
                : 'border-transparent hover:text-[#2E2520]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              clearError();
              setIsLoginMode(false);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              !isLoginMode
                ? 'border-[#C26343] text-[#C26343] bg-white'
                : 'border-transparent hover:text-[#2E2520]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider mb-1">
                  Baker Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#948378] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    maxLength={100}
                    autoComplete="name"
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Camille Laurent"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-medium text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#948378] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  maxLength={254}
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  onChange={e => setEmail(e.target.value)}
                  placeholder="camille@homebaker.co"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-medium text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#948378] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-medium text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden"
                />
              </div>
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider mb-1">
                  Baking Experience
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['Beginner', 'Home Baker', 'Artisan Pastry'] as UserProfile['bakingExperience'][]).map(lvl => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setExperience(lvl)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-colors ${
                        experience === lvl
                          ? 'bg-[#C26343] text-white border-[#C26343]'
                          : 'bg-white text-[#66574F] border-[#D9CFC7] hover:bg-[#FAF5EE]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#C26343] hover:bg-[#AE5638] text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLoginMode ? 'Enter WhiskNote' : 'Create Baking Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EFE8DF]" />
            </div>
            <div className="relative flex justify-center text-[11px] font-medium text-[#948378]">
              <span className="bg-[#FFFDF9] px-3">or jump right in</span>
            </div>
          </div>

          <button
            type="button"
            onClick={loginDemo}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-[#D9CFC7] bg-[#FAF5EE] hover:bg-[#F2ECE4] text-[#2E2520] text-xs font-bold flex items-center justify-center gap-2 transition-colors group"
          >
            <Sparkles className="w-4 h-4 text-[#C26343] group-hover:scale-110 transition-transform" />
            <span>Instant Home Baker Demo Access</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-[#FAF5EE] border-t border-[#EFE8DF] text-center text-[11px] text-[#8C7A70]">
          WhiskNote stores your recipes safely in your browser with full offline support.
        </div>
      </div>
    </div>
  );
};
