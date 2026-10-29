import React, { useState } from 'react';
import {
  Heart,
  Volume2,
  HardDrive,
  Mail,
  Search,
  Globe,
  Users,
  User,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  Loader2,
  Landmark,
  AlertCircle,
  Calendar,
  Hourglass,
  Check,
} from 'lucide-react';
import { Transaction, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { maskAccountNumber } from '../lib/accountUtils';
import { formatCurrencyAmount } from '../lib/currency';

interface SocialFeedProps {
  transactions: Transaction[];
  currentUser: UserProfile | null;
  onLikeTransaction: (txId: string) => void;
  onRequestSaveToDrive: (tx: Transaction) => void;
  onRequestSendEmailReceipt: (tx: Transaction) => void;
  onPayUser: (recipientName: string, recipientUsername: string) => void;
}

/**
 * Calculates human-friendly relative time from an ISO timestamp.
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return dateString;

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/**
 * Interactive Timestamp component with floating precise tooltip on hover and focus.
 */
interface TimestampWithTooltipProps {
  isoString: string;
  isDark: boolean;
}

export const TimestampWithTooltip: React.FC<TimestampWithTooltipProps> = ({ isoString, isDark }) => {
  const [isHovered, setIsHovered] = useState(false);

  const date = new Date(isoString);
  const isValid = !isNaN(date.getTime());

  if (!isValid) {
    return (
      <span className="flex items-center gap-1 text-[11px]">
        <Clock className="w-3 h-3 text-slate-400" />
        <span>{isoString}</span>
      </span>
    );
  }

  const shortDate = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const relativeTime = getRelativeTime(isoString);

  const fullDateStr = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const exactTimeStr = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  let timeZoneStr = '';
  try {
    timeZoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    timeZoneStr = 'Local Time';
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Transaction created on ${fullDateStr} at ${exactTimeStr} (${relativeTime})`}
    >
      <span
        className={`inline-flex items-center gap-1.5 cursor-help transition-all select-none border-b border-dotted ${
          isHovered
            ? isDark
              ? 'text-indigo-300 border-indigo-400 bg-indigo-950/30 px-1 py-0.5 rounded'
              : 'text-indigo-700 border-indigo-600 bg-indigo-50 px-1 py-0.5 rounded'
            : isDark
            ? 'text-slate-400 border-slate-600 hover:text-slate-200'
            : 'text-slate-600 border-slate-400 hover:text-slate-900'
        }`}
      >
        <Clock className="w-3 h-3 flex-shrink-0 text-indigo-400" />
        <span className="font-medium">{shortDate}</span>
        <span className="text-[10px] opacity-75 font-normal">({relativeTime})</span>
      </span>

      {/* Floating Detailed Timestamp Tooltip */}
      {isHovered && (
        <div
          role="tooltip"
          className={`absolute left-0 bottom-full mb-2 z-40 w-72 p-3.5 rounded-2xl shadow-2xl border text-xs pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 ${
            isDark
              ? 'bg-slate-950/95 text-slate-100 border-slate-700/80 shadow-indigo-950/60 backdrop-blur-md'
              : 'bg-slate-900 text-white border-slate-700 shadow-2xl backdrop-blur-md'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80">
            <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Precise Timestamp
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {relativeTime}
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Exact Date</div>
              <div className="font-semibold text-white text-[12px]">{fullDateStr}</div>
            </div>

            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Exact Time & Zone</div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-mono font-bold text-amber-300 text-sm tracking-tight">{exactTimeStr}</span>
                {timeZoneStr && (
                  <span className="text-[10px] text-slate-300 font-medium">({timeZoneStr})</span>
                )}
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800">
              <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">ISO 8601 UTC</div>
              <div className="font-mono text-[10px] text-slate-300 break-all select-all bg-slate-900/90 dark:bg-black/40 px-2 py-1 rounded border border-slate-800 mt-0.5">
                {date.toISOString()}
              </div>
            </div>
          </div>

          {/* Pointer callout arrow */}
          <div className="absolute left-6 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-slate-950" />
        </div>
      )}
    </div>
  );
};

