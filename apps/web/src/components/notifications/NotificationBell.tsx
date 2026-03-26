'use client';

/**
 * NotificationBell — Bell icon with unread badge for the sidebar.
 * Click to open/close the NotificationPanel dropdown.
 * Uses a portal so the panel isn't clipped by sidebar overflow.
 */

import { useState, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/lib/hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

interface NotificationBellProps {
  collapsed: boolean;
}

export function NotificationBell({ collapsed }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getAnchorRect = useCallback(() => {
    if (!buttonRef.current) return null;
    return buttonRef.current.getBoundingClientRect();
  }, []);

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        title={collapsed ? `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}` : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: collapsed ? '8px 0' : '8px 4px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted)',
          borderRadius: 'var(--radius)',
          transition: 'background 0.15s',
          minHeight: 36,
        }}
        className="hover-surface"
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Bell size={16} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -5,
              right: -6,
              background: 'var(--red)',
              color: 'white',
              fontSize: 9,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500 }}>
            Notifications
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          onClose={() => setOpen(false)}
          getAnchorRect={getAnchorRect}
        />
      )}
    </div>
  );
}
