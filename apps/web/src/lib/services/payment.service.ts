/**
 * Payment Service
 * Wraps PaymentRepository with activity logging (spine rule).
 * One-way dependency: PaymentService → InvoiceService (no circular).
 */

import type { PaymentRecord, CreatePaymentInput } from '@hooomz/shared-contracts';
import type { PaymentRepository } from '../repositories/payment.repository';
import type { InvoiceService } from './invoice.service';
import type { ActivityService } from '../repositories/activity.repository';

export class PaymentService {
  constructor(
    private repo: PaymentRepository,
    private invoiceService: InvoiceService,
    private activity: ActivityService,
  ) {}

  async create(input: CreatePaymentInput): Promise<PaymentRecord> {
    const record = await this.repo.create(input);

    // Update invoice payment totals (may trigger paid status)
    await this.invoiceService.updatePaymentTotals(input.invoiceId);

    this.activity.create({
      event_type: 'payment_received',
      project_id: input.projectId,
      entity_type: 'payment',
      entity_id: record.id,
      summary: `Payment received: $${input.amount.toFixed(2)} (${input.method})`,
    }).catch((err) => console.error('Failed to log payment event:', err));

    return record;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id);
    if (!existing) return false;

    const deleted = await this.repo.delete(id);

    if (deleted) {
      // Recalculate invoice totals
      await this.invoiceService.updatePaymentTotals(existing.invoiceId);

      this.activity.create({
        event_type: 'payment_deleted',
        project_id: existing.projectId,
        entity_type: 'payment',
        entity_id: id,
        summary: `Payment removed: $${existing.amount.toFixed(2)}`,
      }).catch((err) => console.error('Failed to log payment event:', err));
    }

    return deleted;
  }

  // Passthrough reads
  async findByInvoiceId(invoiceId: string): Promise<PaymentRecord[]> {
    return this.repo.findByInvoiceId(invoiceId);
  }

  async findByProjectId(projectId: string): Promise<PaymentRecord[]> {
    return this.repo.findByProjectId(projectId);
  }

  async findAll(): Promise<PaymentRecord[]> {
    return this.repo.findAll();
  }
}

export function createPaymentService(
  repo: PaymentRepository,
  invoiceService: InvoiceService,
  activity: ActivityService,
): PaymentService {
  return new PaymentService(repo, invoiceService, activity);
}
