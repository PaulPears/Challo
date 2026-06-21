const { withAndroidManifest } = require('@expo/config-plugins');

const withMainActivityAttributes = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const mainActivity = androidManifest.manifest.application[0].activity.find(
            (activity) => activity['$']['android:name'] === '.MainActivity'
        );
        if (mainActivity) {
            mainActivity['$']['android:showWhenLocked'] = 'true';
            mainActivity['$']['android:turnScreenOn'] = 'true';
        }
        return config;
    });
};

module.exports = withMainActivityAttributes({
    expo: {
        name: "RideAndhraDriverApp",
        slug: "RideAndhraDriverApp",
        scheme: "rideandhra",
        version: "1.0.4",
        orientation: "portrait",
        icon: "./assets/adaptive-icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        extra: {
            widgetId: process.env.EXPO_PUBLIC_WIDGET_ID || "356b7a674c4f303137353939",
            tokenAuth: process.env.EXPO_PUBLIC_TOKEN_AUTH || "479641TYKLykX9U6926afd1P1",
            apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3000",
            eas: {
                projectId: "dbf4ec01-e2ad-45ae-b1a0-36769a9397b0",
                appVersionSource: "remote"
            }
        },
        plugins: [
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission: "This app uses your location in the background to track your trip and notify you of nearby ride requests.",
                    isIosBackgroundLocationEnabled: true,
                    isAndroidBackgroundLocationEnabled: true
                }
            ],
            [
                "expo-image-picker",
                {
                    photosPermission: "This app needs access to your photo library to let you select a profile picture or upload documents.",
                    cameraPermission: "This app needs access to your camera to let you upload a profile picture and documents for verification."
                }
            ],
            [
                "expo-notifications",
                {
                    icon: "./assets/adaptive-icon.png",
                    color: "#FF7009",
                    sounds: ["./assets/sounds/ride_alert.mp3"],
                    mode: "production"
                }
            ]
        ],
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.rideandhra.driverapp",
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "This app uses your location to show your position on the map and calculate ride routes.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "This app uses your location in the background to track your trip and notify you of nearby ride requests.",
                NSCameraUsageDescription: "This app needs access to your camera to let you upload a profile picture and documents for verification.",
                NSPhotoLibraryUsageDescription: "This app needs access to your photo library to let you select a profile picture or upload documents.",
                UIBackgroundModes: [
                    "location"
                ]
            }
        },
        android: {
            userInterfaceStyle: "light",
            edgeToEdgeEnabled: true,
            googleServicesFile: "./android/app/google-services.json",
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            config: {
                googleMaps: {
                    apiKey: "AIzaSyAcJpazQWf4j468g9DnxMsJZzjW0Yp0iSM"
                }
            },
            package: "com.rideandhra.driverapp",
            versionCode: 5,
            permissions: [
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.ACCESS_BACKGROUND_LOCATION",
                "android.permission.CAMERA",
                "android.permission.READ_EXTERNAL_STORAGE",
                "android.permission.WRITE_EXTERNAL_STORAGE",
                "android.permission.FOREGROUND_SERVICE",
                "android.permission.FOREGROUND_SERVICE_LOCATION",
                "android.permission.RECORD_AUDIO",
                "android.permission.POST_NOTIFICATIONS",
                "android.permission.RECEIVE_BOOT_COMPLETED",
                "android.permission.VIBRATE",
                "android.permission.USE_FULL_SCREEN_INTENT"
            ]
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        updates: {
            fallbackToCacheTimeout: 0
        },
        runtimeVersion: "1.0.0",
        owner: "praweenx356"
    }
});
