import { useState, useEffect } from 'react';

interface Position {
    lat: number;
    lng: number;
    accuracy: number;
    error: string | null;
}

export function useGeolocation() {
    const [position, setPosition] = useState<Position>({ lat: 0, lng: 0, accuracy: 0, error: null });
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            setPosition(p => ({ ...p, error: "Geolocation is not supported by your browser." }));
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    error: null
                });
                setIsTracking(true);
            },
            (err) => {
                setPosition(p => ({ ...p, error: err.message }));
                setIsTracking(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { ...position, isTracking };
}
