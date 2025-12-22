import React, { useContext } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import '../../styles/components/Notification.css';

const Notification = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="notification-wrapper">
      <button className="notification-button" onClick={() => setIsOpen(!isOpen)}>
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="btn-link">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearNotifications} className="btn-link">
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="notification-icon-type">
                    {notif.type === 'transaction' ? '💸' : '📢'}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">
                      {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  {!notif.read && <div className="notification-unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;