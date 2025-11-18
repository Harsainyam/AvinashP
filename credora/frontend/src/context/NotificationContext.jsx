import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import socketService from '../services/socket';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to WebSocket
      socketService.connect(user.id);

      // Listen for transaction notifications
      socketService.on('transaction', (data) => {
        const notification = {
          id: Date.now(),
          type: 'transaction',
          message: `Transaction ${data.status}: $${data.amount}`,
          timestamp: new Date(),
          read: false,
          data
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast.success(`Transaction completed: $${data.amount}`, {
          position: 'top-right',
          autoClose: 5000
        });
      });

      // Listen for account updates
      socketService.on('accountUpdate', (data) => {
        const notification = {
          id: Date.now(),
          type: 'account',
          message: 'Account updated',
          timestamp: new Date(),
          read: false,
          data
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        toast.info('Account updated', {
          position: 'top-right',
          autoClose: 3000
        });
      });

      // Listen for system notifications
      socketService.on('systemNotification', (data) => {
        toast.warning(data.message, {
          position: 'top-right',
          autoClose: 5000
        });
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};