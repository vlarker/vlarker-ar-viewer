// @ts-nocheck
import { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getPlotBounds, getScaledCoords } from '../contracts/vlownUtils';
import { useWeb3 } from '../contexts/Web3Context';
import { VlownABI, VlownAddress } from '../contracts/VlownData';
import { ethers } from 'ethers';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import React from 'react';

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

    // Testing State
    const [testBlurb, setTestBlurb] = useState<string>("");
    const [activeTestBlurb, setActiveTestBlurb] = useState<string>("");

    // UI Layout State
    const [isHudExpanded, setIsHudExpanded] = useState<boolean>(true);

    // Compute plot and fetch Web3 whenever GPS changes
    useEffect(() => {
        if (!geo.lat || !geo.lng) return;

        const checkLocation = async () => {
            try {
                const { cLat, cLng } = getPlotBounds(geo.lat, geo.lng);
                setCLatLng({ cLat, cLng });

                if (!provider) return;

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
        <div style={{ height: 'calc(100vh - 80px)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '1rem', position: 'relative', overflow: 'hidden' }}>

            <div className="glass-panel" style={{ width: '100%', pointerEvents: 'auto', maxWidth: '600px', padding: '1.5rem', textAlign: 'center', zIndex: 10, maxHeight: isHudExpanded ? '50vh' : 'auto', overflowY: isHudExpanded ? 'auto' : 'visible', marginBottom: '1rem', transition: 'max-height 0.3s ease-out' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isHudExpanded ? '0.5rem' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: isHudExpanded ? '1.5rem' : '1.125rem', margin: 0, transition: 'all 0.3s ease' }}>Plot Data</h2>
                        {!isHudExpanded && (
                            <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--color-primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                Lng: {cLatLng?.cLng.toFixed(4)}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsHudExpanded(!isHudExpanded)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                        {isHudExpanded ? 'Collapse HUD' : 'Expand HUD'}
                    </button>
                </div>

                {isHudExpanded && (
                    <>
                        <div style={{ fontSize: '1rem', fontFamily: 'monospace', color: 'var(--color-primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem', borderRadius: '8px', display: 'inline-block', marginBottom: '1rem' }}>
                            Lat: {cLatLng?.cLat.toFixed(4)} | Lng: {cLatLng?.cLng.toFixed(4)}
                        </div>

                        {!plotOwner ? (
                            <div style={{ padding: '1.5rem', border: '1px dashed var(--color-glass-border)', borderRadius: '8px' }}>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>This plot of land is untamed wilderness.</p>
                                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Visit the main VLOwn web app to claim it.</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Property of</p>
                                    <p style={{ fontSize: '0.875rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-block', fontFamily: 'monospace' }}>
                                        {plotOwner}
                                    </p>
                                </div>

                                {blurb ? (
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ fontSize: '1.125rem', fontStyle: 'italic', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            "{blurb}"
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>The owner has not left a message here.</p>
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

                        {/* Local AR Engine Test Mechanism */}
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#eab308' }}>AR Engine Testing</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Force a local AR tower projection at your current coordinate center for testing.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={testBlurb}
                                    onChange={(e) => setTestBlurb(e.target.value)}
                                    placeholder="Enter a test message..."
                                />
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', boxShadow: '0 4px 14px 0 rgba(234, 179, 8, 0.4)' }} onClick={() => setActiveTestBlurb(testBlurb)}>
                                        Project Tower
                                    </button>
                                    {activeTestBlurb && (
                                        <button className="btn-secondary" onClick={() => { setTestBlurb(""); setActiveTestBlurb(""); }}>
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* AR Scene Background */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -10, pointerEvents: 'none' }}>
                <a-scene
                    vr-mode-ui="enabled: false"
                    arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false;"
                    renderer="antialias: true; alpha: true"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                >
                    <a-camera gps-camera rotation-reader></a-camera>
                    {(activeTestBlurb || blurb) && cLatLng ? (
                        <a-entity gps-entity-place={`latitude: ${cLatLng.cLat}; longitude: ${cLatLng.cLng};`}>
                            {/* 200 foot tower ≈ 60 meters */}
                            <a-cylinder color={activeTestBlurb ? "#eab308" : "#c084fc"} height="60" radius="1.5" position="0 30 0" opacity="0.4" transparent="true"></a-cylinder>

                            {/* Billboard Text facing user camera */}
                            <a-text
                                value={activeTestBlurb || blurb}
                                color="#ffffff"
                                align="center"
                                scale="15 15 15"
                                position="0 65 0"
                                look-at="[gps-camera]"
                            ></a-text>
                        </a-entity>
                    ) : null}
                </a-scene>
            </div>
        </div>
    );
};

export default VlarkerView;
