export function getPlotBounds(lat: number, lng: number) {
    const cLat = Math.floor(lat * 1000) / 1000 + 0.0005;
    const cLng = Math.floor(lng * 1000) / 1000 + 0.0005;
    return { cLat, cLng };
}

export function getScaledCoords(cLat: number, cLng: number) {
    const scaledLat = Math.round(cLat * 10000);
    const scaledLng = Math.round(cLng * 10000);
    return { scaledLat, scaledLng };
}
