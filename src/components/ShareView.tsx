import { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SAMPLE_VOLUMES } from '../data/sampleData';
import type { LearnedMap } from '../hooks/useLearnedState';

interface Props {
  userId: string;
}

export default function ShareView({ userId }: Props) {
  const [learned, setLearned] = useState<LearnedMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    supabase
      .from('user_sicha_progress')
      .select('sicha_id, learned')
      .eq('user_id', userId)
      .eq('learned', true)
      .then(({ data, error: err }) => {
        if (err) { setError('Could not load progress.'); }
        else {
          const map: LearnedMap = {};
          for (const row of data ?? []) map[row.sicha_id] = true;
          setLearned(map);
        }
        setLoading(false);
      });
  }, [userId]);

  const allSichos     = SAMPLE_VOLUMES.flatMap((v) => v.sichos);
  const totalPages    = allSichos.reduce((sum, s) => sum + s.pageCount, 0);
  const learnedPages  = allSichos.filter((s) => learned[s.id]).reduce((sum, s) => sum + s.pageCount, 0);
  const learnedCount  = allSichos.filter((s) => learned[s.id]).length;
  const overallPct    = totalPages === 0 ? 0 : Math.round((learnedPages / totalPages) * 100);

  function calcFill(vol: typeof SAMPLE_VOLUMES[0]) {
    const t = vol.sichos.reduce((sum, s) => sum + s.pageCount, 0);
    const l = vol.sichos.filter((s) => learned[s.id]).reduce((sum, s) => sum + s.pageCount, 0);
    return t === 0 ? 0 : Math.round((l / t) * 100);
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] flex flex-col">
      {/* Mini header */}
      <header className="bg-white border-b border-[#ddd4c0] sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0B1F3A] rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <span className="text-[#1c1610] font-semibold text-lg tracking-tight">Sichos Tracker</span>
              <span className="hidden sm:block text-[10px] text-[#4a3f30] tracking-widest uppercase ml-0.5">Shared Progress</span>
            </div>
          </div>
          <a href="/" className="text-sm font-medium text-[#0B1F3A] hover:underline">
            Start tracking →
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={28} className="animate-spin text-[#0B1F3A]" />
          </div>
        ) : error ? (
          <div className="text-center py-32 text-[#4a3f30]">{error}</div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-10 text-center">
              <h1 className="font-serif text-3xl font-semibold text-[#1c1610] mb-2">
                לקוטי שיחות — Shared Progress
              </h1>
              <p className="text-[#4a3f30]">
                {learnedCount} sichos · {learnedPages.toLocaleString()} pages · {overallPct}% complete
              </p>
              <div className="max-w-md mx-auto mt-4 h-2 rounded-full bg-[#ddd4c0] overflow-hidden">
                <div className="h-2 rounded-full bg-[#0B1F3A] transition-all duration-700" style={{ width: `${overallPct}%` }} />
              </div>
            </div>

            {/* Read-only bookshelf */}
            <div className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden">
              <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0B1F3A]/30" />
                <span className="text-xs text-[#4a3f30] font-medium tracking-wide uppercase">
                  לקוטי שיחות — {SAMPLE_VOLUMES.length} חלקים
                </span>
              </div>
              <div className="px-8 pt-10 pb-4">
                <div className="flex items-end gap-2 flex-wrap">
                  {SAMPLE_VOLUMES.map((vol) => {
                    const pct = calcFill(vol);
                    return (
                      <div key={vol.id} className="relative flex flex-col items-center" title={`${vol.hebrewLabel} — ${pct}%`}>
                        <div className="relative overflow-hidden" style={{ width: 44, height: 110, border: '2px solid #0B1F3A', borderRadius: '3px 3px 0 0', background: 'transparent' }}>
                          {pct > 0 && <div className="absolute bottom-0 left-0 right-0" style={{ height: `${pct}%`, background: '#0B1F3A' }} />}
                        </div>
                        <div style={{ width: 48, height: 6, background: '#0B1F3A', opacity: pct === 100 ? 1 : 0.25 }} className="rounded-b-sm" />
                        <div className="mt-1.5 w-12 flex items-center justify-center">
                          <span className="text-[11px] font-semibold select-none font-serif text-center" style={{ color: '#0B1F3A', direction: 'rtl' }}>
                            {vol.hebrewLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-0 rounded-sm" style={{ height: 10, background: 'linear-gradient(180deg, #c8b89a 0%, #a89070 100%)', boxShadow: '0 3px 8px rgba(0,0,0,0.18)' }} />
              </div>
              <div className="px-6 pb-5">
                <p className="text-xs text-[#4a3f30]/50 text-center">Read-only view · <a href="/" className="underline hover:text-[#0B1F3A]">Create your own tracker</a></p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
