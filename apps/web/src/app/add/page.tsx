import { redirect } from 'next/navigation';

/**
 * /add redirects to /activity
 *
 * The Quick Add functionality is now a FAB + bottom sheet on the Activity page.
 * This provides a better UX for field workers:
 * - FAB is always visible on the activity feed
 * - Bottom sheet slides up with 19 quick-add actions
 * - Forms are inline in the sheet, no page navigation needed
 */
export default function AddPage() {
  redirect('/activity');
}
