import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useWeb3 } from './contexts/Web3Context';
import VlarkerView from './components/VlarkerView';
import VlarkerDashboard from './components/VlarkerDashboard';

function App() {
  const { account, connect, isConnecting, error } = useWeb3();
  const [view, setView] = useState<'ar' | 'dashboard'>('ar');

  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 5000 });
    }
  }, [error]);

  useEffect(() => {
    if (account) {
      setView('dashboard');
    } else {
      setView('ar');
    }
  }, [account]);

  useEffect(() => {
    if (view === 'ar') {
      document.body.classList.add('ar-mode');
    } else {
      document.body.classList.remove('ar-mode');
    }

    return () => {
      document.body.classList.remove('ar-mode');
    };
  }, [view]);

  return (
    <div className="app-container" style={{ pointerEvents: view === 'ar' ? 'none' : 'auto' }}>
      <nav className="navbar" style={{ position: 'relative', zIndex: 100, pointerEvents: 'auto' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <h1 style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, fontSize: '1.25rem' }}>Vlarker</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>v1.0.2</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {account && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem', gap: '0.25rem' }}>
                <button
                  style={{ background: view === 'ar' ? 'var(--color-primary)' : 'transparent', color: '#fff', border: 'none', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onClick={() => setView('ar')}
                >
                  AR Camera
                </button>
                <button
                  style={{ background: view === 'dashboard' ? 'var(--color-primary)' : 'transparent', color: '#fff', border: 'none', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onClick={() => setView('dashboard')}
                >
                  My Plots
                </button>
              </div>
            )}

            {!account ? (
              <button className="btn-primary" onClick={connect} disabled={isConnecting} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                {isConnecting ? "..." : "Connect"}
              </button>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.5rem', borderRadius: '8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                {account.substring(0, 4)}...{account.substring(account.length - 4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ minHeight: 'calc(100vh - 80px)', pointerEvents: view === 'ar' ? 'none' : 'auto' }}>
        {view === 'ar' ? <VlarkerView /> : <VlarkerDashboard />}
      </main>

      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: 'rgba(15, 23, 42, 0.9)',
          color: '#fff',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }
      }} />
    </div>
  );
}

export default App;
