import { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getPlotBounds, getScaledCoords } from '../contracts/vlownUtils';
import { useWeb3 } from '../contexts/Web3Context';
import { VlownABI, VlownAddress } from '../contracts/VlownData';
import { ethers } from 'ethers';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';

const VlarkerView = () => {
    const geo = useGeolocation();
    const { provider, account } = useWeb3();

    const [tokenId, setTokenId] = useState<string | null>(null);
    const [cLatLng, setCLatLng] = useState<{ cLat: number, cLng: number } | null>(null);

    // Web3 State
    const [plotOwner, setPlotOwner] = useState<string | null>(null);
    const [isOwnedByMe, setIsOwnedByMe] = useState(false);

    // Firebase State
    const [blurb, setBlurb] = useState<string>("");
    const [editingBlurb, setEditingBlurb] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Compute plot and fetch Web3 whenever GPS changes
    useEffect(() => {
        if (!geo.lat || !geo.lng || !provider) return;

        const checkLocation = async () => {
            try {
                const { cLat, cLng } = getPlotBounds(geo.lat, geo.lng);
                setCLatLng({ cLat, cLng });

                const { scaledLat, scaledLng } = getScaledCoords(cLat, cLng);
                const contract = new ethers.Contract(VlownAddress, VlownABI, provider);

                // Is Plot claimed?
                const isAvailable = await contract.isClaimAvailable(scaledLat, scaledLng);
                if (isAvailable) {
                    setPlotOwner(null);
                    setIsOwnedByMe(false);
                    setTokenId(null);
                    setBlurb("");
                    return;
                }

                // Get owner
                const id = await contract.getTokenId(scaledLat, scaledLng);
                setTokenId(id.toString());

                const owner = await contract.ownerOf(id);
                setPlotOwner(owner);

                if (account && owner.toLowerCase() === account.toLowerCase()) {
                    setIsOwnedByMe(true);
                } else {
                    setIsOwnedByMe(false);
                }

            } catch (err) {
                console.error("Error reading web3:", err);
            }
        };

        checkLocation();
    }, [geo.lat, geo.lng, provider, account]);

    // Live sync Firebase whenever TokenId changes
    useEffect(() => {
        if (!tokenId) {
            setBlurb("");
            return;
        }

        const unsub = onSnapshot(doc(db, "plots", tokenId), (docSnap) => {
            if (docSnap.exists()) {
                setBlurb(docSnap.data().message || "");
                setEditingBlurb(docSnap.data().message || "");
            } else {
                setBlurb("");
                setEditingBlurb("");
            }
        });

        return () => unsub();
    }, [tokenId]);

    const handleSave = async () => {
        if (!tokenId || !account || !provider) return;
        setIsSaving(true);
        try {
            // Ethers Signature Verification
            const signer = await provider.getSigner();
            const messageToSign = `Vlarker Edit: I verify I own Token ${tokenId} and wish to set its message to: "${editingBlurb}"`;
            await signer.signMessage(messageToSign);

            // In a full production app we would send `signature` to a Firebase Function helper
            // Here, we'll optimistically write to Firestore (with loose test rules)

            await setDoc(doc(db, "plots", tokenId), {
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

    if (!geo.isTracking) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', textAlign: 'center' }}>
                <div style={{ padding: '3rem' }}>
                    <div style={{ width: '50px', height: '50px', border: '3px solid', borderColor: 'var(--color-primary) transparent transparent transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                    <h2>Acquiring GPS Signal...</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Waiting for location tracking.</p>
                </div>
                <style>{`@keyframes spin { 100 % { transform: rotate(360deg); } } `}</style>
            </div>
        );
    }

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>

            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', textAlign: 'center', zIndex: 10 }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>You are standing in</h2>
                <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: 'var(--color-primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '8px', display: 'inline-block', marginBottom: '2rem' }}>
                    Lat: {cLatLng?.cLat.toFixed(4)} | Lng: {cLatLng?.cLng.toFixed(4)}
                </div>

                {!plotOwner ? (
                    <div style={{ padding: '2rem', border: '1px dashed var(--color-glass-border)', borderRadius: '8px' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>This plot of land is untamed wilderness.</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Visit the main VLOwn web app to claim it.</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Property of</p>
                            <p style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-block', fontFamily: 'monospace' }}>
                                {plotOwner}
                            </p>
                        </div>

                        {blurb ? (
                            <div style={{ position: 'relative' }}>
                                <div style={{ fontSize: '1.5rem', fontStyle: 'italic', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    "{blurb}"
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>The owner has not left a message here.</p>
                        )}

                        {isOwnedByMe && (
                            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Owner Controls</h3>
                                {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <textarea
                                            className="glass-input"
                                            style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                                            value={editingBlurb}
                                            onChange={(e) => setEditingBlurb(e.target.value)}
                                            placeholder="Leave a message for travelers..."
                                        />
                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                                                {isSaving ? "Signing..." : "Save to Firebase"}
                                            </button>
                                            <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="btn-primary" onClick={() => setIsEditing(true)}>
                                        Update Blurb
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Radar Background Animation */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '100vw', maxWidth: '800px', maxHeight: '800px', borderRadius: '50%', border: '1px solid rgba(56, 189, 248, 0.1)', zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '60%', borderRadius: '50%', border: '1px solid rgba(56, 189, 248, 0.2)' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20%', height: '20%', borderRadius: '50%', border: '1px solid rgba(56, 189, 248, 0.3)' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, 0)', width: '50%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5))', animation: 'radar 4s linear infinite', transformOrigin: '0% 0%' }}></div>
            </div>

            <style>{`
                @keyframes radar {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default VlarkerView;
