/**
 * Entity Deep Link Resolver
 *
 * Maps entity_type + entity_id from activity events to the correct detail page URL.
 * Used by Sales Dashboard, Activity page, and any component that displays clickable entities.
 */

export function resolveEntityLink(
  entityType: string,
  entityId: string,
  projectId?: string
): string | null {
  if (!entityType || !entityId) return null;

  switch (entityType) {
    case 'project':
      return `/projects/${entityId}`;
    case 'customer':
    case 'customer_v2':
      return `/customers/${entityId}`;
    case 'lead':
      return `/leads?highlight=${entityId}`;
    case 'quote':
      return `/sales/quotes/${entityId}`;
    case 'consultation':
      // No consultation detail page yet — link to discovery flow
      return projectId ? `/discovery/${projectId}` : null;
    case 'task':
      return projectId ? `/projects/${projectId}` : null;
    case 'line_item':
    case 'estimate':
      return projectId ? `/estimates/${projectId}` : null;
    case 'change_order':
      return projectId ? `/projects/${projectId}` : null;
    default:
      // Fallback: if we have a project context, link there
      return projectId ? `/projects/${projectId}` : null;
  }
}
