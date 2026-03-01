'use client';

/**
 * NotificationPanel — Dropdown panel showing recent notifications.
 * Rendered via portal (fixed position) so it isn't clipped by sidebar overflow.
 * Click outside to close.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  MessageCircle,
  Bell,
  FlaskConical,
  CheckCheck,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  formatRelativeTime,
} from '@/lib/hooks/useNotifications';
import type { NotificationType } from '@hooomz/shared-contracts';

// ============================================================================
// Icon + color mapping
// ============================================================================

const NOTIFICATION_STYLE: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  quote_accepted:          { icon: CheckCircle2,  color: '#10B981' },
  quote_declined:          { icon: XCircle,        color: '#EF4444' },
  portal_question:         { icon: MessageCircle,  color: '#3B82F6' },
  labs_submission_update:  { icon: FlaskConical,   color: '#8B5CF6' },
  experiment_checkpoint:   { icon: FlaskConical,   color: '#8B5CF6' },
  experiment_invitation:   { icon: FlaskConical,   color: '#8B5CF6' },
  confidence_alert:        { icon: FlaskConical,   color: '#F59E0B' },
  challenge_update:        { icon: FlaskConical,   color: '#8B5CF6' },
  general:                 { icon: Bell,           color: '#6B7280' },
};

const PANEL_WIDTH = 320;
const PANEL_MAX_HEIGHT = 420;

// ============================================================================
// Component
// ============================================================================

interface NotificationPanelProps {
  onClose: () => void;
  getAnchorRect: () => DOMRect | null;
}

export function NotificationPanel({ onClose, getAnchorRect }: NotificationPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const [pos, setPos] = useState<{ bottom: number; left: number } | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Calculate position from anchor button
  useEffect(() => {
    const rect = getAnchorRect();
    if (!rect) return;
    // Position: to the right of the sidebar, bottom of panel aligned with bottom of bell
    const left = rect.right + 8;
    const bottom = window.innerHeight - rect.bottom;
    setPos({ bottom, left });
  }, [getAnchorRect]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid immediate close from the bell click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
    if (!notification.isRead) {
      await markRead.mutateAsync(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    onClose();
  };

  if (!pos) return null;

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: pos.bottom,
        left: pos.left,
        width: PANEL_WIDTH,
        maxHeight: PANEL_MAX_HEIGHT,
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.04em' }}>
          Notifications
          {unreadCount > 0 && (
            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>
              ({unreadCount} new)
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutateAsync()}
            disabled={markAllRead.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: 'var(--accent, #3B82F6)',
              background: 'none', border: 'none', cursor: 'pointer',
              opacity: markAllRead.isPending ? 0.5 : 1,
            }}
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {notifications.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Bell size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No notifications yet</p>
          </div>
        )}

        {notifications.map((n) => {
          const style = NOTIFICATION_STYLE[n.type] || NOTIFICATION_STYLE.general;
          const Icon = style.icon;

          return (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                background: n.isRead ? 'transparent' : 'var(--bg)',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              className="hover-surface"
            >
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `${style.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
              }}>
                <Icon size={14} style={{ color: style.color }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 12, fontWeight: n.isRead ? 500 : 700,
                    color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {n.title}
                  </span>
                  {!n.isRead && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#3B82F6', flexShrink: 0,
                    }} />
                  )}
                </div>
                <p style={{
                  fontSize: 11, color: 'var(--text-3)', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {n.body}
                </p>
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, display: 'block' }}>
                  {formatRelativeTime(n.timestamp)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
