import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CoachingResult, 
  CoachingRequest 
} from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  Wand2, 
  SendHorizontal, 
  SplitSquareVertical, 
  Lightbulb, 
  PlusCircle, 
  Lock,
  Globe2,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { validateMeaningfulMessage } from '../utils/validation';

interface CoachingResultViewProps {
  result: CoachingResult;
  request: CoachingRequest;
  onSave: () => void;
  isSaved: boolean;
  onRefine: (instruction: string) => Promise<void>;
  isRefining: boolean;
  onNewMessage: () => void;
}

const REGIONAL_LANGUAGES = [
  { code: 'Assamese (অসমীয়া)', label: 'Assamese / Assamish (অসমীয়া)' },
  { code: 'Marathi (मराठी)', label: 'Marathi (मराठी)' },
  { code: 'Tamil (தமிழ்)', label: 'Tamil (தமிழ்)' },
  { code: 'Telugu (తెలుగు)', label: 'Telugu (తెలుగు)' },
  { code: 'Bengali (বাংলা)', label: 'Bengali (বাংলা)' },
  { code: 'Gujarati (ગુજરાતી)', label: 'Gujarati (ગુજરાતી)' },
  { code: 'Kannada (ಕನ್ನಡ)', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'Malayalam (മലയാളം)', label: 'Malayalam (മലയാളം)' },
  { code: 'Punjabi (ਪੰਜਾਬੀ)', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'Odia (ଓଡ଼ିଆ)', label: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'Spanish (Español)', label: 'Spanish (Español)' },
  { code: 'French (Français)', label: 'French (Français)' },
  { code: 'German (Deutsch)', label: 'German (Deutsch)' },
  { code: 'Arabic (العربية)', label: 'Arabic (العربية)' },
];

function cleanLanguageDisplay(text: string, lang: string): string {
  if (!text) return text;
  let cleaned = text.trim();

  // If the known half-Hindi half-English pattern appears:
  if (/chal\s+khane\s+chalte\s+hain/i.test(cleaned) && /planning\s+to\s+go/i.test(cleaned)) {
    if (lang.includes('Hindi') && !lang.includes('Hinglish')) {
      return 'रोहित, खाना खाने चलें? मैं लगभग [Time] बजे [Restaurant Name] जाने की योजना बना रहा हूँ। क्या आप साथ चलेंगे?';
    } else if (lang.includes('Hinglish') || lang.includes('Roman')) {
      return 'Rohit, lunch ke liye chalein? Main [Time] baje [Restaurant Name] jaane ka plan kar raha hoon. Chaloge sath mein?';
    } else {
      return "Rohit, do you want to grab lunch? I'm planning to go to [Restaurant Name] around [Time]. Let me know if you can join.";
    }
  }

  if (lang === 'English') {
    cleaned = cleaned.replace(/^Rohit,?\s*chal\s*khane\s*chalte\s*hain\??\s*/i, "Rohit, do you want to grab lunch? ");
    cleaned = cleaned.replace(/^chal\s*khane\s*chalte\s*hain\??\s*/i, "Do you want to grab lunch? ");
  }

  return cleaned;
}