/**
 * Visual Status Badge with icon for 'completed', 'pending', 'processing', or 'failed'
 */
interface TransactionStatusBadgeProps {
  status?: 'completed' | 'pending' | 'processing' | 'failed' | 'cancelled';
  isDark: boolean;
  size?: 'sm' | 'md';
}

export const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({
  status = 'completed',
  isDark,
  size = 'md',
}) => {
  const normalizedStatus = status || 'completed';

  if (normalizedStatus === 'pending') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full border transition-all ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        } ${
          isDark
            ? 'bg-amber-950/40 text-amber-300 border-amber-600/50 shadow-sm shadow-amber-950/50'
            : 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
        }`}
        title="Status: Pending. Payment is awaiting bank settlement or recipient clearance."
      >
        <Hourglass className="w-3 h-3 text-amber-500 animate-pulse flex-shrink-0" />
        <span>Pending</span>
      </span>
    );
  }

  if (normalizedStatus === 'processing') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full border transition-all ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        } ${
          isDark
            ? 'bg-blue-950/40 text-blue-300 border-blue-600/50 shadow-sm shadow-blue-950/50'
            : 'bg-blue-50 text-blue-800 border-blue-300 shadow-sm'
        }`}
        title="Status: Processing. Transaction is currently clearing across payment rails."
      >
        <Loader2 className="w-3 h-3 text-blue-500 animate-spin flex-shrink-0" />
        <span>Processing</span>
      </span>
    );
  }

  if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full border transition-all ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        } ${
          isDark
            ? 'bg-rose-950/40 text-rose-300 border-rose-600/50 shadow-sm shadow-rose-950/50'
            : 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm'
        }`}
        title={`Status: ${normalizedStatus}. Transaction was not settled.`}
      >
        <AlertCircle className="w-3 h-3 text-rose-500 flex-shrink-0" />
        <span className="capitalize">{normalizedStatus}</span>
      </span>
    );
  }

  // Default: completed
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border transition-all ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
      } ${
        isDark
          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/50 shadow-sm shadow-emerald-950/50'
          : 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
      }`}
      title="Status: Completed. Payment cleared and settled successfully."
    >
      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
      <span>Completed</span>
    </span>
  );
};

