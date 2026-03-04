import { useUserVlowns } from '../hooks/useUserVlowns';
import PlotCard from './PlotCard';

const VlarkerDashboard = () => {
    const { vlowns, isLoading } = useUserVlowns(0);

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Vlarker Plots</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage the AR text messages for all of your owned VLOwn digital real estate.</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-primary)' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid', borderColor: 'var(--color-primary) transparent transparent transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                        <p>Scanning Polygon Ownership...</p>
                        <style>{`@keyframes spin { 100 % { transform: rotate(360deg); } } `}</style>
                    </div>
                ) : vlowns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <p style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>You do not own any VLOwn property yet.</p>
                        <p>Please use the main VLOwn platform to claim digital real estate before using this companion app.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {vlowns.map(plot => (
                            <PlotCard key={plot.tokenId} plot={plot} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VlarkerDashboard;
