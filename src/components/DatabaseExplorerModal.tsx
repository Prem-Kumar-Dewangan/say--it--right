import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Database,
  RefreshCw,
  Download,
  Copy,
  Check,
  Users,
  MessageSquare,
  HardDrive,
  FileCode,
  Search,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Code2,
  Key,
  Globe
} from 'lucide-react';

interface SupabaseConfigData {
  url: string;
  anonKey?: string;
  serviceKey?: string;
  connected: boolean;
  lastChecked?: number;
  maskedAnonKey: string;
  projectRef: string;
  setupSql: string;
  tableStatus?: {
    usersTableExists?: boolean;
    sessionsTableExists?: boolean;
    error?: string;
  };
}

interface DbDataResponse {
  stats: {
    connected: boolean;
    storageEngine: string;
    filePath: string;
    relativeFilePath: string;
    fileSizeBytes: number;
    totalUsers: number;
    totalSessions: number;
    activeTokens: number;
    lastUpdated: number;
    supabase?: {
      url: string;
      connected: boolean;
      hasKey: boolean;
      maskedKey?: string;
      projectRef?: string;
    };
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: number;
    sessionsCount: number;
    hasPasswordSet: boolean;
  }>;
  sessions: Array<{
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    createdAt: number;
    isFavorite?: boolean;
    request: {
      roughMessage: string;
      recipient: string;
      situation: string;
      intention: string;
      desiredTone: string;
    };
    result: any;
  }>;
  tokensSummary: {
    activeTokensCount: number;
  };
  raw: any;
}

