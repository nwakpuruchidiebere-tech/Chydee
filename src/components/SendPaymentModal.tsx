import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Users,
  Smile,
  Shield,
  Eye,
  Lock,
  Sparkles,
  Loader2,
  Check,
  Landmark,
  CheckCircle2,
  Hash,
  CreditCard,
  Clock,
  RefreshCw,
  TrendingUp,
  ArrowRightLeft,
  Globe,
  DollarSign,
  Coins,
} from 'lucide-react';
import { GoogleContact, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  generateAccountNumber,
  formatAccountNumber,
  maskAccountNumber,
  isValidAccountNumber,
  PAYSOCIAL_DEFAULT_ROUTING,
} from '../lib/accountUtils';
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_MAP,
  getCurrencySymbol,
  getCurrencyFlag,
  formatCurrencyAmount,
  fetchExchangeRates,
  ExchangeRatesResponse,
} from '../lib/currency';

interface SendPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  googleContacts: GoogleContact[];
  initialRecipientName?: string;
  initialRecipientUsername?: string;
  onExecutePayment: (paymentData: {
    receiverName: string;
    receiverUsername: string;
    receiverAccountNumber?: string;
    amount: number;
    currency: string;
    note: string;
    emoji: string;
    category: string;
    visibility: 'public' | 'friends' | 'private';
    status?: 'completed' | 'pending';
    customCardUrl?: string;
  }) => Promise<void>;
}

const EMOJI_OPTIONS = ['☕', '🍕', '🎉', '✈️', '🏠', '🎬', '🛍️', '🍻', '🍔', '🎁', '⚡', '🌮'];
const CATEGORY_OPTIONS = ['dinner', 'drinks', 'coffee', 'rent', 'tickets', 'travel', 'groceries', 'utilities'];

