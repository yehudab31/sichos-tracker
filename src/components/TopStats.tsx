import { BookMarked, FileText, BarChart3 } from 'lucide-react';
import type { Volume } from '../data/sampleData';
import type { LearnedMap } from '../hooks/useLearnedState';

interface Props {
  volumes: Volume[];
  learned: LearnedMap;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accent?: boolean;
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-[#ddd4c0] p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200 ${accent ? 'border-[#0B1F3A]/20' : ''}`}>
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
  const allSichos = volumes.flatMap((v) => v.sichos);
  const totalSichos = allSichos.length;
  const totalPages = allSichos.reduce((sum, s) => sum + s.pageCount, 0);

  const learnedSichos = allSichos.filter((s) => learned[s.id]).length;
  const learnedPages = allSichos.filter((s) => learned[s.id]).reduce((sum, s) => sum + s.pageCount, 0);
  const overallPct = totalPages === 0 ? 0 : Math.round((learnedPages / totalPages) * 100);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1c1610] tracking-tight">Your Progress</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<BookMarked size={16} />}
          label="Sichos Learnt"
          value={learnedSichos}
          sub={`out of ${totalSichos} sichos`}
        />
        <StatCard
          icon={<FileText size={16} />}
          label="Pages Learnt"
          value={learnedPages}
          sub={`out of ${totalPages} pages`}
        />
        <StatCard
          icon={<BarChart3 size={16} />}
          label="Overall Progress"
          value={`${overallPct}%`}
          sub="weighted by page count"
          accent
        />
      </div>

      {/* Overall progress bar */}
      {overallPct > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-[#ddd4c0] overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-[#0B1F3A] transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <span className="text-xs text-[#4a3f30] font-medium">{learnedPages} / {totalPages} pp</span>
        </div>
      )}
    </section>
  );
}
