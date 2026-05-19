import { useState, useEffect } from 'react';
import Header, { type AppView } from './components/Header';
import TopStats from './components/TopStats';
import Bookshelf from './components/Bookshelf';
import Footer from './components/Footer';
import WelcomeScreen from './components/WelcomeScreen';
import ImportPrompt from './components/ImportPrompt';
import AdminStats from './components/AdminStats';
import ShareView from './components/ShareView';
import StarsPanel from './components/StarsPanel';
import { useLearnedState, hasLocalProgress, importLocalProgressToSupabase } from './hooks/useLearnedState';
import { useAuth } from './hooks/useAuth';
import { useSichaStars } from './hooks/useSichaStars';
import { SAMPLE_VOLUMES } from './data/sampleData';
import { Loader2 } from 'lucide-react';

function getShareUserId(): string | null {
  return new URLSearchParams(window.location.search).get('share');
}

function App() {
  const shareUserId = getShareUserId();
  if (shareUserId) return <ShareView userId={shareUserId} />;
  return <MainApp />;
}

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [learned, toggle, progressLoading] = useLearnedState(user);
  const { favorites, bookmarks, toggleFavorite, toggleBookmark } = useSichaStars(user);
  const [showImport, setShowImport]   = useState(false);
  const [importing, setImporting]     = useState(false);
  const [importChecked, setImportChecked] = useState(false);
  const [view, setView] = useState<AppView>('shelf');

  useEffect(() => {
    if (user && !importChecked) {
      if (hasLocalProgress()) setShowImport(true);
      setImportChecked(true);
    }
    if (!user) { setImportChecked(false); setShowImport(false); }
  }, [user, importChecked]);

  async function handleImport() {
    if (!user) return;
    setImporting(true);
    await importLocalProgressToSupabase(user);
    setShowImport(false);
    setImporting(false);
    window.location.reload();
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f4]">
        <Loader2 size={28} className="animate-spin text-[#0B1F3A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f4]">
      <Header user={user} view={view} onViewChange={setView} />
      <main className="flex-1">
        {user ? (
          <>
            {showImport && (
              <ImportPrompt onImport={handleImport} onDismiss={() => setShowImport(false)} loading={importing} />
            )}
            <AdminStats userEmail={user.email ?? undefined} />

            {progressLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-[#0B1F3A]" />
              </div>
            ) : (
              <>
                {/* Always show stats bar */}
                {view === 'shelf' && <TopStats volumes={SAMPLE_VOLUMES} learned={learned} />}

                {/* Main content area switches by view */}
                {view === 'shelf' && (
                  <Bookshelf
                    volumes={SAMPLE_VOLUMES}
                    learned={learned}
                    favorites={favorites}
                    bookmarks={bookmarks}
                    onToggle={toggle}
                    onToggleFavorite={toggleFavorite}
                    onToggleBookmark={toggleBookmark}
                  />
                )}
                {(view === 'favorites' || view === 'bookmarks') && (
                  <StarsPanel
                    mode={view}
                    volumes={SAMPLE_VOLUMES}
                    learned={learned}
                    favorites={favorites}
                    bookmarks={bookmarks}
                    toggleFavorite={toggleFavorite}
                    toggleBookmark={toggleBookmark}
                    onToggleLearned={toggle}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <WelcomeScreen />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
