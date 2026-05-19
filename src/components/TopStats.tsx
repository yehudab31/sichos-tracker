import { BookMarked, FileText, BarChart3, BookOpen } from 'lucide-react';
import type { Volume } from '../data/sampleData';
import type { LearnedMap } from '../hooks/useLearnedState';

interface Props {
  volumes: Volume[];
  learned: LearnedMap;
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
  const allSichos     = volumes.flatMap(v => v.sichos);
  const totalSichos   = allSichos.length;
  const totalPages    = allSichos.reduce((s, x) => s + x.pageCount, 0);
  const learnedList   = allSichos.filter(s => learned[s.id]);
  const learnedSichos = learnedList.length;
  const learnedPages  = learnedList.reduce((s, x) => s + x.pageCount, 0);
  const completedVols = volumes.filter(v => v.sichos.length > 0 && v.sichos.every(s => learned[s.id])).length;

  // Progress by sichos count
  const sichosPct = totalSichos === 0 ? 0 : Math.round((learnedSichos / totalSichos) * 100);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
      <h2 className="text-lg font-semibold text-[#1c1610] tracking-tight mb-6">Your Progress</h2>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <StatCard
          icon={<BookMarked size={16} />}
          label="Sichos"
          value={learnedSichos}
          sub={`of ${totalSichos.toLocaleString()}`}
        />
        <StatCard
          icon={<FileText size={16} />}
          label="Pages"
          value={learnedPages.toLocaleString()}
          sub={`of ${totalPages.toLocaleString()}`}
        />
        <StatCard
          icon={<BookOpen size={16} />}
          label="Volumes"
          value={completedVols}
          sub="of 39 complete"
        />
        <StatCard
          icon={<BarChart3 size={16} />}
          label="Overall"
          value={`${sichosPct}%`}
          sub="by sicha count"
          accent
        />
      </div>

      {/* Overall progress bar — sichos count */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[#ddd4c0] overflow-hidden">
          <div
            className="h-2 rounded-full bg-[#0B1F3A] transition-all duration-500"
            style={{ width: `${sichosPct}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-[#0B1F3A] whitespace-nowrap tabular-nums">
          {learnedSichos.toLocaleString()} / {totalSichos.toLocaleString()} sichos · {sichosPct}%
        </span>
      </div>
    </section>
  );
}
