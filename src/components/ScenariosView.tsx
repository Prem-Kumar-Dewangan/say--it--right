import React, { useState } from 'react';
import { SCENARIO_PRESETS } from '../data/presets';
import { ScenarioPreset, SituationType } from '../types';
import { Sparkles, ArrowRight, User, Compass, MessageSquare } from 'lucide-react';

interface ScenariosViewProps {
  onSelectPreset: (preset: ScenarioPreset) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({ onSelectPreset }) => {
  const [filterSituation, setFilterSituation] = useState<string>('All');

  const filtered = filterSituation === 'All'
    ? SCENARIO_PRESETS
    : SCENARIO_PRESETS.filter(p => p.situation === filterSituation);

  const categories = ['All', 'Ask', 'Apologize', 'Say no', 'Disagree', 'Follow up'];

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          Curated Scenario Library
        </span>
        <h2 className="text-2xl sm:text-3xl font-editorial font-medium text-white">
          High-Stakes Moments Made Manageable
        </h2>
        <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
          Select any real-world challenge to load the context, intention, and rough draft directly into your AI assist. Experience how psychological calibration turns friction into trust.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterSituation(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              filterSituation === cat
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            {cat === 'All' ? 'All Scenarios' : cat}
          </button>
        ))}
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((preset) => (
          <div
            key={preset.id}
            className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs hover:shadow-sm hover:border-stone-300 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                  {preset.title}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200/80">
                  {preset.situation}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                {preset.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 pt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{preset.recipient}</span>
                </span>
                <span>·</span>
                <span>Tone: <strong className="text-stone-700">{preset.desiredTone}</strong></span>
                <span>·</span>
                <span>{preset.medium}</span>
              </div>

              {/* Sample draft preview */}
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/70 text-xs text-stone-600 italic line-clamp-2">
                "{preset.roughMessage}"
              </div>
            </div>

            <button
              onClick={() => onSelectPreset(preset)}
              className="w-full mt-2 py-2.5 px-3 bg-stone-50 hover:bg-stone-900 text-stone-800 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-stone-200 group-hover:border-stone-900 cursor-pointer"
            >
              <span>Load into AI Assist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
