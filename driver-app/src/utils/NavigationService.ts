import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let navQueue: Array<{ name: string; params?: any }> = [];

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(name, params);
  } else {
    console.warn(`[NavigationService] Navigator not ready. Queuing navigation to ${name}`, params);
    navQueue.push({ name, params });
  }
}

export function runQueuedNavigations() {
  if (navigationRef.isReady() && navQueue.length > 0) {
    console.log(`[NavigationService] Navigator is ready. Flushing ${navQueue.length} queued navigation(s).`);
    const tempQueue = [...navQueue];
    navQueue = []; // Clear the queue first to prevent recursive loops if navigate triggers other ready checks
    tempQueue.forEach(item => {
      (navigationRef as any).navigate(item.name, item.params);
    });
  }
}
