import { BookOpen, Star, Bookmark } from 'lucide-react';
import type { Volume } from '../data/sampleData';
import type { StarsMap } from '../hooks/useSichaStars';
import type { LearnedMap } from '../hooks/useLearnedState';

interface Props {
  mode: 'favorites' | 'bookmarks';
  volumes: Volume[];
  learned: LearnedMap;
  favorites: StarsMap;
  bookmarks: StarsMap;
  toggleFavorite: (id: string) => void;
  toggleBookmark: (id: string) => void;
  onToggleLearned: (id: string) => void;
}

const HEB_NUMS: Record<number, string> = {
  1:'א', 2:'ב', 3:'ג', 4:'ד', 5:'ה', 6:'ו', 7:'ז', 8:'ח', 9:'ט', 10:'י',
  11:'יא', 12:'יב', 13:'יג', 14:'יד', 15:'טו', 16:'טז', 17:'יז', 18:'יח', 19:'יט', 20:'כ',
  21:'כא', 22:'כב', 23:'כג', 24:'כד', 25:'כה', 26:'כו', 27:'כז', 28:'כח', 29:'כט', 30:'ל',
  31:'לא', 32:'לב', 33:'לג', 34:'לד', 35:'לה', 36:'לו', 37:'לז', 38:'לח', 39:'לט',
};

function getDachUrl(pageRef: string, volId: number): string {
  const m = pageRef?.match(/ע[^0-9]*(\d+)/);
  return m
    ? `https://dach.dev/book/likkutei-sichos/viewer/${m[1]}_${volId}`
    : `https://dach.dev/book/likkutei-sichos/toc?volume=${volId}`;
}

function openInNewTab(url: string) {
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

export default function StarsPanel({
  mode, volumes, learned, favorites, bookmarks, toggleFavorite, toggleBookmark, onToggleLearned,
}: Props) {
  const map = mode === 'favorites' ? favorites : bookmarks;
  const Icon = mode === 'favorites' ? Star : Bookmark;
  const label = mode === 'favorites' ? 'Favorites' : 'Bookmarks';
  const emptyText = mode === 'favorites'
    ? 'Star a sicha to save it here'
    : 'Bookmark a sicha to save it here';

  // Collect marked sichos, preserving volume grouping
  const groups: { vol: Volume; sichosList: { sicha: (typeof volumes[0]['sichos'][0]); }[] }[] = [];
  for (const vol of volumes) {
    const marked = vol.sichos.filter(s => map[s.id]);
    if (marked.length > 0) groups.push({ vol, sichosList: marked.map(s => ({ sicha: s })) });
  }

  const total = groups.reduce((s, g) => s + g.sichosList.length, 0);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-14">
      <div className="flex items-center gap-3 mb-6">
        <Icon size={20} className="text-[#0B1F3A]" fill={mode === 'favorites' ? '#0B1F3A' : 'none'} />
        <div>
          <h2 className="text-lg font-semibold text-[#1c1610] tracking-tight">{label}</h2>
          <p className="text-sm text-[#4a3f30] mt-0.5">
            {total === 0 ? emptyText : `${total} sicha${total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ddd4c0] p-12 text-center shadow-sm">
          <Icon size={36} className="mx-auto text-[#ddd4c0] mb-3" />
          <p className="text-[#4a3f30] text-sm">{emptyText}</p>
          <p className="text-[#4a3f30]/60 text-xs mt-1">
            Open any volume and click the {mode === 'favorites' ? '⭐' : '🔖'} icon on a sicha
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(({ vol, sichosList }) => (
            <div key={vol.id} className="bg-white rounded-2xl border border-[#ddd4c0] shadow-sm overflow-hidden">
              <div className="bg-[#f7f3ed] px-6 py-3 border-b border-[#ddd4c0]">
                <span className="text-xs font-semibold text-[#0B1F3A] font-serif" dir="rtl">
                  חלק {HEB_NUMS[vol.id] ?? vol.id}
                </span>
                <span className="text-xs text-[#4a3f30]/60 ml-2">
                  {sichosList.length} sicha{sichosList.length !== 1 ? 's' : ''}
                </span>
              </div>
              {sichosList.map(({ sicha }) => {
                const isLearned  = !!learned[sicha.id];
                const isFav      = !!favorites[sicha.id];
                const isBook     = !!bookmarks[sicha.id];
                const dach       = getDachUrl(sicha.pageRef ?? '', vol.id);

                return (
                  <div
                    key={sicha.id}
                    dir="rtl"
                    className={`flex items-center gap-2 px-4 py-3 border-b border-[#f0ebe3] last:border-b-0 transition-colors ${isLearned ? 'bg-[#0B1F3A]/5' : 'hover:bg-[#f7f3ed]'}`}
                  >
                    {/* Learned toggle */}
                    <button
                      onClick={() => onToggleLearned(sicha.id)}
                      className="flex-shrink-0"
                      title={isLearned ? 'Mark unlearned' : 'Mark learned'}
                    >
                      {isLearned
                        ? <span className="text-[#0B1F3A] text-sm">✓</span>
                        : <span className="text-[#ddd4c0] text-sm">○</span>}
                    </button>

                    {/* Title + ref */}
                    <div className="flex-1 min-w-0" dir="rtl">
                      <div className={`text-sm font-semibold font-serif truncate ${isLearned ? 'text-[#0B1F3A]' : 'text-[#1c1610]'}`}>
                        {sicha.title}
                      </div>
                      {sicha.pageRef && (
                        <div className="text-xs text-[#4a3f30]/60 mt-0.5">{sicha.pageRef}</div>
                      )}
                    </div>

                    {/* pp */}
                    <div className="flex-shrink-0" dir="ltr">
                      <span className="text-xs text-[#4a3f30]">{sicha.pageCount}</span>
                      <span className="text-[10px] text-[#4a3f30]/60 ml-0.5">pp</span>
                    </div>

                    {/* Star */}
                    <button
                      onClick={() => toggleFavorite(sicha.id)}
                      title={isFav ? 'Remove favorite' : 'Add favorite'}
                      className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[#fff8e1]"
                    >
                      <Star size={14} className={isFav ? 'text-amber-400' : 'text-[#ddd4c0]'} fill={isFav ? '#fbbf24' : 'none'} />
                    </button>

                    {/* Bookmark */}
                    <button
                      onClick={() => toggleBookmark(sicha.id)}
                      title={isBook ? 'Remove bookmark' : 'Add bookmark'}
                      className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[#e8f4ff]"
                    >
                      <Bookmark size={14} className={isBook ? 'text-blue-400' : 'text-[#ddd4c0]'} fill={isBook ? '#60a5fa' : 'none'} />
                    </button>

                    {/* dach.dev */}
                    <button
                      onClick={() => openInNewTab(dach)}
                      title="Read on dach.dev"
                      className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[#4a3f30]/40 hover:text-[#0B1F3A] hover:bg-[#eee8de] transition-colors"
                    >
                      <BookOpen size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
