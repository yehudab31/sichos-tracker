import { useState, useMemo } from 'react';
import { X, CheckSquare, Square, Search, BookOpen, Star, Bookmark } from 'lucide-react';
import type { Volume, Sicha } from '../data/sampleData';
import type { LearnedMap } from '../hooks/useLearnedState';
import type { StarsMap } from '../hooks/useSichaStars';

interface Props {
  volumes: Volume[];
  learned: LearnedMap;
  favorites: StarsMap;
  bookmarks: StarsMap;
  onToggle: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const BOOK_HEIGHT = 210;
const EMPTY_BG    = 'rgba(11, 31, 58, 0.06)';
const FILL_BG     = '#0B1F3A';
// Dark navy text on light background = perfect contrast.
// When the dark fill rises and covers the text, they merge seamlessly (same color).
// No outline or shadow needed — this is the cleanest approach.
const SPINE_TEXT  = '#0B1F3A';
const SPINE_LINE  = 'rgba(11, 31, 58, 0.2)';

// ── Hebrew volume numbers ─────────────────────────────────────────────────────

const HEB_NUMS: Record<number, string> = {
  1:'א', 2:'ב', 3:'ג', 4:'ד', 5:'ה', 6:'ו', 7:'ז', 8:'ח', 9:'ט', 10:'י',
  11:'יא', 12:'יב', 13:'יג', 14:'יד', 15:'טו', 16:'טז', 17:'יז', 18:'יח', 19:'יט', 20:'כ',
  21:'כא', 22:'כב', 23:'כג', 24:'כד', 25:'כה', 26:'כו', 27:'כז', 28:'כח', 29:'כט', 30:'ל',
  31:'לא', 32:'לב', 33:'לג', 34:'לד', 35:'לה', 36:'לו', 37:'לז', 38:'לח', 39:'לט',
};

// ── dach.dev ──────────────────────────────────────────────────────────────────

function getDachUrl(sicha: Sicha, volId: number): string {
  const m = sicha.pageRef?.match(/ע[^0-9]*(\d+)/);
  return m
    ? `https://dach.dev/book/likkutei-sichos/viewer/${m[1]}_${volId}`
    : `https://dach.dev/book/likkutei-sichos/toc?volume=${volId}`;
}

function openDach(sicha: Sicha, volId: number) {
  const url = getDachUrl(sicha, volId);
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── English → Hebrew search ───────────────────────────────────────────────────

const EN_TO_HE: Record<string, string> = {
  'bereishis':'בראשית','bereishit':'בראשית','genesis':'בראשית','bereshit':'בראשית',
  'noach':'נח','noah':'נח',
  'lech lecha':'לך לך','lech':'לך לך','lecha':'לך לך',
  'vayeira':'וירא','vayera':'וירא',
  'chayei sarah':'חיי שרה','chaye sara':'חיי שרה',
  'toldos':'תולדות','toldot':'תולדות',
  'vayeitzei':'ויצא','vayetzei':'ויצא',
  'vayishlach':'וישלח',
  'vayeishev':'וישב','vayeshev':'וישב',
  'mikeitz':'מקץ','miketz':'מקץ',
  'vayigash':'ויגש',
  'vayechi':'ויחי','vaychi':'ויחי',
  'shemos':'שמות','shemot':'שמות','exodus':'שמות',
  'vaeira':'וארא',"va'eira":'וארא',
  'bo':'בא',
  'beshalach':'בשלח',
  'yisro':'יתרו','yitro':'יתרו','jethro':'יתרו',
  'mishpatim':'משפטים',
  'terumah':'תרומה','trumah':'תרומה',
  'tetzaveh':'תצוה','titzaveh':'תצוה',
  'ki sisa':'תשא','ki tisa':'תשא','tisa':'תשא',
  'vayakhel':'ויקהל',
  'pekudei':'פקודי','pikudei':'פקודי',
  'vayikra':'ויקרא','leviticus':'ויקרא',
  'tzav':'צו','zav':'צו',
  'shemini':'שמיני','shmini':'שמיני',
  'tazria':'תזריע',
  'metzora':'מצורע','metzorah':'מצורע',
  'acharei':'אחרי','achrei':'אחרי',
  'kedoshim':'קדושים',
  'emor':'אמור',
  'behar':'בהר',
  'bechukosai':'בחוקותי','bechukotai':'בחוקותי',
  'bamidbar':'במדבר','numbers':'במדבר',
  'naso':'נשא','nasso':'נשא',
  'behaaloscha':'בהעלותך',"beha'aloscha":'בהעלותך',
  'shlach':'שלח','shelach':'שלח',
  'korach':'קרח',
  'chukas':'חוקת','chukat':'חוקת',
  'balak':'בלק',
  'pinchas':'פנחס','pinchus':'פנחס',
  'mattos':'מטות','matot':'מטות','matos':'מטות',
  'masei':'מסעי','massei':'מסעי',
  'devarim':'דברים','deuteronomy':'דברים',
  'vaeschanan':'ואתחנן','vaetchanan':'ואתחנן',
  'eikev':'עקב','ekev':'עקב',
  'reeh':'ראה',"re'eh":'ראה',
  'shoftim':'שופטים',
  'ki seitzei':'תצא','ki tetzei':'תצא','tetzei':'תצא',
  'ki savo':'תבא','ki tavo':'תבא','tavo':'תבא',
  'nitzavim':'נצבים','netzavim':'נצבים',
  'vayelech':'וילך',
  'haazinu':'האזינו',
  'chanukah':'חנוכה','hanukkah':'חנוכה',
  'purim':'פורים',
  'pesach':'חה"פ','passover':'חה"פ',
  'shavuos':'חה"ש','shavuot':'חה"ש',
  'sukkos':'חה"ס','sukkot':'חה"ס',
};

function getHebrewQuery(q: string): string | null {
  const lower = q.toLowerCase().trim();
  if (EN_TO_HE[lower]) return EN_TO_HE[lower];
  for (const [eng, heb] of Object.entries(EN_TO_HE)) {
    if (eng.startsWith(lower) && lower.length >= 3) return heb;
  }
  return null;
}

function matchesSicha(sicha: Sicha, q: string): boolean {
  if (!q.trim()) return false;
  const lower = q.toLowerCase();
  if (sicha.title.includes(q) || sicha.title.toLowerCase().includes(lower)) return true;
  const heb = getHebrewQuery(q);
  return !!(heb && sicha.title.includes(heb));
}

// ── Sefer helpers ─────────────────────────────────────────────────────────────

const PARSHA_TO_SEFER: Record<string, string> = {
  'בראשית':'בראשית','נח':'בראשית','לך לך':'בראשית','וירא':'בראשית',
  'חיי שרה':'בראשית','תולדות':'בראשית','ויצא':'בראשית','וישלח':'בראשית',
  'וישב':'בראשית','מקץ':'בראשית','ויגש':'בראשית','ויחי':'בראשית',
  'שמות':'שמות','וארא':'שמות','בא':'שמות','בשלח':'שמות',
  'יתרו':'שמות','משפטים':'שמות','תרומה':'שמות','תצוה':'שמות',
  'כי תשא':'שמות','תשא':'שמות','ויקהל':'שמות','פקודי':'שמות',
  'ויקהל פקודי':'שמות',
  'ויקרא':'ויקרא','צו':'ויקרא','שמיני':'ויקרא','תזריע':'ויקרא',
  'מצורע':'ויקרא','אחרי':'ויקרא','אחרי מות':'ויקרא','קדושים':'ויקרא',
  'אחרי קדושים':'ויקרא','אמור':'ויקרא','בהר':'ויקרא','בחוקותי':'ויקרא',
  'בהר בחוקותי':'ויקרא',
  'במדבר':'במדבר','נשא':'במדבר','בהעלותך':'במדבר','שלח':'במדבר',
  'שלח לך':'במדבר','קרח':'במדבר','חוקת':'במדבר','חקת':'במדבר',
  'בלק':'במדבר','פנחס':'במדבר','מטות':'במדבר','מסעי':'במדבר',
  'מטות מסעי':'במדבר','מטו"מ':'במדבר',
  'דברים':'דברים','ואתחנן':'דברים','עקב':'דברים','ראה':'דברים',
  'שופטים':'דברים','תצא':'דברים','כי תצא':'דברים',
  'תבא':'דברים','כי תבא':'דברים','נצבים':'דברים',
  'וילך':'דברים','נצבים וילך':'דברים','האזינו':'דברים',
};

const SEFER_ORDER = ['בראשית','שמות','ויקרא','במדבר','דברים'];
const ORDINALS    = new Set(['א','ב','ג','ד','ה','ו','ז','ח','ט','י']);

function cleanTitle(raw: string): string {
  let t = raw.trim();
  if (/^(פ'|פר'|פרשת)\s/.test(t)) t = t.replace(/^(פ'|פר'|פרשת)\s+/, '').trim();
  const dash = t.indexOf(' - ');
  if (dash !== -1) t = t.slice(0, dash).trim();
  const parts = t.split(' ');
  if (parts.length > 1 && ORDINALS.has(parts[parts.length - 1])) t = parts.slice(0, -1).join(' ');
  return t;
}

function getSeferForTitle(raw: string): string | null {
  const t = cleanTitle(raw);
  if (PARSHA_TO_SEFER[t]) return PARSHA_TO_SEFER[t];
  for (const [key, sefer] of Object.entries(PARSHA_TO_SEFER)) {
    if (t.includes(key)) return sefer;
  }
  return null;
}

function getSefarimForVolume(volume: Volume): string[] {
  const found = new Set<string>();
  for (const s of volume.sichos) {
    const sefer = getSeferForTitle(s.title);
    if (sefer) found.add(sefer);
  }
  return SEFER_ORDER.filter(s => found.has(s));
}

function calcProgress(volume: Volume, learned: LearnedMap): number {
  const total = volume.sichos.reduce((s, x) => s + x.pageCount, 0);
  const done  = volume.sichos.filter(x => learned[x.id]).reduce((s, x) => s + x.pageCount, 0);
  return total === 0 ? 0 : done / total;
}

// ── SpineLine ─────────────────────────────────────────────────────────────────

function SpineLine() {
  return <div style={{ width: '68%', height: 1, background: SPINE_LINE, flexShrink: 0 }} />;
}

// ── BookSpine ─────────────────────────────────────────────────────────────────

function BookSpine({ volume, progress, onClick, dimmed }: {
  volume: Volume; progress: number; onClick: () => void; dimmed?: boolean;
}) {
  const fillPct = Math.round(progress * 100);
  const sefarim = getSefarimForVolume(volume);
  const hebNum  = HEB_NUMS[volume.id] ?? String(volume.id);

  return (
    <button
      onClick={onClick}
      title={`חלק ${hebNum} — ${fillPct}%`}
      className={`group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F3A]/40 transition-opacity duration-200 ${dimmed ? 'opacity-20' : 'opacity-100'}`}
      style={{ width: '100%' }}
    >
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0B1F3A] text-white text-[10px] font-medium px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-20">
        {fillPct}%
      </div>

      <div
        className="relative overflow-hidden w-full transition-transform duration-200 group-hover:scale-[1.04] group-hover:-translate-y-1.5"
        style={{ height: BOOK_HEIGHT, background: EMPTY_BG, borderRadius: '2px 2px 0 0', border: '1px solid rgba(11,31,58,0.13)', boxShadow: '2px 0 6px rgba(0,0,0,0.1), -1px 0 3px rgba(0,0,0,0.05)' }}
      >
        {/* Fill rising from bottom */}
        <div className="absolute bottom-0 left-0 right-0 transition-all duration-700"
          style={{ height: `${fillPct}%`, background: FILL_BG }} />

        {/* Text content — dark navy on light bg, merges with fill when covered */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-between" style={{ padding: '8px 3px' }}>
          <SpineLine />
          <div className="flex flex-1 items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
            <span dir="rtl" style={{ fontSize: 7, fontFamily: 'serif', textAlign: 'center', lineHeight: 1.45, letterSpacing: '0.07em', padding: '0 2px', color: SPINE_TEXT }}>
              לקוטי שיחות
            </span>
          </div>
          <SpineLine />
          <div className="flex flex-[1.5] items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
            <span dir="rtl" style={{ fontSize: 12, fontWeight: '700', fontFamily: 'serif', textAlign: 'center', lineHeight: 1.2, color: SPINE_TEXT }}>
              {`חלק ${hebNum}`}
            </span>
          </div>
          <SpineLine />
          <div className="flex flex-1 items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
            <span dir="rtl" style={{ fontSize: 7.5, fontFamily: 'serif', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line', padding: '0 2px', color: SPINE_TEXT }}>
              {sefarim.join('\n')}
            </span>
          </div>
          <SpineLine />
        </div>
      </div>
      <div style={{ width: '100%', height: 5, background: '#06121e', opacity: 0.85, borderRadius: '0 0 1px 1px' }} />
    </button>
  );
}

// ── SichaRow ──────────────────────────────────────────────────────────────────

function SichaRow({ sicha, isLearned, isFav, isBook, onToggle, onToggleFavorite, onToggleBookmark, volId, volLabel }: {
  sicha: Sicha; isLearned: boolean; isFav: boolean; isBook: boolean;
  onToggle: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  volId: number; volLabel?: string;
}) {
  return (
    <div
      dir="rtl"
      className={`flex items-center gap-1.5 px-4 py-3 border-b border-[#f0ebe3] transition-colors ${isLearned ? 'bg-[#0B1F3A]/5' : 'hover:bg-[#f7f3ed]'}`}
    >
      {/* Learned checkbox */}
      <button onClick={() => onToggle(sicha.id)} className="flex-shrink-0">
        {isLearned
          ? <CheckSquare size={19} className="text-[#0B1F3A]" />
          : <Square      size={19} className="text-[#ddd4c0]" />}
      </button>

      {/* Title + pageRef */}
      <button onClick={() => onToggle(sicha.id)} className="flex-1 min-w-0 text-right" dir="rtl">
        <div className={`text-sm font-semibold font-serif truncate ${isLearned ? 'text-[#0B1F3A]' : 'text-[#1c1610]'}`}>
          {sicha.title}
        </div>
        {(sicha.pageRef || volLabel) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {sicha.pageRef && <span className="text-xs text-[#4a3f30]/60">{sicha.pageRef}</span>}
            {volLabel && <span className="text-[10px] bg-[#f0ebe3] text-[#4a3f30] px-1.5 py-0.5 rounded font-serif">{volLabel}</span>}
          </div>
        )}
      </button>

      {/* pp */}
      <div className="flex-shrink-0" dir="ltr">
        <span className="text-xs font-medium text-[#4a3f30]">{sicha.pageCount}</span>
        <span className="text-[10px] text-[#4a3f30]/60 ml-0.5">pp</span>
      </div>

      {/* Star */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(sicha.id); }}
        title={isFav ? 'Remove favorite' : 'Add to favorites'}
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[#fff8e1]"
      >
        <Star size={13} className={isFav ? 'text-amber-400' : 'text-[#ddd4c0]'} fill={isFav ? '#fbbf24' : 'none'} />
      </button>

      {/* Bookmark */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleBookmark(sicha.id); }}
        title={isBook ? 'Remove bookmark' : 'Add bookmark'}
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[#e8f4ff]"
      >
        <Bookmark size={13} className={isBook ? 'text-blue-400' : 'text-[#ddd4c0]'} fill={isBook ? '#60a5fa' : 'none'} />
      </button>

      {/* dach.dev */}
      <button
        onClick={(e) => { e.stopPropagation(); openDach(sicha, volId); }}
        title="Read on dach.dev"
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[#4a3f30]/40 hover:text-[#0B1F3A] hover:bg-[#eee8de] transition-colors"
      >
        <BookOpen size={13} />
      </button>
    </div>
  );
}

// ── SichaDrawer ───────────────────────────────────────────────────────────────

function SichaDrawer({ volume, learned, favorites, bookmarks, onToggle, onToggleFavorite, onToggleBookmark, onClose }: {
  volume: Volume; learned: LearnedMap; favorites: StarsMap; bookmarks: StarsMap;
  onToggle: (id: string) => void; onToggleFavorite: (id: string) => void;
  onToggleBookmark: (id: string) => void; onClose: () => void;
}) {
  const total      = volume.sichos.reduce((s, x) => s + x.pageCount, 0);
  const learnedPgs = volume.sichos.filter(x => learned[x.id]).reduce((s, x) => s + x.pageCount, 0);
  const fillPct    = total === 0 ? 0 : Math.round((learnedPgs / total) * 100);
  const hebNum     = HEB_NUMS[volume.id] ?? String(volume.id);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ddd4c0]">
          <div dir="rtl">
            <h2 className="text-lg font-semibold text-[#1c1610] font-serif">{`חלק ${hebNum}`}</h2>
            <p className="text-xs text-[#4a3f30] mt-0.5">{learnedPgs} / {total} pages · {fillPct}% complete</p>
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
            <span className="text-xs font-semibold text-[#0B1F3A]">{fillPct}%</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {volume.sichos.map((s) => (
            <SichaRow
              key={s.id} sicha={s} volId={volume.id}
              isLearned={!!learned[s.id]} isFav={!!favorites[s.id]} isBook={!!bookmarks[s.id]}
              onToggle={onToggle} onToggleFavorite={onToggleFavorite} onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
        <div className="px-6 py-4 border-t border-[#ddd4c0] bg-[#f7f3ed]">
          <p className="text-xs text-[#4a3f30]/70 text-center">
            <BookOpen size={10} className="inline mr-1" />
            Book icon opens the sicha on dach.dev in a new tab
          </p>
        </div>
      </div>
    </>
  );
}

// ── sessionStorage key for open volume ───────────────────────────────────────

const SESSION_KEY = 'sichosTracker_openVolumeId';

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Bookshelf({ volumes, learned, favorites, bookmarks, onToggle, onToggleFavorite, onToggleBookmark }: Props) {
  const [search, setSearch] = useState('');

  const [openVolumeId, setOpenVolumeId] = useState<number | null>(() => {
    try { const s = sessionStorage.getItem(SESSION_KEY); return s ? Number(s) : null; } catch { return null; }
  });

  const openVolume = useMemo(
    () => openVolumeId != null ? (volumes.find(v => v.id === openVolumeId) ?? null) : null,
    [openVolumeId, volumes]
  );

  function handleOpen(vol: Volume | null) {
    const id = vol?.id ?? null;
    setOpenVolumeId(id);
    try {
      if (id != null) sessionStorage.setItem(SESSION_KEY, String(id));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }

  const searchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return null;
    const hits: { sicha: Sicha; vol: Volume }[] = [];
    for (const vol of volumes) {
      for (const s of vol.sichos) {
        if (matchesSicha(s, q)) hits.push({ sicha: s, vol });
      }
    }
    return hits;
  }, [search, volumes]);

  const matchingVolIds = useMemo(() => {
    if (!searchResults) return null;
    return new Set(searchResults.map(r => r.vol.id));
  }, [searchResults]);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-14">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#1c1610] tracking-tight">My Bookshelf</h2>
        <p className="text-sm text-[#4a3f30] mt-0.5">Track your Likkutei Sichos learning</p>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/40 pointer-events-none" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search: בראשית, Bereishis, Noach, Chanukah…"
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-[#ddd4c0] bg-white text-[#1c1610] placeholder:text-[#4a3f30]/40 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/40 hover:text-[#4a3f30]">
            <X size={14} />
          </button>
        )}
      </div>

      {searchResults !== null && (
        <div className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden mb-4">
          <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0]">
            <span className="text-xs text-[#4a3f30] font-medium">
              {searchResults.length === 0 ? 'No results' : `${searchResults.length} sicha${searchResults.length !== 1 ? 's' : ''} found`}
            </span>
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map(({ sicha, vol }) => (
                <SichaRow
                  key={sicha.id} sicha={sicha} volId={vol.id}
                  volLabel={`חלק ${HEB_NUMS[vol.id] ?? vol.id}`}
                  isLearned={!!learned[sicha.id]} isFav={!!favorites[sicha.id]} isBook={!!bookmarks[sicha.id]}
                  onToggle={onToggle} onToggleFavorite={onToggleFavorite} onToggleBookmark={onToggleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden">
        <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0B1F3A]/30" />
          <span className="text-xs text-[#4a3f30] font-medium tracking-wide uppercase">לקוטי שיחות — {volumes.length} חלקים</span>
        </div>
        <div className="px-6 pt-10 pb-3">
          <div dir="rtl" style={{ display: 'grid', gridTemplateColumns: 'repeat(13, minmax(0, 1fr))', gap: '6px', alignItems: 'end' }}>
            {volumes.map(vol => (
              <BookSpine key={vol.id} volume={vol} progress={calcProgress(vol, learned)}
                onClick={() => handleOpen(vol)} dimmed={matchingVolIds !== null && !matchingVolIds.has(vol.id)} />
            ))}
          </div>
          <div style={{ height: 14, background: 'linear-gradient(180deg, #c8b89a 0%, #a08860 100%)', borderRadius: '0 0 4px 4px', boxShadow: '0 5px 12px rgba(0,0,0,0.22)' }} />
        </div>
        <p className="text-xs text-[#4a3f30]/50 text-center py-4">Click a volume to track which sichos you have learned</p>
      </div>

      {openVolume && (
        <SichaDrawer
          volume={openVolume} learned={learned} favorites={favorites} bookmarks={bookmarks}
          onToggle={onToggle} onToggleFavorite={onToggleFavorite} onToggleBookmark={onToggleBookmark}
          onClose={() => handleOpen(null)}
        />
      )}
    </section>
  );
}
