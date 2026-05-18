import { useState } from 'react';
import { X, CheckSquare, Square, ExternalLink } from 'lucide-react';
import type { Volume } from '../data/sampleData';
import type { LearnedMap } from '../hooks/useLearnedState';

interface Props {
  volumes: Volume[];
  learned: LearnedMap;
  onToggle: (id: string) => void;
}

function calcProgress(volume: Volume, learned: LearnedMap): number {
  const totalPages = volume.sichos.reduce((sum, s) => sum + s.pageCount, 0);
  const learnedPages = volume.sichos
    .filter((s) => learned[s.id])
    .reduce((sum, s) => sum + s.pageCount, 0);
  return totalPages === 0 ? 0 : learnedPages / totalPages;
}

interface SpineProps {
  volume: Volume;
  progress: number;
  onClick: () => void;
}

function BookSpine({ volume, progress, onClick }: SpineProps) {
  const fillPct = Math.round(progress * 100);
  const isFull = fillPct === 100;

  return (
    <button
      onClick={onClick}
      title={`${volume.hebrewLabel ?? volume.label} — ${fillPct}%`}
      className="group relative flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F3A] focus-visible:ring-offset-2 rounded-sm"
    >
      {/* Hover % badge */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0B1F3A] text-white text-[10px] font-medium px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10">
        {fillPct}%
      </div>

      {/* Spine body */}
      <div
        className="relative overflow-hidden transition-transform duration-200 group-hover:scale-105 group-hover:-translate-y-1"
        style={{
          width: 44,
          height: 110,
          border: '2px solid #0B1F3A',
          borderRadius: '3px 3px 0 0',
          background: 'transparent',
        }}
      >
        {fillPct > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-500"
            style={{ height: `${fillPct}%`, background: '#0B1F3A' }}
          />
        )}
      </div>

      {/* Base bump */}
      <div
        style={{ width: 48, height: 6, background: '#0B1F3A', opacity: isFull ? 1 : 0.25 }}
        className="rounded-b-sm"
      />

      {/* Horizontal label */}
      <div className="mt-1.5 w-12 flex items-center justify-center">
        <span
          className="text-[11px] font-semibold select-none font-serif text-center"
          style={{ color: '#0B1F3A', direction: 'rtl' }}
        >
          {volume.hebrewLabel ?? volume.label}
        </span>
      </div>
    </button>
  );
}

interface DrawerProps {
  volume: Volume;
  learned: LearnedMap;
  onToggle: (id: string) => void;
  onClose: () => void;
}

function SichaDrawer({ volume, learned, onToggle, onClose }: DrawerProps) {
  const progress = calcProgress(volume, learned);
  const fillPct = Math.round(progress * 100);
  const totalPages = volume.sichos.reduce((sum, s) => sum + s.pageCount, 0);
  const learnedPages = volume.sichos
    .filter((s) => learned[s.id])
    .reduce((sum, s) => sum + s.pageCount, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ddd4c0]">
          <div>
            <h2 className="text-lg font-semibold text-[#1c1610] font-serif" dir="rtl">
              {volume.hebrewLabel ?? volume.label}
            </h2>
            <p className="text-xs text-[#4a3f30] mt-0.5">
              {learnedPages} / {totalPages} pages · {fillPct}% complete
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4a3f30] hover:bg-[#f7f3ed] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-[#ddd4c0] bg-[#f7f3ed]">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[#ddd4c0] overflow-hidden">
              <div
                className="h-2 rounded-full bg-[#0B1F3A] transition-all duration-500"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-[#0B1F3A] w-8 text-right">{fillPct}%</span>
          </div>
        </div>

        {/* Sicha list */}
        <div className="flex-1 overflow-y-auto py-2">
          {volume.sichos.map((sicha, idx) => {
            const isLearned = !!learned[sicha.id];
            return (
              <div
                key={sicha.id}
                className={`flex items-center gap-2 px-4 py-3 border-b border-[#f0ebe3] transition-colors ${
                  isLearned ? 'bg-[#0B1F3A]/5' : 'hover:bg-[#f7f3ed]'
                }`}
              >
                {/* Main toggle row */}
                <button
                  onClick={() => onToggle(sicha.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="flex-shrink-0">
                    {isLearned
                      ? <CheckSquare size={20} className="text-[#0B1F3A]" />
                      : <Square size={20} className="text-[#ddd4c0]" />
                    }
                  </div>

                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
                    style={{
                      background: isLearned ? '#0B1F3A' : 'transparent',
                      borderColor: isLearned ? '#0B1F3A' : '#ddd4c0',
                      color: isLearned ? '#fff' : '#4a3f30',
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-semibold font-serif ${isLearned ? 'text-[#0B1F3A]' : 'text-[#1c1610]'}`}
                      dir="rtl"
                    >
                      {sicha.title}
                    </div>
                    {sicha.pageRef && (
                      <div className="text-xs text-[#4a3f30]/60 mt-0.5" dir="rtl">
                        {sicha.pageRef}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs font-medium text-[#4a3f30]">{sicha.pageCount}</span>
                    <span className="text-[10px] text-[#4a3f30]/60 ml-0.5">pp</span>
                  </div>
                </button>

                {/* PDF link — separate so it doesn't trigger toggle */}
                {sicha.pdfUrl && (
                  <a
                    href={sicha.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Open PDF"
                    className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[#4a3f30]/40 hover:text-[#0B1F3A] hover:bg-[#eee8de] transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-[#ddd4c0] bg-[#f7f3ed]">
          <p className="text-xs text-[#4a3f30]/70 text-center">Progress is weighted by page count</p>
        </div>
      </div>
    </>
  );
}

export default function Bookshelf({ volumes, learned, onToggle }: Props) {
  const [openVolume, setOpenVolume] = useState<Volume | null>(null);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-semibold text-[#1c1610] tracking-tight">My Bookshelf</h2>
          <p className="text-sm text-[#4a3f30] mt-0.5">Track your Likkutei Sichos learning</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden">
        <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0B1F3A]/30" />
          <span className="text-xs text-[#4a3f30] font-medium tracking-wide uppercase">
            לקוטי שיחות — {volumes.length} חלקים
          </span>
        </div>

        <div className="px-8 pt-10 pb-4">
          <div className="flex items-end gap-2 flex-wrap">
            {volumes.map((vol) => (
              <BookSpine
                key={vol.id}
                volume={vol}
                progress={calcProgress(vol, learned)}
                onClick={() => setOpenVolume(vol)}
              />
            ))}
          </div>
          <div
            className="mt-0 rounded-sm"
            style={{
              height: 10,
              background: 'linear-gradient(180deg, #c8b89a 0%, #a89070 100%)',
              boxShadow: '0 3px 8px rgba(0,0,0,0.18)',
            }}
          />
        </div>

        <div className="px-6 pb-5">
          <p className="text-xs text-[#4a3f30]/50 text-center">
            Click a volume to track which sichos you have learned
          </p>
        </div>
      </div>

      {openVolume && (
        <SichaDrawer
          volume={openVolume}
          learned={learned}
          onToggle={onToggle}
          onClose={() => setOpenVolume(null)}
        />
      )}
    </section>
  );
}
