/**
 * Catalogue layout — scopes the Hooomz Interiors design tokens to /catalogue.
 *
 * Applies .catalogue-theme via a display:contents wrapper so the child page's
 * own height:100vh / flex layout is not disturbed.
 */

export default function CatalogueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="catalogue-theme" style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
