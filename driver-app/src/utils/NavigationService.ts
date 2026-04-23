import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  } else {
    // If navigation is not ready, we can queue it or just log
    console.warn('[NavigationService] Navigator not ready');
  }
}
