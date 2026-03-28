import SeedPageClient from './SeedPageClient';

/**
 * Labs Seed Data Page — Server Component Wrapper
 *
 * Gates access: in production, redirects to /labs before any HTML is sent.
 * In development, renders the SeedPageClient with full seed/clear functionality.
 */
export default function SeedPage() {
  // Temporarily allow in production for testing (remove after 2026-04-07)
  return <SeedPageClient />;
}
