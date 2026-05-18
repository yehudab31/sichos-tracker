import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1c1610] text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#b8882a] rounded-lg flex items-center justify-center">
              <BookOpen size={15} className="text-white" />
            </div>
            <span className="font-semibold text-white/90 tracking-tight">Sichos Tracker</span>
          </div>

          <div
            className="font-serif text-xl text-[#d4a843] tracking-wide"
            dir="rtl"
            lang="he"
          >
            אנא נפשי כתבית יהבית
          </div>

          <div className="text-xs text-white/40 text-center sm:text-right">
            <p>Likkutei Sichos — 39 volumes</p>
            <p className="mt-0.5">© {new Date().getFullYear()} Sichos Tracker</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
