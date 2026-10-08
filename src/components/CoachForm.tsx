import React, { useState } from 'react';
import { 
  RecipientType, 
  SituationType, 
  ToneType, 
  MediumType, 
  CoachingRequest 
} from '../types';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  User, 
  Compass, 
  Volume2, 
  MessageSquare, 
  HeartHandshake,
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Mail,
  Smartphone,
  Mic2,
  AlertCircle
} from 'lucide-react';
import { SCENARIO_PRESETS } from '../data/presets';
import { validateMeaningfulMessage } from '../utils/validation';

interface CoachFormProps {
  value: CoachingRequest;
  onChange: (updated: CoachingRequest) => void;
  onSubmit: (data: CoachingRequest) => void;
  isLoading: boolean;
  onSelectPreset: (presetId: string) => void;
  onClear: () => void;
}

const COMMON_RECIPIENTS: { label: string; value: string }[] = [
  { label: 'Manager / Boss', value: 'Manager' },
  { label: 'Co-worker / Peer', value: 'Colleague' },
  { label: 'Client / Customer', value: 'Client' },
  { label: 'Friend', value: 'Friend' },
  { label: 'Partner / Spouse', value: 'Partner' },
  { label: 'Recruiter', value: 'Recruiter' },
  { label: 'Professor', value: 'Professor' },
];

const SIMPLE_SITUATIONS: { type: SituationType; label: string; sub: string }[] = [
  { type: 'Say no', label: 'Say No', sub: 'Decline a request or protect time' },
  { type: 'Apologize', label: 'Apologize', sub: 'Address delay, slip-up, or mistake' },
  { type: 'Ask', label: 'Ask for Something', sub: 'Raise, favor, extension, or help' },
  { type: 'Disagree', label: 'Disagree', sub: 'Push back without being combative' },
  { type: 'Follow up', label: 'Follow Up', sub: 'Check in without sounding needy' },
];

const MODE_OPTIONS: { medium: MediumType; label: string; subtitle: string; icon: any }[] = [
  {
    medium: 'Text Message',
    label: 'Short Text / Chat',
    subtitle: '1–3 lines · Crisp, respectful, and clear',
    icon: Smartphone
  },
  {
    medium: 'Email',
    label: 'Formal Email',
    subtitle: 'Comprehensive · Subject line, context & sign-off',
    icon: Mail
  },
  {
    medium: 'In-Person / Phone Script',
    label: 'Spoken Script',
    subtitle: 'Talking points · Natural spoken phrasing',
    icon: Mic2
  }
];

