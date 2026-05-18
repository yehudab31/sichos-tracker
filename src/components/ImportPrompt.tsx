import { Upload, Loader2 } from 'lucide-react';

interface Props {
  onImport: () => void;
  onDismiss: () => void;
  loading: boolean;
}

export default function ImportPrompt({ onImport, onDismiss, loading }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="bg-white border border-[#ddd4c0] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
        <div className="w-10 h-10 bg-[#0B1F3A]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Upload size={18} className="text-[#0B1F3A]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1c1610]">Import your saved progress into this account?</p>
          <p className="text-xs text-[#4a3f30] mt-0.5">
            You have locally-saved progress from before you signed in.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onDismiss}
            disabled={loading}
            className="text-sm font-medium text-[#4a3f30] px-4 py-2 rounded-lg hover:bg-[#f7f3ed] transition-colors disabled:opacity-50"
          >
            Not now
          </button>
          <button
            onClick={onImport}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#0B1F3A] px-4 py-2 rounded-lg hover:bg-[#162d4f] transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