export const SocialFeed: React.FC<SocialFeedProps> = ({
  transactions,
  currentUser,
  onLikeTransaction,
  onRequestSaveToDrive,
  onRequestSendEmailReceipt,
  onPayUser,
}) => {
  const { isDark } = useTheme();
  const [filterTab, setFilterTab] = useState<'public' | 'friends' | 'mine'>('public');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handlePlayTTS = async (tx: Transaction) => {
    try {
      setPlayingAudioId(tx.id);
      const textToSpeak = `${tx.senderName} paid ${tx.receiverName} ${formatCurrencyAmount(tx.amount, tx.currency)} ${tx.currency} for ${tx.note}. Status is ${tx.status || 'completed'}. Payment recorded on PaySocial.`;

      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          speaker: 'Alex',
          style: 'Bright, cheerful, and clear payment announcer',
        }),
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      const data = await response.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => setPlayingAudioId(null);
        await audio.play();
      } else {
        setPlayingAudioId(null);
      }
    } catch (err) {
      console.error('TTS playback error:', err);
      setPlayingAudioId(null);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    // Tab filter
    if (filterTab === 'public' && tx.visibility !== 'public') return false;
    if (filterTab === 'friends' && tx.visibility === 'private') return false;
    if (filterTab === 'mine') {
      if (!currentUser) return false;
      if (tx.senderId !== currentUser.uid && tx.receiverId !== currentUser.uid) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const txStatus = tx.status || 'completed';
      if (txStatus !== statusFilter) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSender =
        tx.senderName.toLowerCase().includes(q) ||
        (tx.senderUsername && tx.senderUsername.toLowerCase().includes(q));
      const matchReceiver =
        tx.receiverName.toLowerCase().includes(q) ||
        (tx.receiverUsername && tx.receiverUsername.toLowerCase().includes(q));
      const matchNote = tx.note.toLowerCase().includes(q);
      const matchCategory = tx.category && tx.category.toLowerCase().includes(q);
      const matchStatus = tx.status && tx.status.toLowerCase().includes(q);
      return matchSender || matchReceiver || matchNote || matchCategory || matchStatus;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feed Filter & Search header */}
      <div
        className={`border rounded-2xl p-4 flex flex-col gap-4 transition-colors ${
          isDark
            ? 'bg-slate-900/80 border-slate-800 shadow-xl'
            : 'bg-white border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Main Feed Tabs */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border w-full md:w-auto ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => setFilterTab('public')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                filterTab === 'public'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Public Feed
            </button>

            <button
              onClick={() => setFilterTab('friends')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                filterTab === 'friends'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Friends & Contacts
            </button>

            <button
              onClick={() => setFilterTab('mine')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                filterTab === 'mine'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              My Payments
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search payments, @handles, status..."
              className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Status Filter Chips Row */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50 dark:border-slate-800/50 flex-wrap">
          <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Filter Status:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : isDark
                  ? 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-200/80'
              }`}
            >
              All Statuses
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition border ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : isDark
                  ? 'bg-slate-950/70 border-slate-800 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-800/60'
                  : 'bg-slate-100 border-slate-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition border ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : isDark
                  ? 'bg-slate-950/70 border-slate-800 text-amber-400 hover:bg-amber-950/40 hover:border-amber-800/60'
                  : 'bg-slate-100 border-slate-300 text-amber-800 hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>Pending</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      {filteredTransactions.length === 0 ? (
        <div
          className={`border rounded-2xl p-12 text-center transition-colors ${
            isDark ? 'bg-slate-900/50 border-slate-800/80 text-slate-400' : 'bg-white border-slate-300 text-slate-600 shadow-sm'
          }`}
        >
          <Sparkles className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <h4 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>No payment activity found</h4>
          <p className="text-xs max-w-sm mx-auto">
            {searchQuery
              ? `No transactions matching "${searchQuery}". Try a different keyword or filter.`
              : statusFilter !== 'all'
              ? `No ${statusFilter} transactions found. Switch status filter to view other transactions.`
              : 'Be the first to send or split a payment with friends on PaySocial!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => {
            const hasLiked = currentUser && tx.likes?.includes(currentUser.uid);
            const likesCount = tx.likes?.length || 0;
            const isPlayingThis = playingAudioId === tx.id;

            return (
              <div
                key={tx.id}
                className={`border rounded-2xl p-5 transition shadow-sm ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700/80 shadow-indigo-950/20'
                    : 'bg-white border-slate-300 hover:border-indigo-400 shadow-slate-200/50'
                }`}
              >
                {/* Header: Sender -> Receiver */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Sender avatar */}
                    <div className="relative">
                      {tx.senderAvatar ? (
                        <img
                          src={tx.senderAvatar}
                          alt={tx.senderName}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-base">
                          {tx.senderName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />

                    {/* Receiver avatar */}
                    <div className="relative">
                      {tx.receiverAvatar ? (
                        <img
                          src={tx.receiverAvatar}
                          alt={tx.receiverName}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-purple-500/30"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-purple-600 flex items-center justify-center font-bold text-white text-base">
                          {tx.receiverName.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Names, Status & Interactive Timestamp */}
                    <div className="ml-1">
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <button
                          onClick={() => onPayUser(tx.senderName, tx.senderUsername || '')}
                          className={`font-bold transition ${
                            isDark ? 'text-white hover:text-indigo-400' : 'text-slate-950 hover:text-indigo-600'
                          }`}
                        >
                          {tx.senderName}
                        </button>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>paid</span>
                        <button
                          onClick={() => onPayUser(tx.receiverName, tx.receiverUsername || '')}
                          className={`font-bold transition ${
                            isDark ? 'text-white hover:text-purple-400' : 'text-slate-950 hover:text-purple-600'
                          }`}
                        >
                          {tx.receiverName}
                        </button>
                      </div>

                      {/* Metadata Row: Interactive Timestamp with Hover Tooltip + Status + Category + Account */}
                      <div className={`flex items-center gap-2 text-[11px] mt-1 flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {/* Interactive Hover Tooltip for Precise Timestamp */}
                        <TimestampWithTooltip isoString={tx.createdAt} isDark={isDark} />

                        <span>•</span>

                        {/* Status Indicator Icon & Pill */}
                        <TransactionStatusBadge status={tx.status} isDark={isDark} size="sm" />

                        <span>•</span>
                        <span className="capitalize">{tx.visibility}</span>

                        {tx.category && (
                          <>
                            <span>•</span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold border ${
                                isDark
                                  ? 'bg-slate-800 text-indigo-300 border-slate-700'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              #{tx.category}
                            </span>
                          </>
                        )}

                        {tx.receiverAccountNumber && (
                          <>
                            <span>•</span>
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                                isDark
                                  ? 'bg-indigo-950/50 text-indigo-300 border-indigo-800/60'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                              title={`Direct transfer to account: ${tx.receiverAccountNumber}`}
                            >
                              <Landmark className="w-2.5 h-2.5 text-indigo-500" />
                              <span>Acc {maskAccountNumber(tx.receiverAccountNumber)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount badge & Prominent Status Indicator */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-base font-extrabold tabular-nums font-mono ${
                          isDark ? 'text-emerald-400' : 'text-emerald-600 font-black'
                        }`}
                      >
                        {formatCurrencyAmount(tx.amount, tx.currency)}
                      </span>
                      <span className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                        {tx.currency}
                      </span>
                    </div>

                    {/* Status Indicator Badge */}
                    <TransactionStatusBadge status={tx.status} isDark={isDark} size="md" />
                  </div>
                </div>

                {/* Note with emoji */}
                <div
                  className={`mt-3.5 border rounded-xl p-3 flex items-center gap-3 transition-colors ${
                    isDark ? 'bg-slate-950/60 border-slate-800/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {tx.emoji && <span className="text-2xl">{tx.emoji}</span>}
                  <p className={`text-sm leading-snug font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {tx.note}
                  </p>
                </div>

                {/* Footer Actions: Reactions, TTS, Google Drive, Gmail */}
                <div
                  className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-wrap ${
                    isDark ? 'border-slate-800/80' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Like / Heart */}
                    <button
                      onClick={() => onLikeTransaction(tx.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        hasLiked
                          ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                          : isDark
                          ? 'bg-slate-800/60 text-slate-400 border-transparent hover:text-rose-400 hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{likesCount}</span>
                    </button>

                    {/* Listen to Receipt (gemini-3.8-flash-tts) */}
                    <button
                      onClick={() => handlePlayTTS(tx)}
                      disabled={isPlayingThis}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        isDark
                          ? 'bg-slate-800/60 text-slate-300 border-transparent hover:text-white hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Listen to payment receipt audio generated by Gemini 3.8 Flash TTS"
                    >
                      {isPlayingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
                          <span className="text-pink-600 font-bold">Speaking...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>TTS Audio</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Workspace Actions */}
                  <div className="flex items-center gap-2">
                    {/* Google Drive Receipt */}
                    <button
                      onClick={() => onRequestSaveToDrive(tx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        tx.driveReceiptId
                          ? isDark
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                          : isDark
                          ? 'bg-slate-800/60 text-slate-300 border-transparent hover:text-blue-400 hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      title="Export and save payment receipt to Google Drive"
                    >
                      {tx.driveReceiptId ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>In Drive</span>
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                          <span>Drive Receipt</span>
                        </>
                      )}
                    </button>

                    {/* Gmail Notification */}
                    <button
                      onClick={() => onRequestSendEmailReceipt(tx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        isDark
                          ? 'bg-slate-800/60 text-slate-300 border-transparent hover:text-rose-300 hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                      title="Email payment confirmation via Gmail"
                    >
                      <Mail className="w-3.5 h-3.5 text-rose-500" />
                      <span>Email Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
