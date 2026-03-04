import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWeb3 } from './contexts/Web3Context';
import VlarkerView from './components/VlarkerView';
import VlarkerDashboard from './components/VlarkerDashboard';

function App() {
  const { account, connect, isConnecting } = useWeb3();
  const [view, setView] = useState<'ar' | 'dashboard'>('ar');

  useEffect(() => {
    if (account) {
      setView('dashboard');
    } else {
      setView('ar');
    }
  }, [account]);

  return (
    <div className="app-container">
      <nav className="navbar" style={{ position: 'relative', zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Vlarker</h1>
            <span style={{ color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Location AR</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {account && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem', gap: '0.25rem' }}>
                <button
                  style={{ background: view === 'ar' ? 'var(--color-primary)' : 'transparent', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setView('ar')}
                >
                  AR Viewer
                </button>
                <button
                  style={{ background: view === 'dashboard' ? 'var(--color-primary)' : 'transparent', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setView('dashboard')}
                >
                  My Plots
                </button>
              </div>
            )}

            {!account ? (
              <button className="btn-primary" onClick={connect} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ minHeight: 'calc(100vh - 80px)' }}>
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
