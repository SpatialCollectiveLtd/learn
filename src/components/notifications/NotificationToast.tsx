'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface Notification {
  notification_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_hidden: boolean;
  auto_expire_at: string | null;
  created_at: string;
}

interface NotificationToastProps {
  youthId: string;
}

export default function NotificationToast({ youthId }: NotificationToastProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visible, setVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchNotifications();
    
    
    const interval = setInterval(fetchNotifications, 3600000);
    return () => clearInterval(interval);
  }, [youthId]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('youthToken');
      if (!token) return;

      const response = await fetch('/api/youth/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        
        
        const newVisible: { [key: string]: boolean } = {};
        data.data.forEach((notif: Notification) => {
          if (!notif.is_hidden) {
            newVisible[notif.notification_id] = true;
          }
        });
        setVisible(newVisible);
      }
    } catch (error) {
      
    }
  };

  const hideNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('youthToken');
      if (!token) return;

      
      setVisible(prev => ({ ...prev, [notificationId]: false }));

      
      setTimeout(async () => {
        await fetch(`/api/youth/notifications/${notificationId}/hide`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        
        setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      }, 300);
    } catch (error) {
      
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error" />;
      default:
        return <Info className="w-5 h-5 text-info" />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-warning/10 border-warning/30';
      case 'success':
        return 'bg-success/10 border-success/30';
      case 'error':
        return 'bg-error/10 border-error/30';
      default:
        return 'bg-info/10 border-info/30';
    }
  };

  const getTimeRemaining = (expireAt: string | null) => {
    if (!expireAt) return null;
    
    const now = new Date();
    const expire = new Date(expireAt);
    const diff = expire.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Expires in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Expires in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Expires soon';
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      {notifications
        .filter(notif => !notif.is_hidden)
        .map((notification, index) => (
          <div
            key={notification.notification_id}
            className={`
              transform transition-all duration-300 ease-out
              ${visible[notification.notification_id] 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-4 opacity-0'
              }
            `}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className={`
              ${getColorClasses(notification.type)}
              border rounded-xl p-4 shadow-lg backdrop-blur-sm
              relative overflow-hidden
            `}>
              {}
              <div className="absolute inset-0 border-2 border-white/20 rounded-xl animate-pulse" />
              
              <div className="flex gap-3 relative z-10">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-heading font-semibold text-white text-sm">
                      {notification.title}
                    </h4>
                    <button
                      onClick={() => hideNotification(notification.notification_id)}
                      className="flex-shrink-0 text-foreground-subtle hover:text-white transition-colors"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-foreground-subtle leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {notification.auto_expire_at && (
                    <p className="text-xs text-foreground-subtle/70 mt-2">
                      {getTimeRemaining(notification.auto_expire_at)}
                    </p>
                  )}
                </div>
              </div>

              {}
              {notification.auto_expire_at && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                  <div 
                    className="h-full bg-white/30 transition-all duration-1000"
                    style={{
                      width: `${Math.max(0, Math.min(100, 
                        ((new Date(notification.auto_expire_at).getTime() - Date.now()) / 
                        (3 * 24 * 60 * 60 * 1000)) * 100
                      ))}%`
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