export const CoachForm: React.FC<CoachFormProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  onSelectPreset,
  onClear
}) => {
  const [showAdvancedTone, setShowAdvancedTone] = useState(false);
  const [customRecipientMode, setCustomRecipientMode] = useState(
    Boolean(value.recipient && !COMMON_RECIPIENTS.some(r => r.value === value.recipient))
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.roughMessage.trim() || isLoading) return;

    // Condition to check if input is meaningless gibberish like "jdnfefenf"
    const validation = validateMeaningfulMessage(value.roughMessage);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Enter valid msg');
      return;
    }

    setValidationError(null);
    onSubmit({
      ...value,
      roughMessage: value.roughMessage.trim(),
      recipient: value.recipient.trim() || 'Colleague',
      intention: value.intention.trim() || 'Communicate clearly and protect the relationship'
    });
  };

  const handleMessageChange = (val: string) => {
    update('roughMessage', val);
    if (validationError) {
      const check = validateMeaningfulMessage(val);
      if (check.isValid) {
        setValidationError(null);
      }
    }
  };

  const handleClearForm = () => {
    setValidationError(null);
    onClear();
  };

  const update = <K extends keyof CoachingRequest>(key: K, val: CoachingRequest[K]) => {
    onChange({
      ...value,
      [key]: val
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Comforting Welcoming Note */}
      <div className="flex items-center gap-2 p-3 bg-stone-100/80 rounded-xl text-stone-700 text-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Private & Judgment-Free:</strong> Write your raw, unfiltered thoughts below. We will calibrate the rewrite to be short for text or structured for email.
        </span>
      </div>

      {/* Step 1: Who are you talking to? */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">1</span>
            Who are you messaging?
          </span>
          <span className="text-[11px] font-normal text-stone-500 lowercase">Calibrates the power dynamic</span>
        </label>

        <div className="flex flex-wrap gap-2">
          {COMMON_RECIPIENTS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                update('recipient', item.value);
                setCustomRecipientMode(false);
              }}
              className={`text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                !customRecipientMode && value.recipient === item.value
                  ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustomRecipientMode(true);
              if (COMMON_RECIPIENTS.some(r => r.value === value.recipient)) {
                update('recipient', '');
              }
            }}
            className={`text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
              customRecipientMode
                ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-2xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            Someone else...
          </button>
        </div>

        {customRecipientMode && (
          <input
            type="text"
            placeholder="Type their role or relationship (e.g. Landlord, Doctor, Team Lead, Cousin)..."
            value={value.recipient}
            onChange={(e) => update('recipient', e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-white"
          />
        )}
      </div>

      {/* Step 2: What kind of moment is this? */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">2</span>
            What's the situation?
          </span>
          <span className="text-[11px] font-normal text-stone-500 lowercase">Choose your primary goal</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SIMPLE_SITUATIONS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => update('situation', item.type)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                value.situation === item.type
                  ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="text-xs font-bold block">{item.label}</span>
              <span className={`text-[10px] mt-1 leading-tight line-clamp-2 ${
                value.situation === item.type ? 'text-stone-300' : 'text-stone-500'
              }`}>
                {item.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Mode & Length of Communication */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">3</span>
            How are you sending this? (Sets Length)
          </span>
          <span className="text-[11px] font-normal text-stone-500 lowercase">Controls short vs. long format</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = 
              opt.medium === 'Text Message' 
                ? (value.medium === 'Text Message' || value.medium === 'Slack / Team Chat')
                : value.medium === opt.medium;

            return (
              <button
                key={opt.medium}
                type="button"
                onClick={() => update('medium', opt.medium)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  isSelected ? 'bg-stone-800 text-amber-400' : 'bg-stone-100 text-stone-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className={`text-[10px] block mt-0.5 leading-tight ${
                    isSelected ? 'text-stone-300' : 'text-stone-500'
                  }`}>
                    {opt.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Your rough unedited draft */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">4</span>
            Your Rough Draft
          </label>
          <div className="flex items-center gap-2">
            {value.roughMessage && (
              <button
                type="button"
                onClick={handleClearForm}
                className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <span className="text-[11px] text-stone-400">
              {value.roughMessage.length} characters
            </span>
          </div>
        </div>

        <textarea
          rows={5}
          required
          placeholder="Write what is honestly on your mind in English, Hinglish, or Hindi (e.g. 'Bhai kal meeting mein nahi aa paunga doctor appointment hai'). Your AI assist will polish and rewrite it into clean English first, and you can convert it into Assamese, Hindi, or any regional language afterward."
          value={value.roughMessage}
          onChange={(e) => handleMessageChange(e.target.value)}
          className={`w-full text-xs sm:text-sm p-4 border rounded-xl focus:outline-hidden focus:ring-2 font-sans leading-relaxed shadow-2xs transition-colors ${
            validationError
              ? 'border-red-400 bg-red-50/20 focus:ring-red-500 focus:border-red-500'
              : 'border-stone-300 bg-white focus:ring-stone-900'
          }`}
        />

        {/* Invalid Message Error Alert */}
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold animate-in fade-in duration-200 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Optional Tone Customization */}
      <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/50">
        <button
          type="button"
          onClick={() => setShowAdvancedTone(!showAdvancedTone)}
          className="w-full px-4 py-2.5 text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>Tone Preference: <strong className="text-stone-900">{value.desiredTone}</strong> (Optional adjustment)</span>
          </span>
          {showAdvancedTone ? (
            <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
          )}
        </button>

        {showAdvancedTone && (
          <div className="p-4 pt-2 border-t border-stone-200 bg-white space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {['Confident', 'Empathetic', 'Firm', 'Responsible', 'Warm & direct', 'Diplomatic'].map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => update('desiredTone', tone as ToneType)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    value.desiredTone === tone
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary Submit Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-stone-500 flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-amber-600" />
          <span>
            {value.medium === 'Email' 
              ? 'Generating a full structured email with subject line & context.'
              : 'Generating a short, respectful, and clear rewrite.'}
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading || !value.roughMessage.trim()}
          className="w-full sm:w-auto px-7 py-3.5 bg-stone-900 hover:bg-stone-800 active:bg-black text-stone-50 text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-stone-300 border-t-white rounded-full animate-spin"></div>
              <span>Your AI assist is analyzing...</span>
            </>
          ) : (
            <>
              <span>Ask Your AI Assist</span>
              <Send className="w-4 h-4 text-amber-400" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
