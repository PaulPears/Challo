import { create } from 'zustand';

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    icon?: string;
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'read' | 'timestamp'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    fetchNotifications: () => Promise<void>;
}

const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [
        {
            id: 'welcome-1',
            title: 'Welcome to RideAndhra! 🎉',
            message: 'We are excited to have you on board. Enjoy your rides!',
            timestamp: new Date().toISOString(),
            read: false,
            icon: 'bell',
        },
    ],
    addNotification: (notification) =>
        set((state) => ({
            notifications: [
                {
                    ...notification,
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: new Date().toISOString(),
                    read: false,
                },
                ...state.notifications,
            ],
        })),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
        })),
    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
    fetchNotifications: async () => {
        // TODO: Implement backend fetch
        // const response = await notificationAPI.getNotifications();
        // set({ notifications: response.data });
    },
}));

export default useNotificationStore;
