import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
// Local Notification type used if the '@/types' module is not available
type NotificationType = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | string;
  title: string;
  message?: string;
  duration?: number;
};

type AddFn = (
  type: NotificationType['type'],
  title: string,
  message?: string,
  durationMs?: number
) => string;

type RemoveFn = (id: string) => void;

interface NotificationsContextValue {
  notifications: NotificationType[];
  addNotification: AddFn;
  removeNotification: RemoveFn;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const removeNotification = useCallback<RemoveFn>((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback<AddFn>((type, title, message, durationMs = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotifications((prev) => [...prev, { id, type, title, message, duration: durationMs }]);
    // Auto-dismiss
    window.setTimeout(() => removeNotification(id), durationMs);
    return id;
  }, [removeNotification]);

  const value = useMemo<NotificationsContextValue>(() => ({ notifications, addNotification, removeNotification }), [notifications, addNotification, removeNotification]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

export const NotificationsToaster: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const colorByType = (type: NotificationType['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-900';
      case 'error': return 'bg-red-50 border-red-200 text-red-900';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default: return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[1000] space-y-2 w-80">
      {notifications.map(n => (
        <div key={n.id} className={`border rounded shadow p-3 ${colorByType(n.type)} animate-slide-in`}> 
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm">{n.title}</div>
              {n.message && <div className="text-xs mt-1 opacity-90">{n.message}</div>}
            </div>
            <button className="text-xs opacity-60 hover:opacity-100" onClick={() => removeNotification(n.id)}>Cerrar</button>
          </div>
        </div>
      ))}
    </div>
  );
};
