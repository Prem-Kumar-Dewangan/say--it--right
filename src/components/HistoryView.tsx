import React from 'react';
import { SavedSession } from '../types';
import { Bookmark, Trash2, ArrowRight, Copy, Check, MessageSquare, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HistoryViewProps {
  sessions: SavedSession[];
  onSelectSession: (session: SavedSession) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  onSelectSession,
  onDeleteSession,
  onClearAll
}) => {
  const { user, dbStatus, openDbExplorer } = useAuth();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
        <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 mx-auto flex items-center justify-center">
          <Bookmark className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-stone-900">No Saved Messages Yet</h3>
        <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
          When your AI assist provides a rewritten message, click "Save Rewrite" to store it in your personal collection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Saved Messages ({sessions.length})
            </h2>
            {dbStatus.connected && (
              <button
                type="button"
                onClick={openDbExplorer}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                title="Open Database Explorer to inspect stored records"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Database Synced (View Data)</span>
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {user 
              ? `Stored in persistent database for ${user.email}.`
              : 'Saved locally. Sign in to link messages directly with your database account.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={openDbExplorer}
            className="text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 font-medium px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Records</span>
          </button>
          <button
            onClick={onClearAll}
            className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectSession(item)}
            className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs hover:shadow-sm hover:border-stone-400 transition-all cursor-pointer space-y-3 group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-900 text-white">
                  {item.request.situation}
                </span>
                <span className="text-xs text-stone-600">
                  To: <strong className="text-stone-900">{item.request.recipient}</strong>
                </span>
                <span className="text-stone-300">·</span>
                <span className="text-xs text-stone-500">
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleCopy(item.id, item.result.suggestedMessage, e)}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                  title="Copy rewritten message"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(item.id);
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suggested Message Preview */}
            <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200/80 text-xs sm:text-sm font-editorial text-stone-800 line-clamp-2">
              "{item.result.suggestedMessage}"
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
              <span className="italic truncate max-w-md">
                Takeaway: {item.result.whyItWorks.ruleName}
              </span>

              <span className="text-amber-800 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                <span>View Full Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