export const DatabaseExplorerModal: React.FC = () => {
  const { isDbExplorerOpen, closeDbExplorer, refreshDbStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'supabase' | 'users' | 'sessions' | 'json' | 'guide'>('supabase');
  const [data, setData] = useState<DbDataResponse | null>(null);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfigData | null>(null);
  const [supabaseInputKey, setSupabaseInputKey] = useState('');
  const [supabaseInputUrl, setSupabaseInputUrl] = useState('https://nduopjrfdpildtgrvfei.supabase.co');
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const fetchDatabaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dbRes, supaRes] = await Promise.all([
        fetch('/api/db/data'),
        fetch('/api/supabase/config'),
      ]);

      if (!dbRes.ok) throw new Error('Failed to load database contents.');
      const json: DbDataResponse = await dbRes.json();
      setData(json);

      if (supaRes.ok) {
        const supaJson: SupabaseConfigData = await supaRes.json();
        setSupabaseConfig(supaJson);
        if (supaJson.url) setSupabaseInputUrl(supaJson.url);
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDbExplorerOpen) {
      fetchDatabaseData();
    }
  }, [isDbExplorerOpen]);

  if (!isDbExplorerOpen) return null;

  const handleCopyJson = () => {
    if (!data?.raw) return;
    navigator.clipboard.writeText(JSON.stringify(data.raw, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySql = () => {
    if (!supabaseConfig?.setupSql) return;
    navigator.clipboard.writeText(supabaseConfig.setupSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: supabaseInputUrl,
          anonKey: supabaseInputKey,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSyncStatusMsg({ type: 'success', text: result.message || 'Supabase connected successfully!' });
      } else {
        setSyncStatusMsg({ type: 'error', text: result.message || 'Connection failed. Check key & table permissions.' });
      }
      if (result.config) {
        setSupabaseConfig(result.config);
      }
      fetchDatabaseData();
      refreshDbStatus?.();
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', text: err.message || 'Failed to update credentials' });
    } finally {
      setSavingKey(false);
    }
  };

  const handleTestSupabase = async () => {
    setSavingKey(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/supabase/test', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setSyncStatusMsg({ type: 'success', text: result.message });
      } else {
        setSyncStatusMsg({ type: 'error', text: result.message });
      }
      fetchDatabaseData();
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSavingKey(false);
    }
  };

  const handleSyncAllToSupabase = async () => {
    setSyncingAll(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/supabase/sync-all', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setSyncStatusMsg({ type: 'success', text: result.message });
      } else {
        setSyncStatusMsg({ type: 'error', text: result.error || 'Failed to push records to Supabase' });
      }
      fetchDatabaseData();
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDownload = () => {
    window.open('/api/db/download', '_blank');
  };

  const filteredUsers = (data?.users || []).filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  });

  const filteredSessions = (data?.sessions || []).filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.userEmail.toLowerCase().includes(q) ||
      s.request.roughMessage?.toLowerCase().includes(q) ||
      s.request.recipient?.toLowerCase().includes(q) ||
      s.request.desiredTone?.toLowerCase().includes(q)
    );
  });

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-stone-900 text-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Database & Supabase Explorer</h2>
                {supabaseConfig?.connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Local DB Active + Supabase Linked
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5 flex items-center gap-2">
                <span>Integrated Supabase Project:</span>
                <code className="text-emerald-300 font-mono text-xs bg-stone-800 px-1.5 py-0.5 rounded">
                  nduopjrfdpildtgrvfei
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={fetchDatabaseData}
              disabled={loading}
              title="Refresh database data"
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700 flex items-center gap-1.5 text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleDownload}
              title="Download database.json export"
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700 flex items-center gap-1.5 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
            <button
              onClick={closeDbExplorer}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-stone-50 border-b border-stone-200">
          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">Users</div>
              <div className="text-lg font-bold text-stone-900">{data?.stats.totalUsers ?? 0}</div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">Saved Sessions</div>
              <div className="text-lg font-bold text-stone-900">{data?.stats.totalSessions ?? 0}</div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs text-stone-500 font-medium">Supabase Project</div>
              <div className="text-xs font-mono font-bold text-stone-900 truncate">
                {supabaseConfig?.connected ? 'Live Sync' : 'Ready to Sync'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs text-stone-500 font-medium">Disk Cache</div>
              <div className="text-lg font-bold text-stone-900 truncate">
                {formatBytes(data?.stats.fileSizeBytes)}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-stone-200 bg-white overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            Supabase Integration
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Database Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Users ({data?.users.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Saved Sessions ({data?.sessions.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Raw JSON View
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Local Inspection Guide
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-50/50">
          {loading && !data ? (
            <div className="py-16 text-center text-stone-500 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
              <p className="font-medium">Connecting and fetching database records...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <p className="font-semibold">Unable to load database contents:</p>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* TAB 0: SUPABASE INTEGRATION */}
              {activeTab === 'supabase' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  {syncStatusMsg && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-in fade-in ${
                      syncStatusMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : syncStatusMsg.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {syncStatusMsg.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">{syncStatusMsg.type === 'success' ? 'Supabase Status' : 'Notice'}</p>
                        <p className="mt-0.5 leading-relaxed">{syncStatusMsg.text}</p>
                      </div>
                    </div>
                  )}

                  {/* Supabase Connection Setup Card */}
                  <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Cloud className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900 text-base">Connected Supabase Project</h3>
                          <p className="text-xs text-stone-500">
                            Project URL: <span className="font-mono text-emerald-700 font-semibold">{supabaseConfig?.url || supabaseInputUrl}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://supabase.com/dashboard/project/${supabaseConfig?.projectRef || 'nduopjrfdpildtgrvfei'}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
                        >
                          Supabase Dashboard <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Supabase Project URL
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={supabaseInputUrl}
                            onChange={(e) => setSupabaseInputUrl(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50"
                            placeholder="https://nduopjrfdpildtgrvfei.supabase.co"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-stone-700">
                            Supabase API Key (anon / public or service_role key)
                          </label>
                          <a
                            href={`https://supabase.com/dashboard/project/${supabaseConfig?.projectRef || 'nduopjrfdpildtgrvfei'}/settings/api`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            Get key from Supabase Dashboard <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={supabaseInputKey}
                            onChange={(e) => setSupabaseInputKey(e.target.value)}
                            placeholder={supabaseConfig?.maskedAnonKey ? `Key saved (${supabaseConfig.maskedAnonKey}) - enter new to replace` : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
                            className="flex-1 px-3 py-2 text-sm font-mono rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="submit"
                            disabled={savingKey || !supabaseInputKey}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            {savingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                            Connect Key
                          </button>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Find your anon key in Supabase: <strong>Project Settings → API → Project API Keys → anon public</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleTestSupabase}
                          disabled={savingKey}
                          className="px-3.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${savingKey ? 'animate-spin' : ''}`} />
                          Test Connection
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncAllToSupabase}
                          disabled={syncingAll}
                          className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Cloud className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                          {syncingAll ? 'Synchronizing...' : 'Push Local Database to Supabase'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* SQL Schema Step Card */}
                  <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                          SQL
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-stone-900">Database Tables Schema (Quick Setup)</h4>
                          <p className="text-xs text-stone-500">
                            Run this in your Supabase SQL Editor once to create the tables for users and message sessions.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopySql}
                          className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedSql ? 'Copied SQL!' : 'Copy SQL'}
                        </button>
                        <a
                          href={`https://supabase.com/dashboard/project/${supabaseConfig?.projectRef || 'nduopjrfdpildtgrvfei'}/sql`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          Open SQL Editor <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="relative">
                      <pre className="p-4 bg-stone-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto max-h-56 leading-relaxed border border-stone-800">
                        {supabaseConfig?.setupSql}
                      </pre>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-stone-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        What happens automatically after setup:
                      </div>
                      <p className="pl-5 text-stone-600">
                        1. Whenever a user registers or logs in, their profile is instantly saved both locally and in Supabase (<code className="font-mono text-stone-800 bg-stone-100 px-1 py-0.5 rounded">say_it_right_users</code>).
                      </p>
                      <p className="pl-5 text-stone-600">
                        2. Whenever a user saves or favorites a rewritten message, it syncs immediately to Supabase (<code className="font-mono text-stone-800 bg-stone-100 px-1 py-0.5 rounded">say_it_right_sessions</code>).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Database Information Card */}
                  <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-600" />
                      Persistent Database Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                          Database Storage Engine
                        </span>
                        <div className="font-mono text-stone-900 font-medium">
                          {data?.stats.storageEngine}
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                          File Location on Disk
                        </span>
                        <div className="font-mono text-stone-900 font-medium text-xs break-all">
                          {data?.stats.relativeFilePath}
                        </div>
                        <div className="font-mono text-stone-400 text-[11px] truncate mt-0.5">
                          {data?.stats.filePath}
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                          Supabase Project
                        </span>
                        <div className="flex items-center justify-between">
                          <code className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {data?.stats.supabase?.projectRef || 'nduopjrfdpildtgrvfei'}
                          </code>
                          <button
                            onClick={() => setActiveTab('supabase')}
                            className="text-xs font-medium text-emerald-700 hover:underline"
                          >
                            Configure Supabase →
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                          Security & Encryption
                        </span>
                        <div className="text-xs text-stone-700 font-medium flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Salted `crypto.scrypt` password hashing + timing-safe comparison</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary of Tables */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Users Box */}
                    <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h4 className="font-bold text-stone-900">Registered Users</h4>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            {data?.users.length} accounts
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mb-3">
                          Stored user profiles, verified emails, and account registration timestamps.
                        </p>
                        <div className="space-y-1.5">
                          {data?.users.slice(0, 3).map((u) => (
                            <div key={u.id} className="text-xs p-2 bg-stone-50 rounded-lg flex items-center justify-between">
                              <span className="font-medium text-stone-800 truncate">{u.name} ({u.email})</span>
                              <span className="text-stone-400 font-mono text-[10px] shrink-0 ml-2">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('users')}
                        className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 text-left"
                      >
                        View all user records →
                      </button>
                    </div>

                    {/* Sessions Box */}
                    <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-amber-600" />
                            <h4 className="font-bold text-stone-900">Saved Messages</h4>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            {data?.sessions.length} sessions
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mb-3">
                          Persisted coaching drafts, tone selections, and AI rewritten variants.
                        </p>
                        <div className="space-y-1.5">
                          {data?.sessions.length === 0 ? (
                            <div className="text-xs p-3 bg-stone-50 rounded-lg text-stone-500 italic">
                              No saved sessions yet. Rewrite a message and click &quot;Save to Database&quot;!
                            </div>
                          ) : (
                            data?.sessions.slice(0, 3).map((s) => (
                              <div key={s.id} className="text-xs p-2 bg-stone-50 rounded-lg flex items-center justify-between">
                                <span className="font-medium text-stone-800 truncate">
                                  {s.request.recipient}: &quot;{s.request.roughMessage?.slice(0, 25)}...&quot;
                                </span>
                                <span className="text-stone-400 font-mono text-[10px] shrink-0 ml-2">
                                  {new Date(s.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('sessions')}
                        className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700 text-left"
                      >
                        View all message records →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: USERS TABLE */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search users by name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="text-xs text-stone-500">
                      Showing <strong>{filteredUsers.length}</strong> of {data?.users.length} accounts
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                          <tr>
                            <th className="py-3 px-4">User Name</th>
                            <th className="py-3 px-4">Email Address</th>
                            <th className="py-3 px-4">User ID</th>
                            <th className="py-3 px-4 text-center">Sessions</th>
                            <th className="py-3 px-4">Created Date</th>
                            <th className="py-3 px-4">Password Hash</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-stone-500 italic">
                                No users matched your search query.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                                <td className="py-3 px-4 text-stone-900 font-bold flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{u.name}</span>
                                </td>
                                <td className="py-3 px-4 text-stone-700">{u.email}</td>
                                <td className="py-3 px-4 font-mono text-[11px] text-stone-500">{u.id}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 text-[10px] font-bold">
                                    {u.sessionsCount}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-stone-600">
                                  {new Date(u.createdAt).toLocaleDateString()} {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <ShieldCheck className="w-3 h-3" />
                                    Scrypt Hash (Encrypted)
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SESSIONS TABLE */}
              {activeTab === 'sessions' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search saved messages, recipient, or tone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="text-xs text-stone-500">
                      Showing <strong>{filteredSessions.length}</strong> of {data?.sessions.length} sessions
                    </div>
                  </div>

                  {filteredSessions.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-stone-500">
                      <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="font-semibold text-stone-700">No saved message sessions found</p>
                      <p className="text-xs text-stone-500 mt-1">
                        Log in and rewrite a message, then click &quot;Save to Database&quot; to see it appear here live!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSessions.map((session) => {
                        const isExpanded = expandedSessionId === session.id;
                        return (
                          <div
                            key={session.id}
                            className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden transition-all"
                          >
                            <div
                              onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                              className="p-4 cursor-pointer hover:bg-stone-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-stone-900 text-xs sm:text-sm">
                                      Recipient: {session.request.recipient}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                                      Tone: {session.request.desiredTone}
                                    </span>
                                    {session.isFavorite && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                        ★ Favorite
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-stone-600 line-clamp-1 mt-1 font-mono">
                                    &quot;{session.request.roughMessage}&quot;
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-stone-500 shrink-0 self-end sm:self-auto">
                                <div className="text-right">
                                  <span className="block font-medium text-stone-700">{session.userName}</span>
                                  <span className="text-[10px] text-stone-400">
                                    {new Date(session.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3 text-xs">
                                <div>
                                  <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block mb-1">
                                    Original Rough Draft
                                  </span>
                                  <div className="p-3 bg-white rounded-lg border border-stone-200 text-stone-800 leading-relaxed font-sans">
                                    {session.request.roughMessage}
                                  </div>
                                </div>

                                <div>
                                  <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block mb-1">
                                    AI Rewritten Suggestion
                                  </span>
                                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-stone-900 font-medium leading-relaxed">
                                    {session.result?.suggestedMessage || 'Result stored in record'}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono pt-2 border-t border-stone-200">
                                  <span>Session Record ID: {session.id}</span>
                                  <span>User ID: {session.userId}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RAW JSON VIEW */}
              {activeTab === 'json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-600">
                      Live content of <code className="font-mono bg-stone-200 px-1 py-0.5 rounded text-stone-800">database.json</code>:
                    </span>
                    <button
                      onClick={handleCopyJson}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied to Clipboard!' : 'Copy Entire JSON'}
                    </button>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-stone-900 text-amber-300 font-mono text-xs rounded-xl overflow-x-auto max-h-[500px] leading-relaxed border border-stone-800">
                      {JSON.stringify(data?.raw, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 5: LOCAL DEV INSPECTION GUIDE */}
              {activeTab === 'guide' && (
                <div className="space-y-6 text-sm">
                  <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-amber-600" />
                      4 Ways to View Your Database Data
                    </h3>

                    <p className="text-xs text-stone-600">
                      Because your database is persistent and stored right on your filesystem, you have multiple direct ways to view and inspect all saved records:
                    </p>

                    <div className="space-y-4 mt-3">
                      {/* Method 1 */}
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                          <h4 className="font-bold text-sm text-stone-900">In Supabase Dashboard (Cloud PostgreSQL)</h4>
                        </div>
                        <p className="text-xs text-stone-600">
                          Visit your Supabase Dashboard at <span className="font-mono text-emerald-700 font-semibold">https://supabase.com/dashboard/project/nduopjrfdpildtgrvfei</span>. Open Table Editor to see all synced records in <code className="font-mono bg-stone-200 px-1 py-0.5 rounded text-stone-800">say_it_right_users</code> and <code className="font-mono bg-stone-200 px-1 py-0.5 rounded text-stone-800">say_it_right_sessions</code>.
                        </p>
                      </div>

                      {/* Method 2 */}
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                          <h4 className="font-bold text-sm text-stone-900">Directly from the File in VS Code / File Explorer</h4>
                        </div>
                        <p className="text-xs text-stone-600">
                          Open the file located at:
                        </p>
                        <div className="bg-stone-900 text-amber-300 p-2.5 rounded-lg font-mono text-xs">
                          server/data/database.json
                        </div>
                        <p className="text-xs text-stone-500">
                          Every time you register an account or save a rewritten message, this JSON file is automatically written to disk.
                        </p>
                      </div>

                      {/* Method 3 */}
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                          <h4 className="font-bold text-sm text-stone-900">View via Terminal / PowerShell Command</h4>
                        </div>
                        <p className="text-xs text-stone-600">
                          In your project terminal (PowerShell):
                        </p>
                        <div className="bg-stone-900 text-emerald-400 p-2.5 rounded-lg font-mono text-xs">
                          Get-Content server\data\database.json
                        </div>
                        <p className="text-xs text-stone-600 mt-2">
                          Or on Linux / macOS / Git Bash:
                        </p>
                        <div className="bg-stone-900 text-emerald-400 p-2.5 rounded-lg font-mono text-xs">
                          cat server/data/database.json
                        </div>
                      </div>

                      {/* Method 4 */}
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
                          <h4 className="font-bold text-sm text-stone-900">View in Your Web Browser via HTTP Endpoint</h4>
                        </div>
                        <p className="text-xs text-stone-600">
                          While your local development server is running (`npm run dev`), open your web browser and go to:
                        </p>
                        <div className="bg-stone-900 text-blue-400 p-2.5 rounded-lg font-mono text-xs flex items-center justify-between">
                          <span>http://localhost:3000/api/db/data</span>
                          <a
                            href="/api/db/data"
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-400 hover:underline text-[11px] flex items-center gap-1"
                          >
                            Open Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-stone-100 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Connected: Local Persistent DB + Supabase (nduopjrfdpildtgrvfei)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-medium transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              Download database.json
            </button>
            <button
              onClick={closeDbExplorer}
              className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