export const SendPaymentModal: React.FC<SendPaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  googleContacts,
  initialRecipientName = '',
  initialRecipientUsername = '',
  onExecutePayment,
}) => {
  const { isDark } = useTheme();
  const [recipient, setRecipient] = useState(initialRecipientName || initialRecipientUsername || '');
  const [customAccountNumber, setCustomAccountNumber] = useState('');
  const [autoGenAccNumber, setAutoGenAccNumber] = useState(() =>
    generateAccountNumber(initialRecipientUsername || initialRecipientName || 'friend')
  );
  const [amount, setAmount] = useState('25.00');
  const [currency, setCurrency] = useState('USD');
  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍕');
  const [category, setCategory] = useState('dinner');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending'>('completed');

  // Split bill
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  // AI Card Artwork Generator (gemini-3-pro-image-preview with 1K, 2K, 4K resolution)
  const [showAiArt, setShowAiArt] = useState(false);
  const [aiArtPrompt, setAiArtPrompt] = useState('Futuristic glowing payment badge for dinner with friends');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [generatedArtUrl, setGeneratedArtUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactFilter, setContactFilter] = useState('');

  // Fetch real-time exchange rates
  const handleFetchRates = async (force = false) => {
    try {
      setIsLoadingRates(true);
      setRatesError(null);
      const data = await fetchExchangeRates('USD', force);
      setRatesData(data);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.warn('Exchange rates load error:', err);
      setRatesError('Rate feed unavailable. Using reference rates.');
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleFetchRates(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 0;
  const calculatedAmount = isSplitting ? numericAmount / splitCount : numericAmount;

  // Selected currency configuration & exchange rates
  const selectedCurrencyConfig = CURRENCY_MAP[currency] || {
    code: currency,
    symbol: '$',
    name: currency,
    flag: '💵',
    decimals: 2,
  };
  const activeRate = ratesData?.rates?.[currency] ?? (currency === 'USD' ? 1 : 1);
  const usdRateEquivalent = activeRate > 0 ? (calculatedAmount / activeRate) : calculatedAmount;

  const handleGenerateHighResCard = async () => {
    try {
      setIsGeneratingArt(true);
      const res = await fetch('/api/gemini/high-quality-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiArtPrompt,
          imageSize: imageSize, // Affordance for 1K, 2K, and 4K as requested
          aspectRatio: '1:1',
        }),
      });

      if (!res.ok) {
        throw new Error('Image generation failed');
      }

      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedArtUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('AI Card generation error:', err);
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || calculatedAmount <= 0) return;

    const targetAccountNumber =
      customAccountNumber.trim() ||
      (isValidAccountNumber(recipient.trim()) ? recipient.trim().replace(/\D/g, '') : autoGenAccNumber);

    try {
      setIsSubmitting(true);
      await onExecutePayment({
        receiverName: recipient.trim(),
        receiverUsername: recipient.trim().toLowerCase().replace(/\s+/g, '_'),
        receiverAccountNumber: targetAccountNumber,
        amount: calculatedAmount,
        currency,
        note: note.trim() || 'Payment via PaySocial',
        emoji: selectedEmoji,
        category,
        visibility,
        status: paymentStatus,
        customCardUrl: generatedArtUrl || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Payment execution error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 shadow-2xl text-slate-950'
      } border rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 transition-colors`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-1 rounded-xl transition ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Send or Split Payment</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Direct virtual account routing & timeline transfer</p>
          </div>
        </div>

        {/* Source Account Details Pill */}
        <div className={`mb-5 p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="truncate">
              <span className="font-bold">Paying From:</span> PaySocial Checking
              <span className="font-mono text-[11px] font-bold ml-1.5 text-indigo-400">
                {maskAccountNumber(currentUser?.accountNumber || '8849201842')}
              </span>
            </div>
          </div>
          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
            ${currentUser?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Recipient Input with Google Contacts quick select & Auto-Generated Account Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                Recipient (Name, @handle, or 10-Digit Account #)
              </label>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-Routing Active
              </span>
            </div>
            <input
              type="text"
              value={recipient}
              onChange={(e) => {
                const val = e.target.value;
                setRecipient(val);
                setContactFilter(val);
                if (val.trim()) {
                  setAutoGenAccNumber(generateAccountNumber(val.trim()));
                }
              }}
              placeholder="e.g. Maya Chen, @mayachen, or 8849 201 842"
              required
              className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400'
              }`}
            />

            {/* Automatically Generated Recipient Account Number Card */}
            <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
              isDark ? 'bg-slate-950/60 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <Landmark className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[11px] font-semibold opacity-80 block">Recipient Payment Account (Auto-Generated):</span>
                  <span className="font-mono font-bold tracking-wider text-xs">
                    {customAccountNumber ? formatAccountNumber(customAccountNumber) : formatAccountNumber(autoGenAccNumber)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newNumber = generateAccountNumber();
                  setAutoGenAccNumber(newNumber);
                  setCustomAccountNumber('');
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition shrink-0 ${
                  isDark
                    ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
                    : 'bg-white hover:bg-slate-100 text-indigo-700 border-indigo-200'
                }`}
                title="Generate another unique virtual account number"
              >
                Regenerate #
              </button>
            </div>

            {/* Quick Contacts Dropdown if Google Contacts available */}
            {googleContacts.length > 0 && (
              <div className="mt-2.5">
                <span className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                  Or pick from Google Contacts:
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {googleContacts
                    .filter((c) => !contactFilter || c.displayName.toLowerCase().includes(contactFilter.toLowerCase()))
                    .slice(0, 5)
                    .map((contact) => (
                      <button
                        key={contact.resourceName}
                        type="button"
                        onClick={() => {
                          setRecipient(contact.displayName);
                          setAutoGenAccNumber(generateAccountNumber(contact.displayName));
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition border flex-shrink-0 ${
                          recipient === contact.displayName
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : isDark
                            ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        {contact.photoUrl ? (
                          <img src={contact.photoUrl} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center font-bold">
                            {contact.displayName.charAt(0)}
                          </div>
                        )}
                        <span className="truncate max-w-[100px]">{contact.displayName}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Amount input, Currency Switcher, and Real-time Exchange Rate Card */}
          <div>
            {/* Currency Switcher & Live API Exchange Rate Header */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                  <Coins className="w-3.5 h-3.5 text-indigo-400" />
                  Select Currency & Amount
                </label>

                {/* All Currencies Dropdown */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={currency}
                    onChange={(e) => {
                      const newCurr = e.target.value;
                      setCurrency(newCurr);
                      if (newCurr === 'JPY' && (amount === '25.00' || amount === '25')) {
                        setAmount('3500');
                      } else if (currency === 'JPY' && amount === '3500') {
                        setAmount('25.00');
                      }
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                    }`}
                    aria-label="Select currency"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                        {c.flag} {c.code} ({c.symbol}) — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Currency Switcher Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'INR', 'AUD'].map((currCode) => {
                  const cfg = CURRENCY_MAP[currCode];
                  const isSelected = currency === currCode;
                  return (
                    <button
                      key={currCode}
                      type="button"
                      onClick={() => {
                        setCurrency(currCode);
                        if (currCode === 'JPY' && (amount === '25.00' || amount === '25')) {
                          setAmount('3500');
                        } else if (currency === 'JPY' && amount === '3500') {
                          setAmount('25.00');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition shrink-0 ${
                        isSelected
                          ? isDark
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 shadow-sm shadow-indigo-950'
                            : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : isDark
                          ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span>{cfg?.flag || '💵'}</span>
                      <span>{currCode}</span>
                      <span className="opacity-70 text-[11px] font-normal">{cfg?.symbol}</span>
                    </button>
                  );
                })}
              </div>

              {/* Real-time Exchange Rate Card with API details & Live Status */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-800/90 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          ratesError ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          ratesError ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </span>
                    <span
                      className={`text-[11px] font-bold tracking-tight truncate ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {currency === 'USD' ? (
                        <span>Base Currency: US Dollar (1:1 USD)</span>
                      ) : (
                        <span>
                          Exchange Rate: <span className="font-mono text-indigo-400">1 USD = {activeRate.toFixed(4)} {currency}</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Refresh button */}
                  <button
                    type="button"
                    onClick={() => handleFetchRates(true)}
                    disabled={isLoadingRates}
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition shrink-0 ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title="Refresh live exchange rate from API"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingRates ? 'animate-spin text-indigo-400' : ''}`} />
                    <span>{isLoadingRates ? 'Updating...' : 'Live Rate'}</span>
                  </button>
                </div>

                {/* Rates details row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/40 dark:border-slate-800/40">
                  {currency === 'USD' ? (
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Direct settlement • No foreign exchange fee
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
                      <span className="font-mono text-slate-400">
                        1 {currency} ≈ ${(1 / activeRate).toFixed(4)} USD
                      </span>
                    </div>
                  )}

                  {currency !== 'USD' && (
                    <span className="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
                      ≈ ${usdRateEquivalent.toFixed(2)} USD from balance
                    </span>
                  )}

                  {currency === 'USD' && ratesData?.source && (
                    <span className="text-[10px] opacity-70">
                      via {ratesData.source}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                Amount to Send ({currency})
              </label>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIsSplitting(!isSplitting)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                    isSplitting
                      ? isDark
                        ? 'bg-purple-600/30 text-purple-300 border-purple-500/40'
                        : 'bg-purple-100 text-purple-800 border-purple-300'
                      : isDark
                      ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Split Bill {isSplitting ? `(${splitCount} ways)` : ''}
                </button>
              </div>
            </div>

            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedCurrencyConfig.symbol}
              </span>
              <input
                type="number"
                step={selectedCurrencyConfig.decimals === 0 ? '1' : '0.01'}
                min={selectedCurrencyConfig.decimals === 0 ? '1' : '0.50'}
                max="500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className={`w-full border rounded-xl pl-11 pr-20 py-3 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-950'
                }`}
              />
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold font-mono px-2 py-1 rounded-lg border ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-200/70 border-slate-300 text-slate-800'
              }`}>
                <span>{selectedCurrencyConfig.flag}</span>
                <span>{currency}</span>
              </span>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 mt-2">
              {(currency === 'JPY' ? ['1000', '2500', '5000', '10000'] : ['10', '25', '50', '100']).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(currency === 'JPY' ? preset : preset + '.00')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition border ${
                    isDark
                      ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-transparent'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  {selectedCurrencyConfig.symbol}{preset}
                </button>
              ))}
            </div>

            {/* Split options */}
            {isSplitting && (
              <div className={`mt-3 p-3 rounded-xl border ${
                isDark ? 'bg-purple-950/20 border-purple-800/30' : 'bg-purple-50 border-purple-200'
              }`}>
                <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-purple-300' : 'text-purple-800 font-semibold'}`}>
                  <span>Number of people sharing:</span>
                  <div className="flex items-center gap-1 font-bold">
                    {[2, 3, 4, 5].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSplitCount(count)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold border transition ${
                          splitCount === count
                            ? 'bg-purple-600 text-white border-purple-600'
                            : isDark
                            ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border-transparent'
                            : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-300'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`text-sm font-bold flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  <span>Your portion to send:</span>
                  <div className="text-right">
                    <span className="text-emerald-500 font-black text-base">
                      {formatCurrencyAmount(calculatedAmount, currency)}
                    </span>
                    {currency !== 'USD' && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        ≈ ${usdRateEquivalent.toFixed(2)} USD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Note with Emoji & Category */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              What is this for?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a funny note or thank you..."
                maxLength={200}
                required
                className={`flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400'
                }`}
              />
              <div className={`flex items-center gap-1 border rounded-xl px-2 py-1 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-300'
              }`}>
                <span className="text-xl">{selectedEmoji}</span>
              </div>
            </div>

            {/* Emoji Quick Picker */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setSelectedEmoji(em)}
                  className={`p-1.5 rounded-lg text-base transition ${
                    selectedEmoji === em
                      ? 'bg-indigo-600/30 ring-2 ring-indigo-500'
                      : isDark
                      ? 'hover:bg-slate-800'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition border ${
                    category === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : isDark
                      ? 'bg-slate-800/60 text-slate-400 hover:text-white border-transparent'
                      : 'bg-slate-100 text-slate-700 hover:text-slate-950 border-slate-300'
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility options */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              Timeline Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  visibility === 'public'
                    ? isDark
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold'
                    : isDark
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  Public
                </div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Visible to everyone</div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('friends')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  visibility === 'friends'
                    ? isDark
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold'
                    : isDark
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Friends
                </div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Only mutual contacts</div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  visibility === 'private'
                    ? isDark
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold'
                    : isDark
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  Private
                </div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Only you & recipient</div>
              </button>
            </div>
          </div>

          {/* Settlement Status (Instant vs Pending) */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              Settlement Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('completed')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  paymentStatus === 'completed'
                    ? isDark
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-sm'
                    : isDark
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Instant (Completed)
                </div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Funds clear and settle immediately
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('pending')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  paymentStatus === 'pending'
                    ? isDark
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                      : 'bg-amber-50 border-amber-500 text-amber-950 font-semibold shadow-sm'
                    : isDark
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-500">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  Escrow Hold (Pending)
                </div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Hold payment pending confirmation
                </div>
              </button>
            </div>
          </div>

          {/* AI Custom Card Artwork Generator (gemini-3-pro-image-preview with 1K, 2K, 4K) */}
          <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setShowAiArt(!showAiArt)}
              className={`flex items-center justify-between w-full text-xs font-semibold transition py-1 ${
                isDark ? 'text-pink-300 hover:text-pink-200' : 'text-pink-700 hover:text-pink-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>Attach High-Res AI Card Artwork (Gemini 3 Pro)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-pink-50 text-pink-700 border-pink-200'
              }`}>
                {showAiArt ? 'Hide' : 'Configure (1K/2K/4K)'}
              </span>
            </button>

            {showAiArt && (
              <div className={`mt-3 p-3.5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-950/90 border-pink-500/30' : 'bg-pink-50/50 border-pink-200'
              }`}>
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    Image Prompt:
                  </label>
                  <input
                    type="text"
                    value={aiArtPrompt}
                    onChange={(e) => setAiArtPrompt(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-1.5 text-xs ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-950'
                    }`}
                  />
                </div>

                {/* Explicit resolution affordance: 1K, 2K, 4K as requested */}
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    Select Resolution (affordance for 1K, 2K, and 4K):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1K', '2K', '4K'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setImageSize(size)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                          imageSize === size
                            ? 'bg-pink-600 text-white border-pink-500'
                            : isDark
                            ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {size} Resolution
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateHighResCard}
                    disabled={isGeneratingArt}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    {isGeneratingArt ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating {imageSize}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Card Artwork
                      </>
                    )}
                  </button>

                  {generatedArtUrl && (
                    <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Attached ({imageSize})
                    </span>
                  )}
                </div>

                {generatedArtUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-pink-500/40 max-w-[120px] aspect-square">
                    <img src={generatedArtUrl} alt="Generated Card" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className={`pt-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-slate-300'
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || calculatedAmount <= 0 || !recipient.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-extrabold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending ${calculatedAmount.toFixed(2)}...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Pay ${calculatedAmount.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
