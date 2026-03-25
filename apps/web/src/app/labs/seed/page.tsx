import { redirect } from 'next/navigation';
import SeedPageClient from './SeedPageClient';

/**
 * Labs Seed Data Page — Server Component Wrapper
 *
 * Gates access: in production, redirects to /labs before any HTML is sent.
 * In development, renders the SeedPageClient with full seed/clear functionality.
 */
export default function SeedPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/labs');
  }

  return <SeedPageClient />;
}
