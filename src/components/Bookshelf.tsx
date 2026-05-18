import { useState, useMemo } from 'react';
import { X, CheckSquare, Square, ExternalLink, Search } from 'lucide-react';
import type { Volume, Sicha } from '../data/sampleData';
import type { LearnedMap } from '../hooks/useLearnedState';

interface Props {
  volumes: Volume[];
  learned: LearnedMap;
  onToggle: (id: string) => void;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const BOOK_HEIGHT  = 210;
const EMPTY_BG     = '#1c3a5e';            // medium navy — unlearned area
const FILL_BG      = '#0B1F3A';            // dark navy  — learned fill
const TEXT_BRIGHT  = 'rgba(255,255,255,0.92)';
const TEXT_DIM     = 'rgba(255,255,255,0.65)';
const LINE_COLOR   = 'rgba(255,255,255,0.28)';

// ── Hebrew volume numbers ─────────────────────────────────────────────────────

const HEB_NUMS: Record<number, string> = {
  1:'א', 2:'ב', 3:'ג', 4:'ד', 5:'ה', 6:'ו', 7:'ז', 8:'ח', 9:'ט', 10:'י',
  11:'יא', 12:'יב', 13:'יג', 14:'יד', 15:'טו', 16:'טז', 17:'יז', 18:'יח', 19:'יט', 20:'כ',
  21:'כא', 22:'כב', 23:'כג', 24:'כד', 25:'כה', 26:'כו', 27:'כז', 28:'כח', 29:'כט', 30:'ל',
  31:'לא', 32:'לב', 33:'לג', 34:'לד', 35:'לה', 36:'לו', 37:'לז', 38:'לח', 39:'לט',
};

// ── Sefer helpers ─────────────────────────────────────────────────────────────

const PARSHA_TO_SEFER: Record<string, string> = {
  'בראשית':'בראשית','נח':'בראשית','לך לך':'בראשית','וירא':'בראשית',
  'חיי שרה':'בראשית','תולדות':'בראשית','ויצא':'בראשית','וישלח':'בראשית',
  'וישב':'בראשית','מקץ':'בראשית','ויגש':'בראשית','ויחי':'בראשית',
  'שמות':'שמות','וארא':'שמות','בא':'שמות','בשלח':'שמות',
  'יתרו':'שמות','משפטים':'שמות','תרומה':'שמות','תצוה':'שמות',
  'תשא':'שמות','ויקהל':'שמות','פקודי':'שמות',
  'ויקרא':'ויקרא','צו':'ויקרא','שמיני':'ויקרא','תזריע':'ויקרא',
  'מצורע':'ויקרא','אחרי':'ויקרא','קדושים':'ויקרא','אמור':'ויקרא',
  'בהר':'ויקרא','בחוקותי':'ויקרא','אחרי מות':'ויקרא',
  'במדבר':'במדבר','נשא':'במדבר','בהעלותך':'במדבר','שלח':'במדבר',
  'קרח':'במדבר','חוקת':'במדבר','בלק':'במדבר','פנחס':'במדבר',
  'מטות':'במדבר','מסעי':'במדבר','מטו"מ':'במדבר','מטות מסעי':'במדבר',
  'דברים':'דברים','ואתחנן':'דברים','עקב':'דברים','ראה':'דברים',
  'שופטים':'דברים','תצא':'דברים','תבא':'דברים','נצבים':'דברים',
  'וילך':'דברים','האזינו':'דברים','נצבים וילך':'דברים',
};

const SEFER_ORDER = ['בראשית','שמות','ויקרא','במדבר','דברים'];
const ORDINALS    = new Set(['א','ב','ג','ד','ה','ו','ז','ח','ט','י']);

function cleanTitle(raw: string): string {
  let t = raw.trim();
  const dash = t.indexOf(' - ');
  if (dash !== -1) t = t.slice(0, dash).trim();
  const parts = t.split(' ');
  if (parts.length > 1 && ORDINALS.has(parts[parts.length - 1])) {
    t = parts.slice(0, -1).join(' ');
  }
  return t;
}

function getSefarimForVolume(volume: Volume): string[] {
  const found = new Set<string>();
  for (const s of volume.sichos) {
    const sefer = PARSHA_TO_SEFER[cleanTitle(s.title)];
    if (sefer) found.add(sefer);
  }
  return SEFER_ORDER.filter(s => found.has(s));
}

// ── Progress ──────────────────────────────────────────────────────────────────

function calcProgress(volume: Volume, learned: LearnedMap): number {
  const total = volume.sichos.reduce((s, x) => s + x.pageCount, 0);
  const done  = volume.sichos.filter(x => learned[x.id]).reduce((s, x) => s + x.pageCount, 0);
  return total === 0 ? 0 : done / total;
}

// ── Spine primitives ──────────────────────────────────────────────────────────

function SpineLine() {
  return (
    <div style={{ width: '62%', height: '1px', background: LINE_COLOR, flexShrink: 0 }} />
  );
}

function VText({ children, size, bold = false, color = TEXT_BRIGHT, spacing = '0.08em' }: {
  children: React.ReactNode;
  size: number;
  bold?: boolean;
  color?: string;
  spacing?: string;
}) {
  return (
    <span
      style={{
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        fontSize: size,
        fontWeight: bold ? '700' : '400',
        color,
        letterSpacing: spacing,
        fontFamily: 'serif',
        lineHeight: 1.15,
        overflow: 'hidden',
        maxHeight: '100%',
      }}
    >
      {children}
    </span>
  );
}

// ── BookSpine ─────────────────────────────────────────────────────────────────

function BookSpine({ volume, progress, onClick, dimmed }: {
  volume: Volume; progress: number; onClick: () => void; dimmed?: boolean;
}) {
  const fillPct = Math.round(progress * 100);
  const sefarim = getSefarimForVolume(volume);
  const hebNum  = HEB_NUMS[volume.id] ?? String(volume.id);
  const seferLabel = sefarim.join(' ');

  return (
    <button
      onClick={onClick}
      title={`חלק ${hebNum} — ${fillPct}%`}
      className={`group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-opacity duration-200 ${dimmed ? 'opacity-20' : 'opacity-100'}`}
      style={{ width: '100%' }}
    >
      {/* % tooltip on hover */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0B1F3A] text-white text-[10px] font-medium px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-20"
      >
        {fillPct}%
      </div>

      {/* Book body */}
      <div
        className="relative overflow-hidden w-full transition-transform duration-200 group-hover:scale-[1.04] group-hover:-translate-y-1.5"
        style={{
          height: BOOK_HEIGHT,
          background: EMPTY_BG,
          borderRadius: '2px 2px 0 0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.35), -1px 0 3px rgba(0,0,0,0.2)',
        }}
      >
        {/* Dark fill rising from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700"
          style={{ height: `${fillPct}%`, background: FILL_BG }}
        />

        {/* Spine content — above the fill */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-between z-10"
          style={{ padding: '10px 0' }}
        >
          <SpineLine />

          {/* לקוטי שיחות */}
          <div className="flex flex-1 items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
            <VText size={6} color={TEXT_DIM} spacing="0.18em">לקוטי שיחות</VText>
          </div>

          <SpineLine />

          {/* חלק + number */}
          <div className="flex flex-[1.6] items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
            <VText size={12.5} bold spacing="0.04em">{`חלק ${hebNum}`}</VText>
          </div>

          <SpineLine />

          {/* Sefer name(s) */}
          <div className="flex flex-1 items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
            <VText size={6.5} spacing="0.06em">{seferLabel}</VText>
          </div>

          <SpineLine />
        </div>
      </div>

      {/* Shelf peg */}
      <div
        style={{
          width: '100%',
          height: 5,
          background: '#06121e',
          borderRadius: '0 0 1px 1px',
        }}
      />
    </button>
  );
}

// ── SichaRow ──────────────────────────────────────────────────────────────────

function SichaRow({ sicha, idx, isLearned, onToggle, volLabel }: {
  sicha: Sicha; idx: number; isLearned: boolean;
  onToggle: (id: string) => void; volLabel?: string;
}) {
  return (
    <div
      dir="rtl"
      className={`flex items-center gap-2 px-4 py-3 border-b border-[#f0ebe3] transition-colors ${isLearned ? 'bg-[#0B1F3A]/5' : 'hover:bg-[#f7f3ed]'}`}
    >
      {/* Toggle button — rightmost, takes all remaining space */}
      <button
        onClick={() => onToggle(sicha.id)}
        className="flex items-center gap-2.5 flex-1 min-w-0 text-right"
        dir="rtl"
      >
        {/* Checkbox — rightmost */}
        <div className="flex-shrink-0">
          {isLearned
            ? <CheckSquare size={20} className="text-[#0B1F3A]" />
            : <Square size={20} className="text-[#ddd4c0]" />}
        </div>

        {/* Index bubble */}
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
          style={{
            background:   isLearned ? '#0B1F3A' : 'transparent',
            borderColor:  isLearned ? '#0B1F3A' : '#ddd4c0',
            color:        isLearned ? '#fff' : '#4a3f30',
          }}
        >
          {idx + 1}
        </div>

        {/* Title + page ref */}
        <div className="flex-1 min-w-0" dir="rtl">
          <div
            className={`text-sm font-semibold font-serif truncate ${isLearned ? 'text-[#0B1F3A]' : 'text-[#1c1610]'}`}
          >
            {sicha.title}
          </div>
          {(sicha.pageRef || volLabel) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {sicha.pageRef && (
                <span className="text-xs text-[#4a3f30]/60">{sicha.pageRef}</span>
              )}
              {volLabel && (
                <span className="text-[10px] bg-[#f0ebe3] text-[#4a3f30] px-1.5 py-0.5 rounded font-serif">
                  {volLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Page count — left side */}
      <div className="flex-shrink-0" dir="ltr">
        <span className="text-xs font-medium text-[#4a3f30]">{sicha.pageCount}</span>
        <span className="text-[10px] text-[#4a3f30]/60 ml-0.5">pp</span>
      </div>

      {/* PDF link — leftmost */}
      {sicha.pdfUrl && (
        <a
          href={sicha.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title="Open PDF"
          className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[#4a3f30]/40 hover:text-[#0B1F3A] hover:bg-[#eee8de] transition-colors"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

// ── SichaDrawer ───────────────────────────────────────────────────────────────

function SichaDrawer({ volume, learned, onToggle, onClose }: {
  volume: Volume; learned: LearnedMap;
  onToggle: (id: string) => void; onClose: () => void;
}) {
  const total      = volume.sichos.reduce((s, x) => s + x.pageCount, 0);
  const learnedPgs = volume.sichos.filter(x => learned[x.id]).reduce((s, x) => s + x.pageCount, 0);
  const fillPct    = total === 0 ? 0 : Math.round((learnedPgs / total) * 100);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ddd4c0]">
          <div dir="rtl">
            <h2 className="text-lg font-semibold text-[#1c1610] font-serif">
              {`חלק ${HEB_NUMS[volume.id] ?? volume.id}`}
            </h2>
            <p className="text-xs text-[#4a3f30] mt-0.5" dir="ltr">
              {learnedPgs} / {total} pages · {fillPct}% complete
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
            <span className="text-xs font-semibold text-[#0B1F3A] w-8 text-right" dir="ltr">
              {fillPct}%
            </span>
          </div>
        </div>

        {/* Sicha list */}
        <div className="flex-1 overflow-y-auto py-2">
          {volume.sichos.map((s, i) => (
            <SichaRow
              key={s.id}
              sicha={s}
              idx={i}
              isLearned={!!learned[s.id]}
              onToggle={onToggle}
            />
          ))}
        </div>

        <div className="px-6 py-4 border-t border-[#ddd4c0] bg-[#f7f3ed]">
          <p className="text-xs text-[#4a3f30]/70 text-center">Progress is weighted by page count</p>
        </div>
      </div>
    </>
  );
}

// ── Main Bookshelf ────────────────────────────────────────────────────────────

export default function Bookshelf({ volumes, learned, onToggle }: Props) {
  const [openVolume, setOpenVolume] = useState<Volume | null>(null);
  const [search, setSearch]         = useState('');

  const searchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return null;
    const hits: { sicha: Sicha; volLabel: string; idx: number }[] = [];
    for (const vol of volumes) {
      vol.sichos.forEach((s, i) => {
        if (s.title.includes(q) || s.title.toLowerCase().includes(q.toLowerCase())) {
          hits.push({ sicha: s, volLabel: `חלק ${HEB_NUMS[vol.id] ?? vol.id}`, idx: i });
        }
      });
    }
    return hits;
  }, [search, volumes]);

  const matchingVolIds = useMemo(() => {
    if (!searchResults) return null;
    const q = search.trim();
    return new Set(
      volumes
        .filter(v => v.sichos.some(s => s.title.includes(q) || s.title.toLowerCase().includes(q.toLowerCase())))
        .map(v => v.id)
    );
  }, [searchResults, volumes, search]);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-14">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#1c1610] tracking-tight">My Bookshelf</h2>
        <p className="text-sm text-[#4a3f30] mt-0.5">Track your Likkutei Sichos learning</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/40 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש שיחה… e.g. בראשית, חנוכה, פורים"
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-[#ddd4c0] bg-white text-[#1c1610] placeholder:text-[#4a3f30]/40 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] transition-all"
          dir="rtl"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/40 hover:text-[#4a3f30] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null && (
        <div className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden mb-4">
          <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0] flex items-center justify-between">
            <span className="text-xs text-[#4a3f30] font-medium">
              {searchResults.length === 0
                ? 'No results found'
                : `${searchResults.length} sicha${searchResults.length !== 1 ? 's' : ''} found`}
            </span>
            {searchResults.length > 0 && (
              <span className="text-xs text-[#4a3f30]/50">tap to toggle learned</span>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map(({ sicha, volLabel, idx }) => (
                <SichaRow
                  key={sicha.id}
                  sicha={sicha}
                  idx={idx}
                  isLearned={!!learned[sicha.id]}
                  onToggle={onToggle}
                  volLabel={volLabel}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookshelf */}
      <div className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden">
        <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0B1F3A]/30" />
          <span className="text-xs text-[#4a3f30] font-medium tracking-wide uppercase">
            לקוטי שיחות — {volumes.length} חלקים
          </span>
        </div>

        <div className="px-6 pt-10 pb-3">
          {/* 13 × 3 grid, RTL so vol 1 is top-right */}
          <div
            dir="rtl"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(13, minmax(0, 1fr))',
              gap: '6px',
              alignItems: 'end',
            }}
          >
            {volumes.map(vol => (
              <BookSpine
                key={vol.id}
                volume={vol}
                progress={calcProgress(vol, learned)}
                onClick={() => setOpenVolume(vol)}
                dimmed={matchingVolIds !== null && !matchingVolIds.has(vol.id)}
              />
            ))}
          </div>

          {/* Wooden shelf */}
          <div
            style={{
              height: 14,
              marginTop: 0,
              background: 'linear-gradient(180deg, #c8b89a 0%, #a08860 100%)',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 5px 12px rgba(0,0,0,0.25)',
            }}
          />
        </div>

        <p className="text-xs text-[#4a3f30]/50 text-center py-4">
          Click a volume to track which sichos you have learned
        </p>
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
