import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { DatabaseExplorerModal } from './components/DatabaseExplorerModal';
import { Header } from './components/Header';
import { CoachForm } from './components/CoachForm';
import { CoachingResultView } from './components/CoachingResultView';
import { ScenariosView } from './components/ScenariosView';
import { PlaybookView } from './components/PlaybookView';
import { HistoryView } from './components/HistoryView';
import { 
  CoachingRequest, 
  CoachingResult, 
  SavedSession, 
  ScenarioPreset 
} from './types';
import { SCENARIO_PRESETS } from './data/presets';
import { AlertCircle, PlusCircle, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';
import { validateMeaningfulMessage } from './utils/validation';

const STORAGE_KEY = 'say_it_right_saved_sessions';

const DEFAULT_DRAFT: CoachingRequest = {
  roughMessage: '',
  recipient: 'Manager',
  situation: 'Ask',
  intention: '',
  desiredTone: 'Confident',
  medium: 'Email'
};

function MainApp() {
  const { user, authToken, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'scenarios' | 'playbook' | 'history'>('home');
  const [draft, setDraft] = useState<CoachingRequest>(DEFAULT_DRAFT);
  const [lastSubmittedRequest, setLastSubmittedRequest] = useState<CoachingRequest | null>(null);
  const [coachingResult, setCoachingResult] = useState<CoachingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Sync sessions with database when authenticated, otherwise fallback to local storage
  useEffect(() => {
    if (authToken && user) {
      fetch('/api/user/sessions', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.sessions)) {
            setSavedSessions(data.sessions);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.sessions));
            } catch (_) {}
          }
        })
        .catch((err) => {
          console.warn('Could not fetch sessions from database, using cached local:', err);
        });
    } else {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          setSavedSessions(JSON.parse(data));
        }
      } catch (e) {
        console.error('Failed to load saved sessions', e);
      }
    }
  }, [authToken, user]);

  const saveSessionsToStorage = (sessions: SavedSession[]) => {
    setSavedSessions(sessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to storage', e);
    }
  };

  // Home Navigation
  const handleGoHome = () => {
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated "New Message" Action: clears current draft and starts fresh
  const handleNewMessage = () => {
    setDraft({
      ...DEFAULT_DRAFT,
      roughMessage: ''
    });
    setCoachingResult(null);
    setLastSubmittedRequest(null);
    setError(null);
    setActiveTab('home');

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleFormSubmit = async (request: CoachingRequest) => {
    // Check for meaningless input like "jdnfefenf"
    const validation = validateMeaningfulMessage(request.roughMessage);
    if (!validation.isValid) {
      setError(validation.error || 'Enter valid msg');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastSubmittedRequest(request);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Enter valid msg');
      }

      const data: CoachingResult = await res.json();
      setCoachingResult(data);
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Error during assist:', err);
      setError(err.message || 'Enter valid msg');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!coachingResult || !lastSubmittedRequest) return;

    // Check for meaningless rewrite instruction like "jdnfefenf"
    const validation = validateMeaningfulMessage(instruction);
    if (!validation.isValid) {
      setError(validation.error || 'Enter valid msg');
      return;
    }

    setIsRefining(true);
    setError(null);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSuggestion: coachingResult.suggestedMessage,
          instruction,
          recipient: lastSubmittedRequest.recipient,
          situation: lastSubmittedRequest.situation,
          desiredTone: lastSubmittedRequest.desiredTone
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Enter valid msg');
      }

      const refined = await res.json();
      
      setCoachingResult((prev) => {
        if (!prev) return prev;
        const currentSuggestion = prev.suggestedMessage;
        const existingVariations = prev.alternativeVariations || [];
        
        return {
          ...prev,
          suggestedMessage: refined.refinedMessage,
          alternativeVariations: [
            { label: 'Previous Version', message: currentSuggestion },
            ...existingVariations
          ],
          whyItWorks: {
            ...prev.whyItWorks,
            coachingTakeaway: `${prev.whyItWorks.coachingTakeaway} (Refined: ${refined.adjustmentRationale})`
          }
        };
      });
    } catch (err: any) {
      console.error('Refine failed', err);
      setError(err.message || 'Enter valid msg');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveSession = async () => {
    if (!lastSubmittedRequest || !coachingResult) return;

    if (!user) {
      setError('Please log in or create an account to save your chat messages in the database.');
      openAuthModal();
      return;
    }

    // Check if already saved
    const exists = savedSessions.some(
      s => s.request.roughMessage === lastSubmittedRequest.roughMessage &&
           s.result.suggestedMessage === coachingResult.suggestedMessage
    );

    if (exists) return;

    const newSession: SavedSession = {
      id: 'sess_' + Date.now(),
      userId: user.id,
      createdAt: Date.now(),
      request: lastSubmittedRequest,
      result: coachingResult
    };

    saveSessionsToStorage([newSession, ...savedSessions]);

    // Persist to database
    if (authToken) {
      try {
        await fetch('/api/user/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(newSession)
        });
      } catch (err) {
        console.error('Failed to save session to database', err);
      }
    }
  };

  const handleDeleteSession = async (id: string) => {
    saveSessionsToStorage(savedSessions.filter(s => s.id !== id));
    if (authToken) {
      try {
        await fetch(`/api/user/sessions/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
      } catch (err) {
        console.error('Failed to delete session from database', err);
      }
    }
  };

  const handleClearAllSessions = async () => {
    if (window.confirm('Are you sure you want to clear all saved sessions?')) {
      const idsToDelete = savedSessions.map(s => s.id);
      saveSessionsToStorage([]);
      if (authToken) {
        for (const id of idsToDelete) {
          try {
            await fetch(`/api/user/sessions/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${authToken}` }
            });
          } catch (_) {}
        }
      }
    }
  };

  const handleSelectPreset = (preset: ScenarioPreset) => {
    setDraft({
      roughMessage: preset.roughMessage,
      recipient: preset.recipient,
      situation: preset.situation,
      intention: preset.intention,
      desiredTone: preset.desiredTone,
      medium: preset.medium
    });
    setCoachingResult(null);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPresetById = (presetId: string) => {
    const found = SCENARIO_PRESETS.find(p => p.id === presetId);
    if (found) {
      handleSelectPreset(found);
    }
  };

  const handleClearDraft = () => {
    setDraft({
      ...DEFAULT_DRAFT,
      roughMessage: ''
    });
  };

  const handleLoadSavedSession = (session: SavedSession) => {
    setDraft(session.request);
    setLastSubmittedRequest(session.request);
    setCoachingResult(session.result);
    setActiveTab('home');
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Filter saved sessions: if logged in, prioritize user sessions or show all local
  const displayedSavedSessions = user
    ? savedSessions.filter(s => !s.userId || s.userId === user.id)
    : savedSessions;

  const isCurrentSessionSaved = Boolean(
    lastSubmittedRequest &&
    coachingResult &&
    savedSessions.some(
      s => s.request.roughMessage === lastSubmittedRequest.roughMessage &&
           s.result.suggestedMessage === coachingResult.suggestedMessage
    )
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-amber-200 selection:text-stone-900">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={displayedSavedSessions.length}
        onNewMessage={handleNewMessage}
        onGoHome={handleGoHome}
      />

      <AuthModal />
      <DatabaseExplorerModal />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-8">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-stone-900 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block">Notice:</strong>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-stone-600 hover:text-stone-900 underline ml-2 cursor-pointer font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Comforting, Calming Hero Banner */}
            <div className="text-center max-w-xl mx-auto space-y-2 pt-1">
              <h1 className="text-2xl sm:text-3xl font-editorial font-medium text-stone-900 tracking-tight">
                Say what you need to say, without the stress.
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Whether you need to apologize, decline a favor, or ask for a raise, your AI assist analyzes the relationship dynamic and gives you a calm, authentic rewrite.
              </p>
            </div>

            {/* Input Form Card */}
            <div ref={formRef} className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-xs">
              <CoachForm
                value={draft}
                onChange={setDraft}
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                onSelectPreset={handleSelectPresetById}
                onClear={handleClearDraft}
              />
            </div>

            {/* In-Flight Live Loading Indicator */}
            <div ref={resultRef}>
              {isLoading && (
                <div className="bg-white rounded-2xl p-7 border-2 border-amber-500/40 shadow-sm space-y-4 animate-in fade-in duration-200 text-center">
                  <div className="w-8 h-8 rounded-full border-3 border-stone-900 border-t-amber-500 animate-spin mx-auto"></div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                      Your AI assist is calibrating your words for {lastSubmittedRequest?.recipient}...
                    </h3>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      Balancing warmth, boundaries, and accountability so you sound confident and natural.
                    </p>
                  </div>
                </div>
              )}

              {/* Completed Coaching Results Section */}
              {!isLoading && coachingResult && lastSubmittedRequest && (
                <div className="pt-2">
                  <CoachingResultView
                    result={coachingResult}
                    request={lastSubmittedRequest}
                    onSave={handleSaveSession}
                    isSaved={isCurrentSessionSaved}
                    onRefine={handleRefine}
                    isRefining={isRefining}
                    onNewMessage={handleNewMessage}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <ScenariosView onSelectPreset={handleSelectPreset} />
        )}

        {activeTab === 'playbook' && (
          <PlaybookView />
        )}

        {activeTab === 'history' && (
          <HistoryView
            sessions={displayedSavedSessions}
            onSelectSession={handleLoadSavedSession}
            onDeleteSession={handleDeleteSession}
            onClearAll={handleClearAllSessions}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-6 px-4 text-center text-xs text-stone-500 mb-16 md:mb-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">Say It Right</span>
            <span>·</span>
            <span>Your AI Assist</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNewMessage}
              className="text-stone-600 hover:text-stone-900 font-medium underline cursor-pointer"
            >
              Start New Message
            </button>
            <span>·</span>
            {user ? (
              <span>Signed in as <strong>{user.name}</strong></span>
            ) : (
              <button
                onClick={openAuthModal}
                className="text-amber-800 hover:underline font-semibold cursor-pointer"
              >
                Sign In to Save Messages
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
