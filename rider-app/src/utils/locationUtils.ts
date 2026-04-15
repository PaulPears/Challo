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
