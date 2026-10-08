import React, { useState } from 'react';
import { COMMUNICATION_PRINCIPLES } from '../data/principles';
import { BookOpen, Check, X, Sparkles, Lightbulb } from 'lucide-react';

export const PlaybookView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Apologize', 'Say no', 'Disagree', 'Ask', 'Follow up'];

  const filtered = selectedCategory === 'All'
    ? COMMUNICATION_PRINCIPLES
    : COMMUNICATION_PRINCIPLES.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          Transferable Playbook
        </span>
        <h2 className="text-2xl sm:text-3xl font-editorial font-medium text-white">
          The Rules Behind Clear Communication
        </h2>
        <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
          Mastering difficult conversations isn't about memorizing scripts—it's about internalizing core communication heuristics that safeguard psychological safety and preserve authority.
        </p>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            {cat === 'All' ? 'All Principles' : cat}
          </button>
        ))}
      </div>

      {/* Principles List */}
      <div className="space-y-4">
        {filtered.map((principle) => (
          <div
            key={principle.id}
            className="bg-white rounded-xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block mb-1">
                  {principle.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  {principle.name}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {principle.summary}
            </p>

            {/* Formula Banner */}
            <div className="bg-stone-50 border border-stone-200/90 rounded-lg p-3 text-xs">
              <span className="font-bold text-stone-900 block mb-1">Structural Arc:</span>
              <span className="text-stone-700 font-medium">{principle.ruleFormula}</span>
            </div>

            {/* Anti-Pattern vs Pro-Pattern */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-lg bg-red-50/50 border border-red-200/60 space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-red-800 flex items-center gap-1">
                  <X className="w-3.5 h-3.5 text-red-600" />
                  <span>The Pitfall (What Most People Write)</span>
                </div>
                <p className="text-xs text-red-950 font-sans italic leading-relaxed">
                  {principle.antiPattern}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>The Coached Phrasing</span>
                </div>
                <p className="text-xs text-emerald-950 font-sans leading-relaxed">
                  {principle.proPattern}
                </p>
              </div>
            </div>

            {/* Bottom Key Rule */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong className="text-stone-900 font-semibold">Takeaway: </strong>
                {principle.keyRule}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
