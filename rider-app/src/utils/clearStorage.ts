import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * TEMPORARY LOGOUT HELPER
 * 
 * This file provides a quick way to clear the old JWT token from AsyncStorage.
 * 
 * INSTRUCTIONS FOR USE:
 * 
 * 1. In your app, open the React Native debugger console
 * 2. On the Android device/emulator, shake the device or press Ctrl+M to open the dev menu
 * 3. Select "Debug JS Remotely" or "Open Debugger"
 * 4. In the browser console that opens, run this command:
 * 
 *    AsyncStorage.clear()
 * 
 * 5. Reload the app (press 'r' in the Metro bundler terminal or double-tap R on the device)
 * 
 * ALTERNATIVE METHOD:
 * 
 * 1. Close the app completely
 * 2. Go to Android Settings > Apps > Your App > Storage > Clear Data
 * 3. Restart the app
 * 
 * After clearing the token, you will be logged out and can log in again to get a fresh JWT
 * with the correct 'roles' array structure.
 */

export const clearAsyncStorage = async () => {
    try {
        await AsyncStorage.clear();
        console.log('✅ AsyncStorage cleared successfully!');
        console.log('Please reload the app to see the login screen.');
    } catch (error) {
        console.error('❌ Failed to clear AsyncStorage:', error);
    }
};

// For quick access in console:
if (typeof window !== 'undefined') {
    (window as any).clearStorage = clearAsyncStorage;
    console.log('💡 You can run window.clearStorage() in the console to clear the token');
}
