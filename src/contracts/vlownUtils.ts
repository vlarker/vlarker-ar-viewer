export function getPlotBounds(lat: number, lng: number) {
    // Robust integer rounding to precisely align with the .0005 grid center.
    const cLat = (Math.floor(Math.round(lat * 10000) / 10) * 10 + 5) / 10000;
    const cLng = (Math.floor(Math.round(lng * 10000) / 10) * 10 + 5) / 10000;
    return { cLat, cLng };
}

export function getScaledCoords(cLat: number, cLng: number) {
    const scaledLat = Math.round(cLat * 10000);
    const scaledLng = Math.round(cLng * 10000);
    return { scaledLat, scaledLng };
}
