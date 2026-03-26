/**
 * Comment Input Component
 * Allows clients to submit comments from the client portal
 *
 * Features:
 * - Textarea with character limit (500)
 * - Submit button
 * - Loading and error states
 * - Success feedback
 */

import { useState, useCallback } from 'react';
import { Button } from '../ui';

// ============================================================================
// TYPES
// ============================================================================

export interface CommentInputProps {
  /** Callback when comment is submitted */
  onSubmit: (content: string) => Promise<void>;
  /** Maximum character limit */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CommentInput({
  onSubmit,
  maxLength = 500,
  placeholder = 'Have a question or comment about your project? Let us know...',
  className = '',
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const charactersRemaining = maxLength - content.length;
  const isOverLimit = charactersRemaining < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = useCallback(async () => {
    if (isEmpty || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await onSubmit(content);
      setContent('');
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, isEmpty, isOverLimit, isSubmitting, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className={`${className}`}>
      {/* Input area */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className={`
            w-full px-4 py-3 rounded-lg border resize-none
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors
            ${isOverLimit ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}
          `}
          disabled={isSubmitting}
        />

        {/* Character count */}
        <div className="absolute bottom-3 right-3">
          <span
            className={`text-xs ${
              isOverLimit
                ? 'text-red-500 font-medium'
                : charactersRemaining < 50
                ? 'text-amber-500'
                : 'text-gray-400'
            }`}
          >
            {charactersRemaining}
          </span>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between mt-3">
        {/* Helper text */}
        <span className="text-xs text-gray-500">
          Press Cmd+Enter to submit
        </span>

        {/* Submit button */}
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit || isSubmitting}
          loading={isSubmitting}
        >
          Send Comment
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            Your comment has been sent. We'll get back to you soon!
          </p>
        </div>
      )}
    </div>
  );
}

export default CommentInput;
