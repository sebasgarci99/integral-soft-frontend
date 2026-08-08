export const getGoogleMapsEmbedUrl = (url?: string | null): string | null => {
    if (!url) return null;

    const trimmed = url.trim();

    if (trimmed.includes('/embed')) {
        return trimmed;
    }

    const qMatch = trimmed.match(/[?&]q=([^&]+)/);
    if (qMatch) {
        return `https://maps.google.com/maps?q=${qMatch[1]}&output=embed`;
    }

    const coordsMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
        return `https://maps.google.com/maps?q=${coordsMatch[1]},${coordsMatch[2]}&output=embed`;
    }

    return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
};
