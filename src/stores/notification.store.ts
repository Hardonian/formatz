import { create } from 'zustand';
import toast from 'react-hot-toast';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(7);
    const fullNotification = { ...notification, id };

    set((state) => ({
      notifications: [...state.notifications, fullNotification],
    }));

    // Use react-hot-toast for display
    const message = notification.message
      ? `${notification.title}: ${notification.message}`
      : notification.title;

    if (notification.type === 'error') {
      toast.error(message, { duration: notification.duration || 4000, id });
    } else if (notification.type === 'success') {
      toast.success(message, { duration: notification.duration || 4000, id });
    } else {
      toast(message, { duration: notification.duration || 4000, id });
    }

    // Auto-remove after duration
    setTimeout(() => {
      get().removeNotification(id);
    }, notification.duration || 4000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
    toast.dismiss(id);
  },

  showSuccess: (title, message) => {
    get().addNotification({ type: 'success', title, message });
  },

  showError: (title, message) => {
    get().addNotification({ type: 'error', title, message, duration: 6000 });
  },

  showInfo: (title, message) => {
    get().addNotification({ type: 'info', title, message });
  },

  showWarning: (title, message) => {
    get().addNotification({ type: 'warning', title, message, duration: 5000 });
  },
}));
