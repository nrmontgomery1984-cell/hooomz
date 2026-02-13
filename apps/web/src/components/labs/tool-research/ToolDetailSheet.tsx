'use client';

import { useState } from 'react';
import type { ToolInventoryItem } from '@hooomz/shared-contracts';
import { Modal } from '@/components/ui/Modal';
import {
  useRetireInventoryItem,
  useArchiveInventoryItem,
  useDeleteInventoryItem,
  useMarkAsReceived,
} from '@/lib/hooks/useLabsData';

const TEAL = '#2A9D8F';
const CORAL = '#E76F51';

interface ToolDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: ToolInventoryItem;
  ownedItems: ToolInventoryItem[];
}

type ActionType = 'none' | 'not_owned' | 'archive' | 'delete' | 'received';

export function ToolDetailSheet({ isOpen, onClose, item, ownedItems }: ToolDetailSheetProps) {
  const [action, setAction] = useState<ActionType>('none');
  const [reason, setReason] = useState('');
  const [replacedById, setReplacedById] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedPrice, setReceivedPrice] = useState(item.pricePaid != null ? String(item.pricePaid) : '');

  const retireMutation = useRetireInventoryItem();
  const archiveMutation = useArchiveInventoryItem();
  const deleteMutation = useDeleteInventoryItem();
  const receivedMutation = useMarkAsReceived();

  const isPending = retireMutation.isPending || archiveMutation.isPending || deleteMutation.isPending || receivedMutation.isPending;

  const handleClose = () => {
    setAction('none');
    setReason('');
    setReplacedById('');
    setConfirmDelete(false);
    onClose();
  };

  const handleNotOwned = () => {
    retireMutation.mutate(
      { id: item.id, reason: reason || 'No longer owned', replacedById: replacedById || undefined },
      { onSuccess: handleClose },
    );
  };

  const handleArchive = () => {
    archiveMutation.mutate(
      { id: item.id, reason: reason || undefined },
      { onSuccess: handleClose },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: item.id },
      { onSuccess: handleClose },
    );
  };

  const handleReceived = () => {
    const price = receivedPrice ? Number(receivedPrice) : undefined;
    receivedMutation.mutate(
      { id: item.id, date: receivedDate, price },
      { onSuccess: handleClose },
    );
  };

  const replacementOptions = ownedItems.filter((i) => i.id !== item.id && i.status === 'Owned');

  const isOwned = item.status === 'Owned';
  const isPurchasing = item.status === 'Purchasing';
  const isWishlist = item.status === 'Wishlist';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={item.item} size="sm">
      {/* Tool Info */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div>
            <span style={{ color: '#9CA3AF' }}>Brand</span>
            <div style={{ fontWeight: 600, color: '#111827' }}>{item.brand}</div>
          </div>
          <div>
            <span style={{ color: '#9CA3AF' }}>Platform</span>
            <div style={{ fontWeight: 600, color: '#111827' }}>{item.platform}</div>
          </div>
          <div>
            <span style={{ color: '#9CA3AF' }}>Status</span>
            <div style={{ fontWeight: 600, color: '#111827' }}>{item.status}</div>
          </div>
          <div>
            <span style={{ color: '#9CA3AF' }}>Paid</span>
            <div style={{ fontWeight: 600, color: '#111827' }}>
              {item.pricePaid != null ? `$${item.pricePaid}` : '\u2014'}
            </div>
          </div>
          {item.usageCount != null && item.usageCount > 0 && (
            <>
              <div>
                <span style={{ color: '#9CA3AF' }}>Uses</span>
                <div style={{ fontWeight: 600, color: '#111827' }}>{item.usageCount}</div>
              </div>
              <div>
                <span style={{ color: '#9CA3AF' }}>$/Use</span>
                <div style={{ fontWeight: 600, color: '#111827' }}>
                  {item.pricePaid != null ? `$${(item.pricePaid / item.usageCount).toFixed(2)}` : '\u2014'}
                </div>
              </div>
            </>
          )}
        </div>
        {item.notes && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>{item.notes}</div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #E5E7EB', marginBottom: 16 }} />

      {/* Action Buttons (when no action selected) */}
      {action === 'none' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Mark as Received — for Purchasing/Wishlist items */}
          {(isPurchasing || isWishlist) && (
            <button
              onClick={() => setAction('received')}
              style={{
                padding: '10px 16px',
                border: `1px solid ${TEAL}`,
                borderRadius: 8,
                background: `${TEAL}08`,
                color: '#111827',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: 44,
              }}
            >
              Mark as received
              <span style={{ display: 'block', fontSize: 11, color: TEAL, marginTop: 2 }}>
                Move to Owned status with purchase date and price
              </span>
            </button>
          )}

          {/* No longer owned — for Owned items */}
          {isOwned && (
            <button
              onClick={() => setAction('not_owned')}
              style={{
                padding: '10px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                background: 'white',
                color: '#111827',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: 44,
              }}
            >
              No longer owned
              <span style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                Mark as retired with a reason (sold, lost, broken, etc.)
              </span>
            </button>
          )}

          {/* Archive — for Owned, Purchasing, Wishlist */}
          {(isOwned || isPurchasing || isWishlist) && (
            <button
              onClick={() => setAction('archive')}
              style={{
                padding: '10px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                background: 'white',
                color: '#111827',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: 44,
              }}
            >
              Archive
              <span style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                Hide from main list but keep the record
              </span>
            </button>
          )}

          {/* Delete — always available */}
          <button
            onClick={() => setAction('delete')}
            style={{
              padding: '10px 16px',
              border: `1px solid ${CORAL}33`,
              borderRadius: 8,
              background: `${CORAL}08`,
              color: CORAL,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              minHeight: 44,
            }}
          >
            Delete permanently
            <span style={{ display: 'block', fontSize: 11, color: `${CORAL}99`, marginTop: 2 }}>
              Remove this tool from your inventory completely
            </span>
          </button>
        </div>
      )}

      {/* Mark as Received Form */}
      {action === 'received' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
            Mark as received
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Date received</label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 13,
                minHeight: 40,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Price paid (optional)</label>
            <input
              type="number"
              placeholder="0.00"
              value={receivedPrice}
              onChange={(e) => setReceivedPrice(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 13,
                minHeight: 40,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => setAction('none')}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                background: 'white',
                color: '#6B7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: 40,
              }}
            >
              Back
            </button>
            <button
              onClick={handleReceived}
              disabled={isPending}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                background: TEAL,
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 40,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Not Owned Form */}
      {action === 'not_owned' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
            Why is this no longer owned?
          </div>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              fontSize: 13,
              minHeight: 40,
            }}
          >
            <option value="">Select reason...</option>
            <option value="Sold">Sold</option>
            <option value="Broken">Broken / Damaged</option>
            <option value="Lost">Lost</option>
            <option value="Stolen">Stolen</option>
            <option value="Gifted">Gifted / Gave away</option>
            <option value="Returned">Returned to store</option>
            <option value="Upgraded">Upgraded to better model</option>
            <option value="Other">Other</option>
          </select>
          {reason === 'Upgraded' && replacementOptions.length > 0 && (
            <select
              value={replacedById}
              onChange={(e) => setReplacedById(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 13,
                minHeight: 40,
              }}
            >
              <option value="">Replaced by... (optional)</option>
              {replacementOptions.map((i) => (
                <option key={i.id} value={i.id}>{i.item}</option>
              ))}
            </select>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => { setAction('none'); setReason(''); setReplacedById(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                background: 'white',
                color: '#6B7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: 40,
              }}
            >
              Back
            </button>
            <button
              onClick={handleNotOwned}
              disabled={!reason || isPending}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                background: reason ? TEAL : '#D1D5DB',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: reason ? 'pointer' : 'not-allowed',
                minHeight: 40,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Archive Form */}
      {action === 'archive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
            Archive this tool?
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
            It will be hidden from the main inventory list but the record will be kept.
          </p>
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              fontSize: 13,
              minHeight: 40,
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => { setAction('none'); setReason(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                background: 'white',
                color: '#6B7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: 40,
              }}
            >
              Back
            </button>
            <button
              onClick={handleArchive}
              disabled={isPending}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                background: TEAL,
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 40,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Archiving...' : 'Archive'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {action === 'delete' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: CORAL }}>
            Delete &ldquo;{item.item}&rdquo; permanently?
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
            This cannot be undone. The tool will be removed from your inventory and all usage/maintenance history will be lost.
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#111827' }}>
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            I understand this is permanent
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => { setAction('none'); setConfirmDelete(false); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                background: 'white',
                color: '#6B7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: 40,
              }}
            >
              Back
            </button>
            <button
              onClick={handleDelete}
              disabled={!confirmDelete || isPending}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                background: confirmDelete ? CORAL : '#D1D5DB',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: confirmDelete ? 'pointer' : 'not-allowed',
                minHeight: 40,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Deleting...' : 'Delete Forever'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
