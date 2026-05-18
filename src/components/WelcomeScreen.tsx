import { BookOpen } from 'lucide-react';
import AuthForm from './AuthForm';

export default function WelcomeScreen() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left — info */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#0B1F3A]/10 text-[#0B1F3A] text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-[#0B1F3A]/15">
            <BookOpen size={12} />
            Track your Torah learning
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1c1610] leading-tight mb-4">
            Your Likkutei Sichos<br />
            <span className="text-[#0B1F3A]">learning journey</span>
          </h1>
          <p className="text-[#4a3f30] text-base sm:text-lg leading-relaxed max-w-md">
            Track every sicha across all 39 volumes. See your progress grow with page-weighted stats, streaks, and more.
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm text-[#4a3f30]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0B1F3A]" />
              39 volumes
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0B1F3A]" />
              Page-weighted tracking
            </div>
          </div>
        </div>

        {/* Right — auth form */}
        <div className="bg-white rounded-2xl border border-[#ddd4c0] p-6 sm:p-8 shadow-sm">
          <AuthForm />
        </div>
      </div>
    </section>
  );
}
