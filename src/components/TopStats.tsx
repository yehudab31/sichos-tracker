import { BookMarked, FileText, BarChart3, BookOpen } from 'lucide-react';
import type { Volume } from '../data/sampleData';
import type { LearnedMap } from '../hooks/useLearnedState';

interface Props {
  volumes: Volume[];
  learned: LearnedMap;
}

// Exact parsha → sefer mapping.
// We strip the ordinal suffix (א, ב, ג…) before lookup so "בראשית א" → "בראשית"
const PARSHA_TO_SEFER: Record<string, string> = {
  // בראשית
  'בראשית': 'בראשית', 'נח': 'בראשית', 'לך לך': 'בראשית', 'וירא': 'בראשית',
  'חיי שרה': 'בראשית', 'תולדות': 'בראשית', 'ויצא': 'בראשית', 'וישלח': 'בראשית',
  'וישב': 'בראשית', 'מקץ': 'בראשית', 'ויגש': 'בראשית', 'ויחי': 'בראשית',
  // שמות
  'שמות': 'שמות', 'וארא': 'שמות', 'בא': 'שמות', 'בשלח': 'שמות',
  'יתרו': 'שמות', 'משפטים': 'שמות', 'תרומה': 'שמות', 'תצוה': 'שמות',
  'תשא': 'שמות', 'ויקהל': 'שמות', 'פקודי': 'שמות',
  // ויקרא
  'ויקרא': 'ויקרא', 'צו': 'ויקרא', 'שמיני': 'ויקרא', 'תזריע': 'ויקרא',
  'מצורע': 'ויקרא', 'אחרי': 'ויקרא', 'קדושים': 'ויקרא', 'אמור': 'ויקרא',
  'בהר': 'ויקרא', 'בחוקותי': 'ויקרא', 'אחרי מות': 'ויקרא',
  // במדבר
  'במדבר': 'במדבר', 'נשא': 'במדבר', 'בהעלותך': 'במדבר', 'שלח': 'במדבר',
  'קרח': 'במדבר', 'חוקת': 'במדבר', 'בלק': 'במדבר', 'פנחס': 'במדבר',
  'מטות': 'במדבר', 'מסעי': 'במדבר', 'מטו"מ': 'במדבר', 'מטות מסעי': 'במדבר',
  // דברים
  'דברים': 'דברים', 'ואתחנן': 'דברים', 'עקב': 'דברים', 'ראה': 'דברים',
  'שופטים': 'דברים', 'תצא': 'דברים', 'תבא': 'דברים', 'נצבים': 'דברים',
  'וילך': 'דברים', 'האזינו': 'דברים', 'נצבים וילך': 'דברים',
};

const SFARIM = ['בראשית', 'שמות', 'ויקרא', 'במדבר', 'דברים'];
const ORDINALS = new Set(['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י']);

// Strip trailing ordinal letter, e.g. "בראשית א" → "בראשית"
function stripOrdinal(title: string): string {
  const parts = title.trim().split(' ');
  if (parts.length > 1 && ORDINALS.has(parts[parts.length - 1])) {
    return parts.slice(0, -1).join(' ');
  }
  return title.trim();
}

// Strip everything after a dash (e.g. "וישלח - י"ט כסלו" → "וישלח")
function stripNote(title: string): string {
  const dashIdx = title.indexOf(' - ');
  return dashIdx !== -1 ? title.slice(0, dashIdx).trim() : title;
}

function getSeferForTitle(rawTitle: string): string {
  const title = stripOrdinal(stripNote(rawTitle));
  return PARSHA_TO_SEFER[title] ?? 'מועדים';
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; accent?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow ${accent ? 'border-[#0B1F3A]/30' : 'border-[#ddd4c0]'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#4a3f30] uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-[#0B1F3A]' : 'bg-[#f7f3ed]'}`}>
          <span className={accent ? 'text-white' : 'text-[#0B1F3A]'}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-3xl font-semibold text-[#1c1610] font-serif">{value}</div>
        <div className="text-xs text-[#4a3f30] mt-1">{sub}</div>
      </div>
    </div>
  );
}

export default function TopStats({ volumes, learned }: Props) {
  const allSichos    = volumes.flatMap((v) => v.sichos);
  const totalSichos  = allSichos.length;
  const totalPages   = allSichos.reduce((sum, s) => sum + s.pageCount, 0);
  const learnedList  = allSichos.filter((s) => learned[s.id]);
  const learnedSichos = learnedList.length;
  const learnedPages  = learnedList.reduce((sum, s) => sum + s.pageCount, 0);
  const overallPct    = totalPages === 0 ? 0 : Math.round((learnedPages / totalPages) * 100);
  const completedVols = volumes.filter(
    (v) => v.sichos.length > 0 && v.sichos.every((s) => learned[s.id])
  ).length;

  // Sefer stats — always show all 5 sfarim + מועדים
  const seferStats = [...SFARIM, 'מועדים'].map((sefer) => {
    const sichos = allSichos.filter((s) => getSeferForTitle(s.title) === sefer);
    return {
      name:    sefer,
      total:   sichos.length,
      learned: sichos.filter((s) => learned[s.id]).length,
    };
  });

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
      <h2 className="text-lg font-semibold text-[#1c1610] tracking-tight mb-6">Your Progress</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <StatCard icon={<BookMarked size={16} />} label="Sichos" value={learnedSichos} sub={`of ${totalSichos}`} />
        <StatCard icon={<FileText size={16} />} label="Pages" value={learnedPages.toLocaleString()} sub={`of ${totalPages.toLocaleString()}`} />
        <StatCard icon={<BookOpen size={16} />} label="Volumes" value={completedVols} sub="of 39 complete" />
        <StatCard icon={<BarChart3 size={16} />} label="Overall" value={`${overallPct}%`} sub="by page weight" accent />
      </div>

      {overallPct > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1.5 rounded-full bg-[#ddd4c0] overflow-hidden">
            <div className="h-1.5 rounded-full bg-[#0B1F3A] transition-all duration-500" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="text-xs text-[#4a3f30] font-medium whitespace-nowrap">
            {learnedPages.toLocaleString()} / {totalPages.toLocaleString()} pp
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#ddd4c0] shadow-sm p-5">
        <p className="text-xs font-medium text-[#4a3f30] uppercase tracking-widest mb-4">
          Progress by Sefer
        </p>
        <div className="flex flex-col gap-3">
          {seferStats.map(({ name, learned: l, total: t }) => {
            const pct = t === 0 ? 0 : Math.round((l / t) * 100);
            return (
              <div key={name} className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold text-[#1c1610] font-serif w-16 text-right shrink-0"
                  dir="rtl"
                >
                  {name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-[#ede8df] overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[#0B1F3A] transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-[#4a3f30] w-9 text-right shrink-0">{pct}%</span>
                <span className="text-xs text-[#4a3f30]/40 w-16 shrink-0">{l} / {t}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
