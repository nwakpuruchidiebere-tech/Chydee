import React, { useState } from 'react';
import {
  Share2,
  CheckCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Camera,
  Loader2,
  Save,
  Twitter,
  Instagram,
  Youtube,
  Github,
  MessageSquare,
  Video,
  Landmark,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  Hash,
  CreditCard,
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  formatAccountNumber,
  maskAccountNumber,
  PAYSOCIAL_DEFAULT_ROUTING,
  PAYSOCIAL_BANK_NAME,
  PAYSOCIAL_ACCOUNT_TYPE,
} from '../lib/accountUtils';

interface SocialAccountsHubProps {
  currentUser: UserProfile | null;
  onUpdateSocials: (updatedSocials: {
    socialTwitter?: string;
    socialInstagram?: string;
    socialTikTok?: string;
    socialYouTube?: string;
    socialGitHub?: string;
    socialDiscord?: string;
    bio?: string;
  }) => Promise<void>;
  onRegenerateAccountNumber?: () => Promise<void>;
}

export const SocialAccountsHub: React.FC<SocialAccountsHubProps> = ({
  currentUser,
  onUpdateSocials,
  onRegenerateAccountNumber,
}) => {
  const { isDark } = useTheme();
  const [twitter, setTwitter] = useState(currentUser?.socialTwitter || 'alexsmith');
  const [instagram, setInstagram] = useState(currentUser?.socialInstagram || 'alex_builds');
  const [tiktok, setTiktok] = useState(currentUser?.socialTikTok || 'alex_social');
  const [youtube, setYoutube] = useState(currentUser?.socialYouTube || 'AlexSmithTech');
  const [github, setGithub] = useState(currentUser?.socialGitHub || 'alex-smith');
  const [discord, setDiscord] = useState(currentUser?.socialDiscord || 'alex#1337');
  const [bio, setBio] = useState(currentUser?.bio || 'Building open social payments & splitting dinners 🍕');

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gemini Nano Banana 2.1 - Create & Edit Images for social badges
  const [badgePrompt, setBadgePrompt] = useState('Vibrant holographic verified creator payment badge with neon stars');
  const [base64BadgeSource, setBase64BadgeSource] = useState<string | null>(null);
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);
  const [generatedBadgeUrl, setGeneratedBadgeUrl] = useState<string | null>(null);

  const handleCopyLink = () => {
    const link = `https://paysocial.me/@${currentUser?.username || 'user'}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerate = async () => {
    if (!onRegenerateAccountNumber) return;
    if (window.confirm('Generate a new 10-digit PaySocial payment account number? Your previous account number will be replaced.')) {
      try {
        setIsRegenerating(true);
        await onRegenerateAccountNumber();
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  const handleSaveSocials = async () => {
    try {
      setIsSaving(true);
      await onUpdateSocials({
        socialTwitter: twitter.trim(),
        socialInstagram: instagram.trim(),
        socialTikTok: tiktok.trim(),
        socialYouTube: youtube.trim(),
        socialGitHub: github.trim(),
        socialDiscord: discord.trim(),
        bio: bio.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save socials error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUploadForEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBase64BadgeSource(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateOrEditBadge = async () => {
    try {
      setIsGeneratingBadge(true);
      const res = await fetch('/api/gemini/create-edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: badgePrompt,
          base64Image: base64BadgeSource || undefined,
          mimeType: 'image/png',
        }),
      });

      if (!res.ok) {
        throw new Error('Badge creation failed');
      }

      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedBadgeUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('Badge generation error:', err);
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Social Profile Showcase Card */}
      <div className={`border rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30'
          : 'bg-white border-2 border-indigo-200 shadow-md'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar with verified social ring */}
          <div className="relative">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className={`w-24 h-24 rounded-3xl object-cover ring-4 shadow-xl ${
                  isDark ? 'ring-indigo-500/50' : 'ring-indigo-500/40'
                }`}
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-3xl shadow-xl">
                {currentUser?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className={`absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl border-2 shadow ${
              isDark ? 'border-slate-900' : 'border-white'
            }`}>
              <CheckCircle className="w-4 h-4 fill-emerald-400 text-slate-900" />
            </div>
          </div>

          {/* User Info & Handle */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {currentUser?.displayName}
              </h2>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border w-fit mx-auto sm:mx-0 ${
                isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                @{currentUser?.username}
              </span>
            </div>

            <p className={`text-sm mt-2 max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>{bio}</p>

            {/* Quick Share Link & Connected Social Tags */}
            <div className="mt-4 flex items-center gap-3 flex-wrap justify-center md:justify-start">
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                <span>{copiedLink ? 'Copied Link!' : `paysocial.me/@${currentUser?.username}`}</span>
              </button>

              {twitter && (
                <a
                  href={`https://twitter.com/${twitter}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isDark
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20'
                      : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                  }`}
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>@{twitter}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isDark
                      ? 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20'
                      : 'bg-pink-50 text-pink-700 border-pink-300 hover:bg-pink-100'
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>@{instagram}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {github && (
                <a
                  href={`https://github.com/${github}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isDark
                      ? 'bg-slate-700/30 text-slate-300 border-slate-700 hover:bg-slate-700/50'
                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>@{github}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Generated Payment Account & Routing Details Card */}
      <div
        className={`border rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/30'
            : 'bg-white border-2 border-indigo-200 shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Auto-Generated Payment Account
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Instant Transfer Active
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Unique 10-digit virtual account automatically generated for peer payments and direct deposits
              </p>
            </div>
          </div>

          {onRegenerateAccountNumber && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border self-start sm:self-center disabled:opacity-50 ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
              }`}
              title="Automatically generate a fresh 10-digit account number"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Generating...' : 'Regenerate Account #'}</span>
            </button>
          )}
        </div>

        {/* Banking Details Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Account Number Field */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Account Number
              </span>
              <button
                type="button"
                onClick={() => setShowAccountNumber(!showAccountNumber)}
                className={`p-1 rounded-md transition ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
                title={showAccountNumber ? 'Mask account number' : 'Show full account number'}
              >
                {showAccountNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className={`font-mono text-base font-black tracking-wider ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
              {showAccountNumber
                ? formatAccountNumber(currentUser?.accountNumber || '8849201842')
                : maskAccountNumber(currentUser?.accountNumber || '8849201842')}
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">10-Digit Direct Pay</span>
              <button
                type="button"
                onClick={() => handleCopyText(currentUser?.accountNumber || '8849201842', 'acc')}
                className={`text-[11px] font-bold flex items-center gap-1 transition ${
                  copiedField === 'acc'
                    ? 'text-emerald-400 font-extrabold'
                    : isDark
                    ? 'text-indigo-400 hover:text-indigo-300'
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
              >
                {copiedField === 'acc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'acc' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Routing Number Field */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Routing (ACH / Wire)
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className={`font-mono text-base font-black tracking-wider ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {currentUser?.routingNumber || PAYSOCIAL_DEFAULT_ROUTING}
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">FedWire & Instant RTP</span>
              <button
                type="button"
                onClick={() => handleCopyText(currentUser?.routingNumber || PAYSOCIAL_DEFAULT_ROUTING, 'routing')}
                className={`text-[11px] font-bold flex items-center gap-1 transition ${
                  copiedField === 'routing'
                    ? 'text-emerald-400 font-extrabold'
                    : isDark
                    ? 'text-indigo-400 hover:text-indigo-300'
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
              >
                {copiedField === 'routing' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'routing' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Bank / Clearing House */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Bank Institution
            </span>
            <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {PAYSOCIAL_BANK_NAME}
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">FDIC Partner Clearing</span>
              <span className="text-[10px] font-semibold text-emerald-500">Verified</span>
            </div>
          </div>

          {/* Account Type */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Account Type
            </span>
            <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {currentUser?.accountType || PAYSOCIAL_ACCOUNT_TYPE}
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Interest APY 4.75%</span>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(`https://paysocial.me/pay/${currentUser?.accountNumber || '8849201842'}`, 'paylink')
                }
                className={`text-[11px] font-bold flex items-center gap-1 transition ${
                  copiedField === 'paylink'
                    ? 'text-emerald-400 font-extrabold'
                    : isDark
                    ? 'text-indigo-400 hover:text-indigo-300'
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
                title="Copy Direct Payment Link with your Account Number"
              >
                {copiedField === 'paylink' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'paylink' ? 'Link Copied!' : 'Pay Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manage Connected Social Media Accounts */}
        <div className={`border rounded-3xl p-6 shadow-xl space-y-5 transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Share2 className="w-5 h-5 text-indigo-500" />
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Connect Social Accounts</h3>
            </div>
            {saveSuccess && (
              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            Link your social media profiles so friends can discover your payment handle, verify your identity, and tip you directly on PaySocial.
          </p>

          <div className="space-y-3.5">
            {/* Twitter */}
            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Twitter className="w-4 h-4 text-sky-500" /> Twitter / X Username
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>@</span>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value.replace('@', ''))}
                  placeholder="username"
                  className={`w-full border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Instagram className="w-4 h-4 text-pink-500" /> Instagram Username
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                  placeholder="username"
                  className={`w-full border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                />
              </div>
            </div>

            {/* TikTok */}
            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Video className="w-4 h-4 text-teal-500" /> TikTok Handle
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>@</span>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value.replace('@', ''))}
                  placeholder="handle"
                  className={`w-full border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                />
              </div>
            </div>

            {/* YouTube */}
            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Youtube className="w-4 h-4 text-rose-500" /> YouTube Channel
              </label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="Channel Name or @handle"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                }`}
              />
            </div>

            {/* GitHub */}
            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Github className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} /> GitHub Handle
              </label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="github-username"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                }`}
              />
            </div>

            {/* Discord */}
            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <MessageSquare className="w-4 h-4 text-indigo-500" /> Discord Tag
              </label>
              <input
                type="text"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="username#0000 or handle"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                }`}
              />
            </div>

            {/* Bio */}
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Bio / Status</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={300}
                className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                }`}
              />
            </div>
          </div>

          <button
            onClick={handleSaveSocials}
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Social Media Accounts
          </button>
        </div>

        {/* AI Social Badge & Artwork Studio (gemini-nano-banana-2.1) */}
        <div className={`border rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Create & Edit Social Badges</h3>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              Use <strong className={`${isDark ? 'text-pink-300' : 'text-pink-700'} font-semibold`}>gemini-nano-banana-2.1</strong> to create custom social payment skins, avatar badges, or edit existing photos with text prompts!
            </p>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Text Prompt (Instructions to Create or Edit):
                </label>
                <textarea
                  value={badgePrompt}
                  onChange={(e) => setBadgePrompt(e.target.value)}
                  rows={2}
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                />
              </div>

              {/* Optional reference/source image upload for image editing */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Optional: Upload Base Image to Edit
                </label>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition border ${
                    isDark
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}>
                    <Camera className="w-4 h-4 text-pink-500" />
                    <span>Choose Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUploadForEdit} className="hidden" />
                  </label>
                  {base64BadgeSource && (
                    <span className="text-xs text-emerald-500 font-bold">Image Loaded for Edit</span>
                  )}
                </div>

                {base64BadgeSource && (
                  <div className={`mt-2 w-16 h-16 rounded-xl overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                    <img src={base64BadgeSource} alt="Source" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerateOrEditBadge}
                disabled={isGeneratingBadge || !badgePrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 disabled:opacity-50"
              >
                {isGeneratingBadge ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rendering with gemini-nano-banana-2.1...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {base64BadgeSource ? 'Edit Image with Nano Banana 2.1' : 'Create Social Badge with Nano Banana 2.1'}
                  </>
                )}
              </button>

              {/* Generated Result */}
              {generatedBadgeUrl && (
                <div className={`mt-4 p-4 rounded-2xl border text-center animate-in zoom-in-95 duration-200 ${
                  isDark ? 'bg-slate-950/80 border-pink-500/40' : 'bg-pink-50/70 border-pink-300'
                }`}>
                  <span className={`text-xs font-bold block mb-2 ${isDark ? 'text-pink-300' : 'text-pink-800'}`}>
                    Custom Social Payment Badge Created!
                  </span>
                  <div className="w-32 h-32 rounded-2xl mx-auto overflow-hidden shadow-xl ring-2 ring-pink-500/50">
                    <img src={generatedBadgeUrl} alt="Generated badge" className="w-full h-full object-cover" />
                  </div>
                  <a
                    href={generatedBadgeUrl}
                    download="paysocial_badge.png"
                    className="inline-block mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow"
                  >
                    Download Badge
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
