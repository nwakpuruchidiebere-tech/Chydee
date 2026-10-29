import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Video,
  FileSearch,
  Search,
  MapPin,
  BrainCircuit,
  Volume2,
  Loader2,
  X,
  Upload,
  Play,
  CheckCircle,
} from 'lucide-react';
import { pcmToBase64, playAudioChunk } from '../lib/audioUtils';
import { useTheme } from '../context/ThemeContext';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTool?: 'live' | 'receipt' | 'video' | 'thinking' | 'omni-video' | 'grounding';
  onUseReceiptTotal?: (amount: number, note: string) => void;
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({
  isOpen,
  onClose,
  initialTool = 'live',
  onUseReceiptTotal,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'live' | 'receipt' | 'omni-video' | 'thinking' | 'grounding'>(
    initialTool === 'live' ? 'live' : initialTool === 'omni-video' ? 'omni-video' : initialTool === 'thinking' ? 'thinking' : initialTool === 'grounding' ? 'grounding' : 'receipt'
  );

  // 1. Live API (gemini-3.8-live)
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<{ current: number }>({ current: 0 });

  // 2. Receipt Scanner (gemini-4-argon)
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [receiptAnalysis, setReceiptAnalysis] = useState<string | null>(null);

  // 3. Omni Video Generator (gemini-omni-1.1-flash via Interactions API)
  const [videoPrompt, setVideoPrompt] = useState('Celebration confetti falling over golden VIP payment card, cinematic');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // 4. Video Content Analyzer (gemini-4-argon)
  const [videoFileBase64, setVideoFileBase64] = useState<string | null>(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [videoAnalysisResult, setVideoAnalysisResult] = useState<string | null>(null);

  // 5. High Thinking Advisor (gemini-4-argon ThinkingLevel.HIGH)
  const [thinkingQuery, setThinkingQuery] = useState(
    'How should 4 roommates equitably split a $3,200 monthly apartment with different sized bedrooms and incomes?'
  );
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingOutput, setThinkingOutput] = useState<string | null>(null);

  // 6. Search & Maps Grounding (gemini-3.8-flash)
  const [groundingMode, setGroundingMode] = useState<'search' | 'maps'>('search');
  const [searchQuery, setSearchQuery] = useState('Current USD to EUR and GBP live exchange rates');
  const [mapsQuery, setMapsQuery] = useState('Best brunch spots to split a check');
  const [mapsLocation, setMapsLocation] = useState('San Francisco, CA');
  const [isGroundingLoading, setIsGroundingLoading] = useState(false);
  const [groundingResult, setGroundingResult] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  // --- Live API Management ---
  const startLiveSession = async () => {
    try {
      setLiveStatus('connecting');
      setIsLiveActive(true);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      audioContextInRef.current = inputAudioCtx;
      audioContextOutRef.current = outputAudioCtx;
      nextStartTimeRef.current.current = outputAudioCtx.currentTime;

      ws.onopen = async () => {
        setLiveStatus('listening');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const source = inputAudioCtx.createMediaStreamSource(stream);
        const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(inputAudioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const base64Pcm = pcmToBase64(inputData);
            ws.send(JSON.stringify({ audio: base64Pcm }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            setLiveStatus('speaking');
            if (audioContextOutRef.current) {
              playAudioChunk(audioContextOutRef.current, msg.audio, nextStartTimeRef.current);
            }
          }
          if (msg.interrupted) {
            nextStartTimeRef.current.current = audioContextOutRef.current?.currentTime || 0;
            setLiveStatus('listening');
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WS error:', err);
        setLiveStatus('idle');
        setIsLiveActive(false);
      };

      ws.onclose = () => {
        setLiveStatus('idle');
        setIsLiveActive(false);
      };
    } catch (err) {
      console.error('Failed to start Live session:', err);
      setLiveStatus('idle');
      setIsLiveActive(false);
    }
  };

  const stopLiveSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextInRef.current) {
      audioContextInRef.current.close().catch(() => {});
      audioContextInRef.current = null;
    }
    if (audioContextOutRef.current) {
      audioContextOutRef.current.close().catch(() => {});
      audioContextOutRef.current = null;
    }
    setIsLiveActive(false);
    setLiveStatus('idle');
  };

  // --- Receipt Scanner Handler ---
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeReceipt = async () => {
    if (!receiptImage) return;
    try {
      setIsAnalyzingReceipt(true);
      const res = await fetch('/api/gemini/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: receiptImage }),
      });
      const data = await res.json();
      setReceiptAnalysis(data.analysis || data.error);
    } catch (err: any) {
      setReceiptAnalysis('Error analyzing receipt: ' + err.message);
    } finally {
      setIsAnalyzingReceipt(false);
    }
  };

  // --- Omni Video Generator Handler ---
  const handleGenerateVideo = async () => {
    try {
      setIsGeneratingVideo(true);
      const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt, aspectRatio }),
      });
      const data = await res.json();
      if (data.videoUrl) {
        setGeneratedVideoUrl(data.videoUrl);
      }
    } catch (err) {
      console.error('Video generation error:', err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // --- High Thinking Advisor Handler ---
  const handleRunThinking = async () => {
    try {
      setIsThinking(true);
      const res = await fetch('/api/gemini/high-thinking-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: thinkingQuery }),
      });
      const data = await res.json();
      setThinkingOutput(data.advice || data.error);
    } catch (err: any) {
      setThinkingOutput('Advisor error: ' + err.message);
    } finally {
      setIsThinking(false);
    }
  };

  // --- Grounding Handler ---
  const handleRunGrounding = async () => {
    try {
      setIsGroundingLoading(true);
      const endpoint = groundingMode === 'search' ? '/api/gemini/search-info' : '/api/gemini/maps-venues';
      const body =
        groundingMode === 'search'
          ? { query: searchQuery }
          : { query: mapsQuery, location: mapsLocation };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setGroundingResult(data.text || data.error);
    } catch (err: any) {
      setGroundingResult('Grounding query error: ' + err.message);
    } finally {
      setIsGroundingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 shadow-2xl text-slate-950'
      } border rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col transition-colors`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-1 rounded-xl transition ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Gemini AI Financial Intelligence</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Live Voice (3.8 Live), Vision (4 Argon), Omni Video, and High Thinking</p>
          </div>
        </div>

        {/* Subnavigation */}
        <div className={`flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'live'
                ? 'bg-pink-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-300'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-pink-400" />
            <span>Live Voice Concierge (3.8 Live)</span>
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'receipt'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-300'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Receipt & Video Vision (4 Argon)</span>
          </button>

          <button
            onClick={() => setActiveTab('omni-video')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'omni-video'
                ? 'bg-purple-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-300'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>Story Video Generator (Omni 1.1)</span>
          </button>

          <button
            onClick={() => setActiveTab('thinking')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'thinking'
                ? 'bg-amber-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-300'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-amber-500" />
            <span>High Thinking Advisor (4 Argon)</span>
          </button>

          <button
            onClick={() => setActiveTab('grounding')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'grounding'
                ? 'bg-teal-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-300'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-teal-500" />
            <span>Search & Maps Grounding</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* 1. Live Voice API */}
          {activeTab === 'live' && (
            <div className={`p-8 rounded-3xl border text-center space-y-6 transition-colors ${
              isDark ? 'bg-slate-950/90 border-pink-500/30' : 'bg-pink-50/40 border-pink-200'
            }`}>
              <div className="max-w-md mx-auto space-y-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-300'
                }`}>
                  Model: gemini-3.8-live
                </span>
                <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Hands-Free Real-Time Voice Assistant</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Talk naturally to PaySocial with ultra-low latency voice streaming. Ask about splitting bills, checking balances, or reviewing transactions!
                </p>
              </div>

              {/* Pulsing visualizer button */}
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <button
                  type="button"
                  onClick={isLiveActive ? stopLiveSession : startLiveSession}
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition shadow-2xl relative ${
                    isLiveActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/50 scale-105'
                      : 'bg-gradient-to-tr from-pink-600 to-purple-600 hover:scale-105 text-white shadow-pink-600/40'
                  }`}
                >
                  {isLiveActive ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}

                  {/* Pulsing ring animation */}
                  {isLiveActive && (
                    <span className="absolute inset-0 rounded-full border-4 border-pink-400/60 animate-ping" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      liveStatus === 'speaking'
                        ? 'bg-emerald-500 animate-pulse'
                        : liveStatus === 'listening'
                        ? 'bg-pink-500 animate-bounce'
                        : liveStatus === 'connecting'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Status: {liveStatus}
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs max-w-lg mx-auto ${
                isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800 shadow-xs'
              }`}>
                💡 <strong>Try saying:</strong> "Hey PaySocial, who paid me last?", "Can you help me calculate an 18% tip on a $68 bill?", or "What are my connected social accounts?"
              </div>
            </div>
          )}

          {/* 2. Receipt & Video Vision (gemini-4-argon) */}
          {activeTab === 'receipt' && (
            <div className="space-y-6">
              <div className={`border rounded-3xl p-6 space-y-4 transition-colors ${
                isDark ? 'bg-slate-950/80 border-indigo-500/30' : 'bg-indigo-50/30 border-indigo-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                      isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    }`}>
                      Model: gemini-4-argon
                    </span>
                    <h4 className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>Receipt & Invoice Photo Analysis</h4>
                  </div>
                </div>

                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Upload any physical receipt or screenshot. Gemini 4 Argon extracts line items, taxes, totals, and automatically formulates an even or custom split!
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <label className={`flex-1 w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition ${
                    isDark
                      ? 'border-slate-700 hover:border-indigo-500 bg-slate-900/60'
                      : 'border-slate-300 hover:border-indigo-500 bg-white shadow-xs'
                  }`}>
                    <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Click to Upload Receipt Photo</span>
                    <span className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>JPEG, PNG, WEBP</span>
                    <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                  </label>

                  {receiptImage && (
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border border-indigo-500/40 relative flex-shrink-0 shadow-md">
                      <img src={receiptImage} alt="Receipt Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeReceipt}
                  disabled={!receiptImage || isAnalyzingReceipt}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isAnalyzingReceipt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing with Gemini 4 Argon...
                    </>
                  ) : (
                    <>
                      <FileSearch className="w-4 h-4" />
                      Analyze Receipt & Calculate Splits
                    </>
                  )}
                </button>

                {receiptAnalysis && (
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed whitespace-pre-line font-mono ${
                    isDark ? 'bg-slate-900 border-indigo-500/40 text-slate-200' : 'bg-white border-indigo-300 text-slate-900 shadow-xs'
                  }`}>
                    {receiptAnalysis}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Story Video Generator (gemini-omni-1.1-flash via Interactions API) */}
          {activeTab === 'omni-video' && (
            <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
              isDark ? 'bg-slate-950/80 border-purple-500/30' : 'bg-purple-50/30 border-purple-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300'
                  }`}>
                    Model: gemini-omni-1.1-flash (Interactions API)
                  </span>
                  <h4 className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>Social Payment Celebration Video</h4>
                </div>
              </div>

              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Generate celebratory social payment animations or video stories using Omni Flash with selectable aspect ratio (16:9 or 9:16).
              </p>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Video Scene Prompt:</label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={2}
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-950'
                  }`}
                />
              </div>

              {/* Aspect Ratio Selection (Mandatory 16:9 or 9:16) */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aspect Ratio:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      aspectRatio === '16:9'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : isDark
                        ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    16:9 (Landscape Feed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      aspectRatio === '9:16'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : isDark
                        ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    9:16 (Stories / Reels)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Video via Interactions API...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    Generate {aspectRatio} Celebration Video
                  </>
                )}
              </button>

              {generatedVideoUrl && (
                <div className={`mt-4 p-4 rounded-2xl border text-center ${
                  isDark ? 'bg-slate-900 border-purple-500/40' : 'bg-white border-purple-200 shadow-sm'
                }`}>
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className={`max-h-72 rounded-xl mx-auto border shadow-xl ${
                      isDark ? 'border-slate-800' : 'border-slate-300'
                    }`}
                  />
                  <a
                    href={generatedVideoUrl}
                    download={`paysocial_video_${aspectRatio.replace(':', '_')}.mp4`}
                    className="inline-block mt-3 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow"
                  >
                    Download MP4 Video
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 4. High Thinking Strategic Advisor (gemini-4-argon ThinkingLevel.HIGH) */}
          {activeTab === 'thinking' && (
            <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
              isDark ? 'bg-slate-950/80 border-amber-500/30' : 'bg-amber-50/30 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-300'
                  }`}>
                    Model: gemini-4-argon • ThinkingLevel.HIGH
                  </span>
                  <h4 className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>Deep Strategic Financial Advisor</h4>
                </div>
              </div>

              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Uses full cognitive reasoning power without output limits to solve complex personal finance, multi-party bill splitting equity, tax projections, and budget strategies.
              </p>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Your Complex Scenario / Query:</label>
                <textarea
                  value={thinkingQuery}
                  onChange={(e) => setThinkingQuery(e.target.value)}
                  rows={3}
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-950'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={handleRunThinking}
                disabled={isThinking || !thinkingQuery.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 disabled:opacity-50"
              >
                {isThinking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Engaging High Thinking Reasoning...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    Execute High Thinking Analysis
                  </>
                )}
              </button>

              {thinkingOutput && (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed whitespace-pre-line font-mono ${
                  isDark ? 'bg-slate-900 border-amber-500/40 text-slate-200' : 'bg-white border-amber-300 text-slate-900 shadow-xs'
                }`}>
                  {thinkingOutput}
                </div>
              )}
            </div>
          )}

          {/* 5. Search & Maps Grounding (gemini-3.8-flash) */}
          {activeTab === 'grounding' && (
            <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
              isDark ? 'bg-slate-950/80 border-teal-500/30' : 'bg-teal-50/30 border-teal-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-teal-100 text-teal-700 border-teal-300'
                  }`}>
                    Model: gemini-3.8-flash Grounding
                  </span>
                  <h4 className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>Live Search & Maps Data</h4>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setGroundingMode('search')}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    groundingMode === 'search'
                      ? 'bg-teal-600 text-white'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" /> Google Search Tool
                </button>
                <button
                  type="button"
                  onClick={() => setGroundingMode('maps')}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    groundingMode === 'maps'
                      ? 'bg-teal-600 text-white'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> Google Maps Tool
                </button>
              </div>

              {groundingMode === 'search' ? (
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Search Grounding Query:</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-950'
                    }`}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Venue / Bill Split Type:</label>
                    <input
                      type="text"
                      value={mapsQuery}
                      onChange={(e) => setMapsQuery(e.target.value)}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-950'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>City or Area:</label>
                    <input
                      type="text"
                      value={mapsLocation}
                      onChange={(e) => setMapsLocation(e.target.value)}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-950'
                      }`}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleRunGrounding}
                disabled={isGroundingLoading}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 disabled:opacity-50"
              >
                {isGroundingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Querying with Grounding...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Retrieve Live Data
                  </>
                )}
              </button>

              {groundingResult && (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed whitespace-pre-line ${
                  isDark ? 'bg-slate-900 border-teal-500/40 text-slate-200' : 'bg-white border-teal-300 text-slate-900 shadow-xs'
                }`}>
                  {groundingResult}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
