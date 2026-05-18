import { useState, useEffect } from 'react';
import Header from './components/Header';
import TopStats from './components/TopStats';
import Bookshelf from './components/Bookshelf';
import Footer from './components/Footer';
import WelcomeScreen from './components/WelcomeScreen';
import ImportPrompt from './components/ImportPrompt';
import AdminStats from './components/AdminStats';
import ShareView from './components/ShareView';
import { useLearnedState, hasLocalProgress, importLocalProgressToSupabase } from './hooks/useLearnedState';
import { useAuth } from './hooks/useAuth';
import { SAMPLE_VOLUMES } from './data/sampleData';
import { Loader2 } from 'lucide-react';

// Detect ?share=USER_ID in the URL
function getShareUserId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('share');
}

function App() {
  const shareUserId = getShareUserId();

  // If this is a share link, render the read-only view immediately
  if (shareUserId) {
    return <ShareView userId={shareUserId} />;
  }

  return <MainApp />;
}

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [learned, toggle, progressLoading] = useLearnedState(user);
  const [showImport, setShowImport]    = useState(false);
  const [importing, setImporting]      = useState(false);
  const [importChecked, setImportChecked] = useState(false);

  useEffect(() => {
    if (user && !importChecked) {
      if (hasLocalProgress()) setShowImport(true);
      setImportChecked(true);
    }
    if (!user) {
      setImportChecked(false);
      setShowImport(false);
    }
  }, [user, importChecked]);

  const handleImport = async () => {
    if (!user) return;
    setImporting(true);
    await importLocalProgressToSupabase(user);
    setShowImport(false);
    setImporting(false);
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f4]">
        <Loader2 size={28} className="animate-spin text-[#0B1F3A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f4]">
      <Header user={user} />
      <main className="flex-1">
        {user ? (
          <>
            {showImport && (
              <ImportPrompt
                onImport={handleImport}
                onDismiss={() => setShowImport(false)}
                loading={importing}
              />
            )}
            <AdminStats userEmail={user.email ?? undefined} />
            {progressLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-[#0B1F3A]" />
              </div>
            ) : (
              <>
                <TopStats volumes={SAMPLE_VOLUMES} learned={learned} />
                <Bookshelf volumes={SAMPLE_VOLUMES} learned={learned} onToggle={toggle} />
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
