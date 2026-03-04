import { useState, useEffect } from 'react';
import type { VlownPlot } from '../hooks/useUserVlowns';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useWeb3 } from '../contexts/Web3Context';
import toast from 'react-hot-toast';

const PlotCard = ({ plot }: { plot: VlownPlot }) => {
    const { provider, account } = useWeb3();
    const [blurb, setBlurb] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [editingBlurb, setEditingBlurb] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "plots", plot.tokenId), (docSnap) => {
            if (docSnap.exists()) {
                setBlurb(docSnap.data().message || "");
            } else {
                setBlurb("");
            }
        });
        return () => unsub();
    }, [plot.tokenId]);

    const handleSave = async () => {
        if (!account || !provider) return;
        setIsSaving(true);
        try {
            const signer = await provider.getSigner();
            const messageToSign = `Vlarker Edit: I verify I own Token ${plot.tokenId} and wish to set its message to: "${editingBlurb}"`;
            await signer.signMessage(messageToSign);

            await setDoc(doc(db, "plots", plot.tokenId), {
                message: editingBlurb,
                ownerAddress: account,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            toast.success("Message updated successfully!");
            setIsEditing(false);
        } catch (err: any) {
            console.error("Save failed", err);
            toast.error("Failed to sign or save message.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <h4 style={{ color: 'var(--color-primary)', margin: 0 }}>Plot #{plot.tokenId.substring(0, 6)}...</h4>
                <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
                    Lat: {plot.lat.toFixed(4)} | Lng: {plot.lng.toFixed(4)}
                </p>
            </div>

            <div style={{ flex: 1 }}>
                {!isEditing ? (
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Current active blurb:</p>
                        {blurb ? (
                            <div style={{ fontStyle: 'italic', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                                "{blurb}"
                            </div>
                        ) : (
                            <p style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>No message set.</p>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea
                            className="glass-input"
                            style={{ width: '100%', minHeight: '80px', resize: 'vertical', fontSize: '0.875rem', padding: '0.5rem' }}
                            value={editingBlurb}
                            onChange={(e) => setEditingBlurb(e.target.value)}
                            placeholder="Type a message for AR travelers..."
                        />
                    </div>
                )}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ flex: 1, padding: '0.5rem' }}>
                            {isSaving ? "Signing..." : "Save"}
                        </button>
                        <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={isSaving} style={{ padding: '0.5rem 1rem' }}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button className="btn-secondary" onClick={() => { setEditingBlurb(blurb); setIsEditing(true); }} style={{ width: '100%', padding: '0.5rem' }}>
                        Update Blurb
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlotCard;
