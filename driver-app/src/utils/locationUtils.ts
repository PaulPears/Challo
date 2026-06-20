/**
 * Andhra Pradesh Geographical Boundaries (Bounding Box)
 * Rough approximation for service restriction.
 */
export const AP_BOUNDARIES = {
    minLat: 12.62,
    maxLat: 19.15,
    minLng: 76.76,
    maxLng: 84.77,
};

/**
 * Checks if a given coordinate is within the Andhra Pradesh bounding box.
 * 
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns boolean - True if user is within AP
 */
export const isLocationInAndhraPradesh = (latitude: number, longitude: number): boolean => {
    // Simple check against bounding box
    const inBox = (
        latitude >= AP_BOUNDARIES.minLat &&
        latitude <= AP_BOUNDARIES.maxLat &&
        longitude >= AP_BOUNDARIES.minLng &&
        longitude <= AP_BOUNDARIES.maxLng
    );

    return inBox;
};

/**
 * Calculates the straight-line distance between two points on the Earth using the Haversine formula.
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
