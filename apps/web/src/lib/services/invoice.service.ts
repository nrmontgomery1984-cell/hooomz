/**
 * Invoice Service
 * Wraps InvoiceRepository with business logic: number generation, status transitions,
 * line item snapshots, overdue detection, payment totals. Activity logging (spine rule).
 */

import type {
  InvoiceRecord,
  InvoiceLineItem,
  InvoiceStatus,
  CreateInvoiceInput,
  LineItem,
} from '@hooomz/shared-contracts';
import type { InvoiceRepository } from '../repositories/invoice.repository';
import type { PaymentRepository } from '../repositories/payment.repository';
import type { ActivityService } from '../repositories/activity.repository';

/** Minimal interface so we don't import the full LineItemRepository class */
export interface LineItemFinder {
  findByProjectId(projectId: string): Promise<LineItem[]>;
}

export class InvoiceService {
  constructor(
    private repo: InvoiceRepository,
    private paymentRepo: PaymentRepository,
    private activity: ActivityService,
    private lineItemFinder: LineItemFinder,
  ) {}

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  async create(input: CreateInvoiceInput): Promise<InvoiceRecord> {
    // 1. Generate invoice number: INV-YYYY-NNN
    const invoiceNumber = await this.generateInvoiceNumber();

    // 2. Snapshot line items from project
    const projectLineItems = await this.lineItemFinder.findByProjectId(input.projectId);
    const lineItems: InvoiceLineItem[] = projectLineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unitCost: li.unitCost,
      totalCost: li.totalCost,
      category: li.category,
    }));

    // 3. Calculate totals (subtotalOverride used for deposit invoices)
    const subtotal = input.subtotalOverride ?? lineItems.reduce((sum, li) => sum + li.totalCost, 0);
    const taxRate = input.taxRate ?? 0.15;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const record = await this.repo.create({
      projectId: input.projectId,
      customerId: input.customerId,
      quoteId: input.quoteId,
      invoiceNumber,
      invoiceType: input.invoiceType,
      status: 'draft',
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      dueDate: input.dueDate,
      notes: input.notes,
    });

    this.activity.create({
      event_type: 'invoice_created',
      project_id: input.projectId,
      entity_type: 'invoice',
      entity_id: record.id,
      summary: `Invoice ${invoiceNumber} created (${input.invoiceType}) — $${totalAmount.toFixed(2)}`,
    }).catch((err) => console.error('Failed to log invoice event:', err));

    return record;
  }

  // ---------------------------------------------------------------------------
  // Status transitions
  // ---------------------------------------------------------------------------

  async markSent(id: string): Promise<InvoiceRecord | null> {
    const inv = await this.repo.findById(id);
    if (!inv || inv.status !== 'draft') return null;

    const updated = await this.repo.update(id, {
      status: 'sent' as InvoiceStatus,
      sentAt: new Date().toISOString(),
    });

    if (updated) {
      this.activity.create({
        event_type: 'invoice_sent',
        project_id: updated.projectId,
        entity_type: 'invoice',
        entity_id: id,
        summary: `Invoice ${updated.invoiceNumber} sent`,
      }).catch((err) => console.error('Failed to log invoice event:', err));
    }

    return updated;
  }

  async markViewed(id: string): Promise<InvoiceRecord | null> {
    const inv = await this.repo.findById(id);
    if (!inv || inv.status !== 'sent') return null;

    return this.repo.update(id, {
      status: 'viewed' as InvoiceStatus,
      viewedAt: new Date().toISOString(),
    });
  }

  async cancel(id: string): Promise<InvoiceRecord | null> {
    const inv = await this.repo.findById(id);
    if (!inv || inv.status === 'paid') return null;

    const updated = await this.repo.update(id, {
      status: 'cancelled' as InvoiceStatus,
    });

    if (updated) {
      this.activity.create({
        event_type: 'invoice_cancelled',
        project_id: updated.projectId,
        entity_type: 'invoice',
        entity_id: id,
        summary: `Invoice ${updated.invoiceNumber} cancelled`,
      }).catch((err) => console.error('Failed to log invoice event:', err));
    }

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Payment totals (called by PaymentService after add/delete)
  // ---------------------------------------------------------------------------

  async updatePaymentTotals(invoiceId: string): Promise<InvoiceRecord | null> {
    const inv = await this.repo.findById(invoiceId);
    if (!inv) return null;

    const amountPaid = await this.paymentRepo.sumByInvoiceId(invoiceId);
    const balanceDue = Math.round((inv.totalAmount - amountPaid) * 100) / 100;

    const changes: Partial<InvoiceRecord> = { amountPaid, balanceDue };

    if (amountPaid >= inv.totalAmount) {
      changes.status = 'paid' as InvoiceStatus;
      changes.paidAt = new Date().toISOString();
    } else if (amountPaid > 0 && inv.status !== 'overdue') {
      changes.status = 'partial' as InvoiceStatus;
    }

    const updated = await this.repo.update(invoiceId, changes);

    if (updated && updated.status === 'paid') {
      this.activity.create({
        event_type: 'invoice_paid',
        project_id: updated.projectId,
        entity_type: 'invoice',
        entity_id: invoiceId,
        summary: `Invoice ${updated.invoiceNumber} paid in full — $${updated.totalAmount.toFixed(2)}`,
      }).catch((err) => console.error('Failed to log invoice event:', err));
    }

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Overdue detection (called on reads)
  // ---------------------------------------------------------------------------

  private refreshOverdueStatus(inv: InvoiceRecord): InvoiceRecord {
    const eligibleStatuses: InvoiceStatus[] = ['sent', 'viewed', 'partial'];
    if (
      eligibleStatuses.includes(inv.status) &&
      inv.balanceDue > 0 &&
      new Date(inv.dueDate) < new Date()
    ) {
      return { ...inv, status: 'overdue' as InvoiceStatus };
    }
    return inv;
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<InvoiceRecord | null> {
    const inv = await this.repo.findById(id);
    return inv ? this.refreshOverdueStatus(inv) : null;
  }

  async findByProjectId(projectId: string): Promise<InvoiceRecord[]> {
    const invoices = await this.repo.findByProjectId(projectId);
    return invoices.map((inv) => this.refreshOverdueStatus(inv));
  }

  async findByCustomerId(customerId: string): Promise<InvoiceRecord[]> {
    const invoices = await this.repo.findByCustomerId(customerId);
    return invoices.map((inv) => this.refreshOverdueStatus(inv));
  }

  async findAll(): Promise<InvoiceRecord[]> {
    const invoices = await this.repo.findAll();
    return invoices.map((inv) => this.refreshOverdueStatus(inv));
  }

  async delete(id: string): Promise<boolean> {
    const inv = await this.repo.findById(id);
    if (!inv) return false;

    const deleted = await this.repo.delete(id);

    if (deleted) {
      this.activity.create({
        event_type: 'invoice_deleted',
        project_id: inv.projectId,
        entity_type: 'invoice',
        entity_id: id,
        summary: `Invoice ${inv.invoiceNumber} deleted`,
      }).catch((err) => console.error('Failed to log invoice event:', err));
    }

    return deleted;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const all = await this.repo.findAll();

    const prefix = `INV-${year}-`;
    let maxNum = 0;

    for (const inv of all) {
      if (inv.invoiceNumber.startsWith(prefix)) {
        const num = parseInt(inv.invoiceNumber.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }

    const next = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${next}`;
  }
}

export function createInvoiceService(
  repo: InvoiceRepository,
  paymentRepo: PaymentRepository,
  activity: ActivityService,
  lineItemFinder: LineItemFinder,
): InvoiceService {
  return new InvoiceService(repo, paymentRepo, activity, lineItemFinder);
}
