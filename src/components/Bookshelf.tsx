import { useState, useMemo } from 'react';
import { X, CheckSquare, Square, ExternalLink, Search } from 'lucide-react';
import type { Volume, Sicha } from '../data/sampleData';
import type { LearnedMap } from '../hooks/useLearnedState';

interface Props {
  volumes: Volume[];
  learned: LearnedMap;
  onToggle: (id: string) => void;
}

function calcProgress(volume: Volume, learned: LearnedMap): number {
  const total   = volume.sichos.reduce((sum, s) => sum + s.pageCount, 0);
  const learned_ = volume.sichos.filter((s) => learned[s.id]).reduce((sum, s) => sum + s.pageCount, 0);
  return total === 0 ? 0 : learned_ / total;
}

// ── Sicha row ─────────────────────────────────────────────────────────────────

function SichaRow({ sicha, idx, isLearned, onToggle, volLabel }: {
  sicha: Sicha; idx: number; isLearned: boolean; onToggle: (id: string) => void; volLabel?: string;
}) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 border-b border-[#f0ebe3] transition-colors ${isLearned ? 'bg-[#0B1F3A]/5' : 'hover:bg-[#f7f3ed]'}`}>
      <button onClick={() => onToggle(sicha.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="flex-shrink-0">
          {isLearned ? <CheckSquare size={20} className="text-[#0B1F3A]" /> : <Square size={20} className="text-[#ddd4c0]" />}
        </div>
        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
          style={{ background: isLearned ? '#0B1F3A' : 'transparent', borderColor: isLearned ? '#0B1F3A' : '#ddd4c0', color: isLearned ? '#fff' : '#4a3f30' }}>
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold font-serif ${isLearned ? 'text-[#0B1F3A]' : 'text-[#1c1610]'}`} dir="rtl">
            {sicha.title}
          </div>
          <div className="flex items-center gap-2 mt-0.5" dir="rtl">
            {sicha.pageRef && <span className="text-xs text-[#4a3f30]/60">{sicha.pageRef}</span>}
            {volLabel && (
              <span className="text-[10px] bg-[#f0ebe3] text-[#4a3f30] px-1.5 py-0.5 rounded font-serif">{volLabel}</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-xs font-medium text-[#4a3f30]">{sicha.pageCount}</span>
          <span className="text-[10px] text-[#4a3f30]/60 ml-0.5">pp</span>
        </div>
      </button>
      {sicha.pdfUrl && (
        <a href={sicha.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          title="Open PDF"
          className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[#4a3f30]/40 hover:text-[#0B1F3A] hover:bg-[#eee8de] transition-colors">
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

// ── Drawer ─────────────────────────────────────────────────────────────────────

function SichaDrawer({ volume, learned, onToggle, onClose }: {
  volume: Volume; learned: LearnedMap; onToggle: (id: string) => void; onClose: () => void;
}) {
  const fillPct     = Math.round(calcProgress(volume, learned) * 100);
  const totalPages  = volume.sichos.reduce((sum, s) => sum + s.pageCount, 0);
  const learnedPgs  = volume.sichos.filter((s) => learned[s.id]).reduce((sum, s) => sum + s.pageCount, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ddd4c0]">
          <div>
            <h2 className="text-lg font-semibold text-[#1c1610] font-serif" dir="rtl">{volume.hebrewLabel ?? volume.label}</h2>
            <p className="text-xs text-[#4a3f30] mt-0.5">{learnedPgs} / {totalPages} pages · {fillPct}% complete</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#4a3f30] hover:bg-[#f7f3ed] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-3 border-b border-[#ddd4c0] bg-[#f7f3ed]">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[#ddd4c0] overflow-hidden">
              <div className="h-2 rounded-full bg-[#0B1F3A] transition-all duration-500" style={{ width: `${fillPct}%` }} />
            </div>
            <span className="text-xs font-semibold text-[#0B1F3A] w-8 text-right">{fillPct}%</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {volume.sichos.map((s, i) => (
            <SichaRow key={s.id} sicha={s} idx={i} isLearned={!!learned[s.id]} onToggle={onToggle} />
          ))}
        </div>
        <div className="px-6 py-4 border-t border-[#ddd4c0] bg-[#f7f3ed]">
          <p className="text-xs text-[#4a3f30]/70 text-center">Progress is weighted by page count</p>
        </div>
      </div>
    </>
  );
}

// ── BookSpine ──────────────────────────────────────────────────────────────────

function BookSpine({ volume, progress, onClick, dimmed }: {
  volume: Volume; progress: number; onClick: () => void; dimmed?: boolean;
}) {
  const fillPct = Math.round(progress * 100);
  const isFull  = fillPct === 100;
  return (
    <button onClick={onClick} title={`${volume.hebrewLabel ?? volume.label} — ${fillPct}%`}
      className={`group relative flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F3A] focus-visible:ring-offset-2 rounded-sm transition-opacity duration-200 ${dimmed ? 'opacity-20' : 'opacity-100'}`}>
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0B1F3A] text-white text-[10px] font-medium px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10">
        {fillPct}%
      </div>
      <div className="relative overflow-hidden transition-transform duration-200 group-hover:scale-105 group-hover:-translate-y-1"
        style={{ width: 44, height: 110, border: '2px solid #0B1F3A', borderRadius: '3px 3px 0 0', background: 'transparent' }}>
        {fillPct > 0 && <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{ height: `${fillPct}%`, background: '#0B1F3A' }} />}
      </div>
      <div style={{ width: 48, height: 6, background: '#0B1F3A', opacity: isFull ? 1 : 0.25 }} className="rounded-b-sm" />
      <div className="mt-1.5 w-12 flex items-center justify-center">
        <span className="text-[11px] font-semibold select-none font-serif text-center" style={{ color: '#0B1F3A', direction: 'rtl' }}>
          {volume.hebrewLabel ?? volume.label}
        </span>
      </div>
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Bookshelf({ volumes, learned, onToggle }: Props) {
  const [openVolume, setOpenVolume] = useState<Volume | null>(null);
  const [search, setSearch]         = useState('');

  // Search results: match sicha titles
  const searchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return null;
    const hits: { sicha: Sicha; volLabel: string; idx: number }[] = [];
    for (const vol of volumes) {
      vol.sichos.forEach((s, i) => {
        if (s.title.includes(q) || s.title.toLowerCase().includes(q.toLowerCase())) {
          hits.push({ sicha: s, volLabel: vol.hebrewLabel ?? vol.label, idx: i });
        }
      });
    }
    return hits;
  }, [search, volumes]);

  // Dim volumes that have no search hits
  const matchingVolIds = useMemo(() => {
    if (!searchResults) return null;
    return new Set(
      volumes
        .filter((v) => v.sichos.some((s) => s.title.includes(search.trim()) || s.title.toLowerCase().includes(search.trim().toLowerCase())))
        .map((v) => v.id)
    );
  }, [searchResults, volumes, search]);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-14">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1c1610] tracking-tight">My Bookshelf</h2>
          <p className="text-sm text-[#4a3f30] mt-0.5">Track your Likkutei Sichos learning</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/40 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש שיחה… e.g. בראשית, חנוכה, פורים"
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-[#ddd4c0] bg-white text-[#1c1610] placeholder:text-[#4a3f30]/40 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] transition-all"
          dir="rtl"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/40 hover:text-[#4a3f30] transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null && (
        <div className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden mb-4">
          <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0] flex items-center justify-between">
            <span className="text-xs text-[#4a3f30] font-medium">
              {searchResults.length === 0 ? 'No results found' : `${searchResults.length} sicha${searchResults.length !== 1 ? 's' : ''} found`}
            </span>
            {searchResults.length > 0 && (
              <span className="text-xs text-[#4a3f30]/50">click any row to toggle learned</span>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map(({ sicha, volLabel, idx }) => (
                <SichaRow key={sicha.id} sicha={sicha} idx={idx} isLearned={!!learned[sicha.id]} onToggle={onToggle} volLabel={volLabel} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookshelf shelf */}
      <div className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden">
        <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0B1F3A]/30" />
          <span className="text-xs text-[#4a3f30] font-medium tracking-wide uppercase">לקוטי שיחות — {volumes.length} חלקים</span>
        </div>
        <div className="px-8 pt-10 pb-4">
          <div className="flex items-end gap-2 flex-wrap">
            {volumes.map((vol) => (
              <BookSpine
                key={vol.id}
                volume={vol}
                progress={calcProgress(vol, learned)}
                onClick={() => setOpenVolume(vol)}
                dimmed={matchingVolIds !== null && !matchingVolIds.has(vol.id)}
              />
            ))}
          </div>
          <div className="mt-0 rounded-sm" style={{ height: 10, background: 'linear-gradient(180deg, #c8b89a 0%, #a89070 100%)', boxShadow: '0 3px 8px rgba(0,0,0,0.18)' }} />
        </div>
        <div className="px-6 pb-5">
          <p className="text-xs text-[#4a3f30]/50 text-center">Click a volume to track which sichos you have learned</p>
        </div>
      </div>

      {openVolume && (
        <SichaDrawer volume={openVolume} learned={learned} onToggle={onToggle} onClose={() => setOpenVolume(null)} />
      )}
    </section>
  );
}
