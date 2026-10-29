import React from 'react';
import {
  CreditCard,
  Send,
  Users,
  HardDrive,
  Sparkles,
  LogOut,
  Mic,
  Share2,
  Sun,
  Moon,
  Copy,
  Check,
  Hash,
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { maskAccountNumber, formatAccountNumber } from '../lib/accountUtils';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: 'feed' | 'socials' | 'workspace' | 'ai';
  setActiveTab: (tab: 'feed' | 'socials' | 'workspace' | 'ai') => void;
  onOpenSendModal: () => void;
  onOpenLiveVoice: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenSendModal,
  onOpenLiveVoice,
  onLogout,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [copiedAcc, setCopiedAcc] = React.useState(false);

  const handleCopyAccount = (accountNum?: string) => {
    if (!accountNum) return;
    navigator.clipboard.writeText(accountNum);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        isDark ? 'bg-slate-950/85 border-slate-800' : 'bg-white/95 border-slate-300 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Pay<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Social</span>
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isDark
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                Fintech + Social
              </span>
            </div>
            <p className={`text-xs hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              Transfers, Social Profiles & Google Workspace
            </p>
          </div>
        </div>

        {/* Center Nav tabs */}
        <nav
          className={`hidden md:flex items-center gap-1 p-1.5 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-300 shadow-xs'
          }`}
        >
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'feed'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
          >
            <Users className="w-4 h-4" />
            Social Feed
          </button>

          <button
            onClick={() => setActiveTab('socials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'socials'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Social Accounts
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'workspace'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Drive, Gmail & Contacts
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm shadow-purple-900/40'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-500" />
            AI Intelligence
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* User-Controlled Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to High-Contrast Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to High-Contrast Light Mode' : 'Switch to Dark Mode'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border shadow-xs ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-750 hover:border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
                <span className="hidden lg:inline text-slate-200">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-700 animate-in spin-in-90 duration-300" />
                <span className="hidden lg:inline text-slate-900">Dark</span>
              </>
            )}
          </button>

          {/* Live Voice quick launch */}
          <button
            onClick={onOpenLiveVoice}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition shadow-sm hover:scale-[1.02] border ${
              isDark
                ? 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border-pink-500/30'
                : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'
            }`}
            title="Start real-time voice conversation with Gemini 3.8 Live"
          >
            <Mic className="w-4 h-4 text-pink-500 animate-pulse" />
            <span className="hidden sm:inline font-bold">Live AI</span>
          </button>

          {/* Send / Request Money button */}
          <button
            onClick={onOpenSendModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold transition shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Pay & Split</span>
          </button>

          {/* User Profile & Balance badge */}
          {user && (
            <div className={`flex items-center gap-3 pl-2 border-l ${isDark ? 'border-slate-800' : 'border-slate-300'}`}>
              <div className="text-right hidden lg:block">
                <div className={`text-xs font-extrabold flex items-center justify-end gap-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="tabular-nums font-mono">
                    ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>@{user.username}</span>
                  {user.accountNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(user.accountNumber)}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition flex items-center gap-1 ${
                        copiedAcc
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isDark
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-750'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                      title="Click to copy 10-digit Payment Account Number"
                    >
                      {copiedAcc ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Hash className="w-2.5 h-2.5 text-indigo-400" />
                          <span>{maskAccountNumber(user.accountNumber)}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className={`w-9 h-9 rounded-full ring-2 object-cover ${isDark ? 'ring-indigo-500/40' : 'ring-indigo-600/50'}`}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-700 font-bold text-white flex items-center justify-center text-sm shadow-sm">
                  {user.displayName.charAt(0)}
                </div>
              )}

              <button
                onClick={onLogout}
                className={`p-2 rounded-xl transition ${
                  isDark
                    ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                }`}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav bar */}
      <div
        className={`md:hidden flex items-center justify-around py-2 border-t text-xs transition-colors ${
          isDark ? 'border-slate-800/60 bg-slate-900/90' : 'border-slate-300 bg-white/95'
        }`}
      >
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 font-semibold ${
            activeTab === 'feed' ? 'text-indigo-600 font-bold' : isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Feed</span>
        </button>
        <button
          onClick={() => setActiveTab('socials')}
          className={`flex flex-col items-center gap-1 font-semibold ${
            activeTab === 'socials' ? 'text-indigo-600 font-bold' : isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Socials</span>
        </button>
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex flex-col items-center gap-1 font-semibold ${
            activeTab === 'workspace' ? 'text-indigo-600 font-bold' : isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Workspace</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center gap-1 font-semibold ${
            activeTab === 'ai' ? 'text-pink-600 font-bold' : isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Studio</span>
        </button>
      </div>
    </header>
  );
};