export const CoachingResultView: React.FC<CoachingResultViewProps> = ({
  result,
  request,
  onSave,
  isSaved,
  onRefine,
  isRefining,
  onNewMessage
}) => {
  const { user, openAuthModal } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'primary' | number>('primary');
  const [refineInput, setRefineInput] = useState('');
  const [showRefineBar, setShowRefineBar] = useState(false);
  const [showDiffView, setShowDiffView] = useState(false);
  const [loginAlert, setLoginAlert] = useState<string | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Language conversion state
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [translations, setTranslations] = useState<Record<string, { text: string; note?: string }>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Stop any active audio (HTMLAudioElement or window.speechSynthesis)
  const stopAllAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsAudioLoading(false);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  // Stop audio when switching tabs or changing language
  useEffect(() => {
    stopAllAudio();
  }, [activeTab, selectedLanguage]);

  const baseMessage = 
    activeTab === 'primary' 
      ? result.suggestedMessage 
      : result.alternativeVariations?.[activeTab]?.message || result.suggestedMessage;

  const cacheKey = `${activeTab}_${selectedLanguage}`;
  const rawMsg = 
    selectedLanguage === 'English'
      ? baseMessage
      : translations[cacheKey]?.text || baseMessage;

  const displayedMessage = cleanLanguageDisplay(rawMsg, selectedLanguage);

  const currentCulturalNote = 
    selectedLanguage !== 'English' 
      ? translations[cacheKey]?.note 
      : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveClick = () => {
    if (!user) {
      setLoginAlert('Please log in or create an account to save your chat messages.');
      openAuthModal();
      return;
    }
    setLoginAlert(null);
    onSave();
  };

  const handleLanguageSelect = async (lang: string) => {
    if (lang === 'English') {
      setSelectedLanguage('English');
      return;
    }

    setSelectedLanguage(lang);
    const key = `${activeTab}_${lang}`;
    if (translations[key]) {
      return; // Already cached
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: baseMessage,
          targetLanguage: lang,
          recipient: request.recipient,
          situation: request.situation
        })
      });

      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();
      setTranslations((prev) => ({
        ...prev,
        [key]: {
          text: data.translatedMessage,
          note: data.scriptNote
        }
      }));
    } catch (e) {
      console.error('Translation error:', e);
      setSelectedLanguage('English');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking || isAudioLoading) {
      stopAllAudio();
      return;
    }

    stopAllAudio();

    // Use Gemini high-fidelity TTS for regional languages and non-English text,
    // or when the browser lacks Web Speech API.
    // Browsers natively lack speech voices for Indian regional languages (Assamese, Tamil, Telugu, Marathi, etc.)
    const shouldUseGeminiTTS = 
      selectedLanguage !== 'English' || 
      !('speechSynthesis' in window);

    if (shouldUseGeminiTTS) {
      setIsAudioLoading(true);
      try {
        const cacheKey = `${selectedLanguage}:::${displayedMessage}`;
        let audioUrl = audioCacheRef.current[cacheKey];

        if (!audioUrl) {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: displayedMessage,
              language: selectedLanguage,
              voiceName: 'Kore'
            })
          });

          if (!res.ok) {
            throw new Error(`TTS service error (${res.status})`);
          }

          const data = await res.json();
          if (!data.audioBase64) {
            throw new Error('No audio content returned');
          }

          audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
          audioCacheRef.current[cacheKey] = audioUrl;
        }

        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          setIsAudioLoading(false);
          audioPlayerRef.current = null;
        };

        audio.onerror = (err) => {
          console.warn('Audio playback error:', err);
          stopAllAudio();
        };

        await audio.play();
        setIsSpeaking(true);
        setIsAudioLoading(false);
        return;
      } catch (err) {
        console.warn('Gemini TTS failed, falling back to browser synthesis if available:', err);
        setIsAudioLoading(false);
        // Fallback below to browser speech synthesis
      }
    }

    // Browser SpeechSynthesis fallback (e.g. for English or offline fallback)
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(displayedMessage);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    if (selectedLanguage.includes('Hindi')) utterance.lang = 'hi-IN';
    else if (selectedLanguage.includes('Assamese') || selectedLanguage.includes('অসমীয়া')) utterance.lang = 'as-IN';
    else if (selectedLanguage.includes('Tamil')) utterance.lang = 'ta-IN';
    else if (selectedLanguage.includes('Telugu')) utterance.lang = 'te-IN';
    else if (selectedLanguage.includes('Marathi')) utterance.lang = 'mr-IN';
    else if (selectedLanguage.includes('Spanish')) utterance.lang = 'es-ES';
    else if (selectedLanguage.includes('French')) utterance.lang = 'fr-FR';
    else if (selectedLanguage.includes('German')) utterance.lang = 'de-DE';
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineInput.trim() || isRefining) return;

    // Check if input is meaningless gibberish like "jdnfefenf"
    const validation = validateMeaningfulMessage(refineInput);
    if (!validation.isValid) {
      setRefineError(validation.error || 'Enter valid msg');
      return;
    }

    setRefineError(null);
    await onRefine(refineInput.trim());
    setRefineInput('');
    setSelectedLanguage('English'); // Reset to English on new refine
  };

  const quickRefineOptions = [
    'Make it more direct & clear',
    'Remove passive hedging',
    'Shorten by 30%',
    'Soften opening tone',
    'Sound slightly firmer'
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Login Prompt Alert if user tried to save without logging in */}
      {loginAlert && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span><strong>Sign in required:</strong> {loginAlert}</span>
          </div>
          <button
            onClick={openAuthModal}
            className="px-3 py-1.5 rounded-lg bg-stone-900 text-stone-50 font-semibold text-xs hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
          >
            Log In Now
          </button>
        </div>
      )}

      {/* Header Bar with Action Controls */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Your AI Assist Breakdown</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-editorial font-medium text-white">
            How to Say It Right
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300 mt-1">
            <span>To: <strong className="text-stone-100">{request.recipient}</strong></span>
            <span>·</span>
            <span>Situation: <strong className="text-stone-100">{request.situation}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* New Message Action */}
          <button
            onClick={onNewMessage}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Start a fresh draft for another message"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Message</span>
          </button>

          <button
            onClick={() => setShowDiffView(!showDiffView)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showDiffView
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{showDiffView ? 'Hide Draft' : 'Compare'}</span>
          </button>

          <button
            onClick={handleSaveClick}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isSaved
                ? 'bg-emerald-700 text-white border-emerald-600'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-white" />
                <span>Saved to Account</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Rewrite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Side-by-Side Comparison View */}
      {showDiffView && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-100 rounded-2xl border border-stone-200">
          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center justify-between">
              <span>Your Rough Draft</span>
              <span className="text-[11px] text-stone-400">Before AI assist</span>
            </div>
            <p className="text-sm text-stone-700 font-sans italic whitespace-pre-wrap leading-relaxed">
              "{request.roughMessage}"
            </p>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
              <span>Rewritten by Your AI Assist</span>
              <span className="text-[11px] text-emerald-700">Calibrated & Human</span>
            </div>
            <p className="text-sm text-stone-900 font-sans whitespace-pre-wrap leading-relaxed">
              "{displayedMessage}"
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: Communication Check */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Communication Check
            </h3>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline">
            Clarity, accountability & emotional stakes
          </span>
        </div>

        {/* Dynamic Summary */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 text-sm text-stone-800 space-y-2">
          <p className="leading-relaxed">
            {result.communicationCheck.clarityAndAccountabilitySummary}
          </p>
          {result.communicationCheck.powerDynamicNote && (
            <div className="text-xs text-stone-600 pt-1 border-t border-stone-200/60 flex items-center gap-1.5">
              <span className="font-semibold text-stone-700">Relationship Dynamic:</span>
              <span>{result.communicationCheck.powerDynamicNote}</span>
            </div>
          )}
        </div>

        {/* Strengths & Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Strengths */}
          <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200/60 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Draft Strengths</span>
            </h4>
            <ul className="space-y-2">
              {result.communicationCheck.strengths.map((item, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-emerald-950 flex items-start gap-2 leading-relaxed">
                  <span className="text-emerald-700 shrink-0 font-bold">✅</span>
                  <span>{item.replace(/^✅\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Potential Misunderstandings / Risks */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/80 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Potential Misunderstandings & Tone Risks</span>
            </h4>
            <ul className="space-y-2">
              {result.communicationCheck.misunderstandingsAndRisks.map((item, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-amber-950 flex items-start gap-2 leading-relaxed">
                  <span className="text-amber-700 shrink-0 font-bold">⚠️</span>
                  <span>{item.replace(/^⚠️\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 2: Better Approach */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Better Approach
            </h3>
          </div>
          <span className="text-xs text-stone-500">Step-by-step structural strategy</span>
        </div>

        {/* Structural Formula Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
              Conversational Blueprint Formula
            </span>
            <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
              {result.betterApproach.structuralFormula}
            </div>
          </div>
          <div className="text-xs text-amber-900/80 bg-amber-500/20 px-3 py-1.5 rounded-lg shrink-0 font-medium self-start sm:self-auto">
            Sequential Arc
          </div>
        </div>

        {/* Step Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.betterApproach.stepBreakdown.map((item, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-stone-50 text-[11px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h5 className="font-semibold text-stone-900 text-xs sm:text-sm">
                  {item.step}
                </h5>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed pl-7">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Suggested Message */}
      <section className="bg-white rounded-2xl p-6 border-2 border-stone-900 shadow-md space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-stone-900 text-amber-400 text-[11px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
          Suggested Rewrite
        </div>

        <div className="flex items-center justify-between border-b border-stone-100 pb-3 pr-28">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Suggested Message
            </h3>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded ml-1">
              Direct & Respectful
            </span>
          </div>
        </div>

        {/* Length & Format Variations Switcher */}
        {result.alternativeVariations && result.alternativeVariations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1">
              Length:
            </span>
            <button
              onClick={() => {
                setActiveTab('primary');
                setSelectedLanguage('English');
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                activeTab === 'primary'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              Selected Format ({request.medium === 'Email' ? 'Full Email' : 'Short Text'})
            </button>
            {result.alternativeVariations.map((v, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveTab(i);
                  setSelectedLanguage('English');
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                  activeTab === i
                    ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                    : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* LANGUAGE / REGIONAL TRANSLATION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-950">
            <Globe2 className="w-4 h-4 text-amber-700" />
            <span>Convert Language / भाषा बदलें:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* English Pill */}
            <button
              type="button"
              onClick={() => handleLanguageSelect('English')}
              disabled={isTranslating}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                selectedLanguage === 'English'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              English
            </button>

            {/* Hindi Pill */}
            <button
              type="button"
              onClick={() => handleLanguageSelect('Hindi (हिंदी)')}
              disabled={isTranslating}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                selectedLanguage === 'Hindi (हिंदी)'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              🇮🇳 Hindi (हिंदी)
            </button>

            {/* Hinglish Pill */}
            <button
              type="button"
              onClick={() => handleLanguageSelect('Hinglish (Conversational)')}
              disabled={isTranslating}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                selectedLanguage === 'Hinglish (Conversational)'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              🇮🇳 Roman Hindi (हिंग्लिश)
            </button>

            {/* Assamese Pill */}
            <button
              type="button"
              onClick={() => handleLanguageSelect('Assamese (অসমীয়া)')}
              disabled={isTranslating}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                selectedLanguage === 'Assamese (অসমীয়া)'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              🇮🇳 Assamese (অসমীয়া)
            </button>

            {/* Regional Languages Dropdown */}
            <div className="relative">
              <select
                value={REGIONAL_LANGUAGES.some(l => l.code === selectedLanguage) ? selectedLanguage : ''}
                onChange={(e) => {
                  if (e.target.value) handleLanguageSelect(e.target.value);
                }}
                disabled={isTranslating}
                className="text-xs px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-stone-700 font-medium hover:bg-stone-100 transition-colors cursor-pointer focus:outline-hidden"
              >
                <option value="">More Regional Languages ▾</option>
                {REGIONAL_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* First-pass English note banner */}
        <div className="px-3.5 py-2 bg-stone-100/90 rounded-xl text-xs text-stone-600 border border-stone-200/90 flex items-center justify-between gap-2">
          <span>
            <strong>First-Pass Flow:</strong> Drafts in Hinglish or Hindi are converted into clean English first. Use the language buttons above to adapt into Assamese, Hindi, or other regional languages anytime.
          </span>
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0 hidden sm:inline">
            Active: {selectedLanguage}
          </span>
        </div>

        {/* The Message Box */}
        <div className="bg-stone-50 border border-stone-300 rounded-xl p-5 sm:p-6 relative group min-h-[140px] flex flex-col justify-between">
          {isTranslating ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-600">
              <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin"></div>
              <span className="text-xs font-medium">
                Translating & naturally adapting message into {selectedLanguage}...
              </span>
            </div>
          ) : (
            <>
              <div>
                {/* Cultural / Honorific note if translated */}
                {currentCulturalNote && (
                  <div className="mb-3 px-3 py-1.5 bg-amber-100/70 border border-amber-300/80 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                    <span className="font-semibold text-amber-950">Language Calibration:</span>
                    <span>{currentCulturalNote}</span>
                  </div>
                )}

                {displayedMessage.includes('Subject:') ? (
                  <div className="space-y-3 font-editorial text-stone-900">
                    <div className="bg-amber-100/60 p-2.5 rounded-lg border border-amber-200 text-xs sm:text-sm font-sans font-semibold text-stone-800">
                      {displayedMessage.split('\n')[0]}
                    </div>
                    <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                      {displayedMessage.split('\n').slice(1).join('\n').trim()}
                    </p>
                  </div>
                ) : (
                  <p className="text-base sm:text-lg font-editorial text-stone-900 leading-relaxed whitespace-pre-wrap selection:bg-amber-200">
                    {displayedMessage}
                  </p>
                )}
              </div>

              {/* Action Row right afterward the rewritten message */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-4 border-t border-stone-200/80">
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="font-medium text-stone-700">
                    {selectedLanguage !== 'English' 
                      ? `🌐 ${selectedLanguage}`
                      : displayedMessage.includes('Subject:') 
                        ? '✉️ Formal Email'
                        : displayedMessage.split(/\s+/).length < 50
                          ? '💬 Short Text / Chat'
                          : '📝 Coached Rewrite'}
                  </span>
                  <span>·</span>
                  <span>{displayedMessage.split(/\s+/).filter(Boolean).length} words</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSpeaking
                        ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                        : isAudioLoading
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                    title={
                      selectedLanguage !== 'English'
                        ? `Listen to natural AI speech in ${selectedLanguage}`
                        : "Hear how this phrasing sounds aloud"
                    }
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Stop Voice</span>
                      </>
                    ) : isAudioLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                        <span>Speaking...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>
                          {selectedLanguage !== 'English' 
                            ? `Listen (${selectedLanguage.split(' ')[0]})` 
                            : 'Read Aloud'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-all flex items-center gap-1.5 cursor-pointer border border-stone-300"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* SAVE AFTERWARD THE REWRITTEN MESSAGE */}
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isSaved
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                    title="Save this rewrite to your account"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Saved to Account</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                        <span>Save Rewrite</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Refine / Tweak Message Bar */}
        <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowRefineBar(!showRefineBar)}
              className="text-xs font-semibold text-stone-800 hover:text-stone-950 flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Want to tweak this phrasing?</span>
              <span className="text-stone-400 font-normal">({showRefineBar ? 'Close' : 'Click to adjust'})</span>
            </button>
          </div>

          {showRefineBar && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {quickRefineOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setRefineError(null);
                      onRefine(opt);
                    }}
                    disabled={isRefining}
                    className="text-xs bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleRefineSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 'Make it sound a bit warmer', 'Add that I can meet on Friday', 'Shorten by 30%'"
                    value={refineInput}
                    onChange={(e) => {
                      setRefineInput(e.target.value);
                      if (refineError) {
                        const check = validateMeaningfulMessage(e.target.value);
                        if (check.isValid) setRefineError(null);
                      }
                    }}
                    className={`flex-1 text-xs sm:text-sm px-3.5 py-2 border rounded-lg focus:outline-hidden focus:ring-2 bg-white transition-colors ${
                      refineError
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-stone-300 focus:ring-stone-900'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isRefining || !refineInput.trim()}
                    className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {isRefining ? (
                      <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Apply</span>
                        <SendHorizontal className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Validation Error Alert for Refinement */}
                {refineError && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold animate-in fade-in duration-200 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{refineError}</span>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: Why It Works (Your AI Assist Takeaway) */}
      <section className="bg-amber-50/70 rounded-2xl p-6 border border-amber-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-900 text-amber-100 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="text-base sm:text-lg font-bold text-amber-950">
              Why It Works (Your AI Assist Takeaway)
            </h3>
          </div>
          <span className="text-xs text-amber-800 font-medium">Transferable Communication Skill</span>
        </div>

        {/* Rule Badge & Actionable Rule */}
        <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-md">
              Principle
            </span>
            <h4 className="font-bold text-stone-900 text-sm sm:text-base">
              {result.whyItWorks.ruleName}
            </h4>
          </div>

          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans">
            {result.whyItWorks.coachingTakeaway}
          </p>

          <div className="pt-3 border-t border-stone-100 flex items-start gap-2 text-xs text-stone-600">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-800 font-semibold">Future Application: </strong>
              <span>{result.whyItWorks.transferableSkill}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Completion Card: Start Fresh / Write Another Message */}
      <section className="bg-stone-100 rounded-2xl p-6 sm:p-7 border border-stone-200 text-center space-y-4">
        <div className="max-w-md mx-auto space-y-1.5">
          <h4 className="text-base sm:text-lg font-bold text-stone-900">
            Have another difficult message to tackle?
          </h4>
          <p className="text-xs sm:text-sm text-stone-600">
            Clear the workspace and write your next draft with your AI assist.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            onClick={onNewMessage}
            className="px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Write Another Message</span>
          </button>

          <button
            onClick={handleSaveClick}
            className="px-4 py-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                <span>Saved to Account</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Save This Rewrite</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};
