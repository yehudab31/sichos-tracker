import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SAMPLE_VOLUMES } from '../data/sampleData';
import { Users, BookOpen, FileText, Loader2 } from 'lucide-react';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;

// Build a quick sicha_id -> pageCount lookup
const PAGE_MAP: Record<string, number> = {};
for (const vol of SAMPLE_VOLUMES) {
  for (const s of vol.sichos) {
    PAGE_MAP[s.id] = s.pageCount;
  }
}

interface Stats {
  usersWithProgress: number;
  totalLearnedSichos: number;
  totalLearnedPages: number;
}

interface Props {
  userEmail: string | undefined;
}

export default function AdminStats({ userEmail }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ADMIN_EMAIL || userEmail !== ADMIN_EMAIL) return;

    (async () => {
      const { data, error: err } = await supabase
        .from('user_sicha_progress')
        .select('user_id, sicha_id, learned')
        .eq('learned', true);

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const rows = data ?? [];
      const uniqueUsers = new Set(rows.map((r) => r.user_id)).size;
      const totalPages = rows.reduce((sum, r) => sum + (PAGE_MAP[r.sicha_id] ?? 0), 0);

      setStats({
        usersWithProgress: uniqueUsers,
        totalLearnedSichos: rows.length,
        totalLearnedPages: totalPages,
      });
      setLoading(false);
    })();
  }, [userEmail]);

  if (!ADMIN_EMAIL || userEmail !== ADMIN_EMAIL) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
      <div className="bg-[#0B1F3A] rounded-xl p-5 text-white">
        <p className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-4">Admin Stats</p>

        {loading && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<Users size={16} />}
              label="Users with progress"
              value={stats.usersWithProgress}
            />
            <StatCard
              icon={<BookOpen size={16} />}
              label="Learned sichos"
              value={stats.totalLearnedSichos}
            />
            <StatCard
              icon={<FileText size={16} />}
              label="Learned pages"
              value={stats.totalLearnedPages}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-lg px-4 py-3">
      <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold text-white">{value.toLocaleString()}</div>
    </div>
  );
}
