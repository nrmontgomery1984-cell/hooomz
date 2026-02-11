import type { Customer } from '@hooomz/shared';
import { EVENT_VISIBILITY_DEFAULTS } from '@hooomz/shared';
import type { CustomerRepository } from '../repositories';

// Portal welcome message for homeowners
const PORTAL_WELCOME_MESSAGE = `
Welcome to your project portal! Here you can:
• View real-time project progress and photos
• See scheduled inspections and their results
• Make material selections when prompted
• Review and approve change orders
• Access all documents shared with you
• Track project timeline and milestones

All information shared here becomes part of your permanent home profile.
`;

interface ActivityService {
  log(event: Record<string, unknown>): Promise<void>;
}

interface AuthService {
  createUser(email: string, password?: string): Promise<{ id: string }>;
  sendInvite(email: string, options?: {
    welcomeMessage?: string;
    projectName?: string;
    organizationName?: string;
  }): Promise<void>;
  deleteUser(userId: string): Promise<void>;
}

export class PortalService {
  constructor(
    private customerRepo: CustomerRepository,
    private authService?: AuthService,
    private activityService?: ActivityService
  ) {}

  async inviteToPortal(
    customerId: string,
    actorId: string,
    organizationId: string,
    projectId?: string,
    propertyId?: string
  ): Promise<Customer> {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (!customer.email) {
      throw new Error('Customer must have an email address to access portal');
    }

    if (customer.portal_access) {
      throw new Error('Customer already has portal access');
    }

    // Create auth user and send invite with welcome message
    let portalUserId: string | undefined;
    if (this.authService) {
      const user = await this.authService.createUser(customer.email);
      portalUserId = user.id;
      await this.authService.sendInvite(customer.email, {
        welcomeMessage: PORTAL_WELCOME_MESSAGE,
      });
    }

    // Update customer with portal access
    const updated = await this.customerRepo.updatePortalAccess(customerId, true, portalUserId);

    // Log activity event
    if (this.activityService && projectId && propertyId) {
      await this.activityService.log({
        organization_id: organizationId,
        project_id: projectId,
        property_id: propertyId,
        event_type: 'portal.invite_sent',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'customer',
        entity_id: customerId,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['portal.invite_sent'],
        event_data: { email: customer.email },
      });
    }

    return updated;
  }

  async revokePortalAccess(customerId: string): Promise<Customer> {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Delete auth user if exists
    if (customer.portal_user_id && this.authService) {
      await this.authService.deleteUser(customer.portal_user_id);
    }

    return this.customerRepo.updatePortalAccess(customerId, false, undefined);
  }

  async checkPortalAccess(customerId: string): Promise<boolean> {
    const customer = await this.customerRepo.findById(customerId);
    return customer?.portal_access ?? false;
  }

  async getPortalCustomers(organizationId: string): Promise<Customer[]> {
    return this.customerRepo.findMany({
      organization_id: organizationId,
      has_portal_access: true,
    });
  }

  // Log when customer accesses portal
  async logPortalAccess(
    customerId: string,
    organizationId: string,
    projectId: string,
    propertyId: string
  ): Promise<void> {
    if (this.activityService) {
      await this.activityService.log({
        organization_id: organizationId,
        project_id: projectId,
        property_id: propertyId,
        event_type: 'portal.accessed',
        actor_id: customerId,
        actor_type: 'customer',
        entity_type: 'customer',
        entity_id: customerId,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['portal.accessed'],
        event_data: { timestamp: new Date().toISOString() },
      });
    }
  }
}
