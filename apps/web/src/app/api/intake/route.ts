import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/intake
 *
 * Receives intake form submissions from the public landing page and inserts
 * them into sync_data with the correct org_id. Uses the service role key to
 * bypass RLS (the landing page has no authenticated user).
 *
 * Body: { lead: LeadRecord, customer: CustomerRecord }
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// eslint-disable-next-line
type SBClient = ReturnType<typeof createClient<any>>;

function getServiceClient(): SBClient | null {
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Look up the default org_id from team_members (first org found)
async function getDefaultOrgId(client: SBClient): Promise<string | null> {
  const { data } = await client
    .from('team_members')
    .select('organization_id')
    .limit(1)
    .single();
  return (data as { organization_id?: string } | null)?.organization_id ?? null;
}

function generatePropertyId(): string {
  return `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generatePassportId(): string {
  return `pass_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(req: NextRequest) {
  try {
    const client = getServiceClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { lead, customer } = body;

    if (!lead?.id || !customer?.id) {
      return NextResponse.json(
        { error: 'Missing lead or customer data' },
        { status: 400 }
      );
    }

    const orgId = await getDefaultOrgId(client);
    if (!orgId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    // Insert lead + customer into sync_data with org_id
    const [leadResult, custResult] = await Promise.all([
      client.from('sync_data').upsert({
        id: lead.id,
        store_name: 'intake_leads',
        data: lead,
        updated_at: now,
        device_id: 'intake_form',
        org_id: orgId,
        deleted: false,
      }),
      client.from('sync_data').upsert({
        id: customer.id,
        store_name: 'customers',
        data: customer,
        updated_at: now,
        device_id: 'intake_form',
        org_id: orgId,
        deleted: false,
      }),
    ]);

    if (leadResult.error || custResult.error) {
      const msg = leadResult.error?.message || custResult.error?.message;
      console.error('[intake] Insert failed:', msg);
      return NextResponse.json({ error: 'Save failed' }, { status: 500 });
    }

    // Create property record from customer address data
    const propertyId = generatePropertyId();
    const passportId = generatePassportId();

    const property = {
      id: propertyId,
      org_id: orgId,
      customer_id: customer.id,
      address_line_1: customer.propertyAddress || 'Requires update',
      city: customer.propertyCity || 'Moncton',
      province: customer.propertyProvince || 'NB',
      postal_code: customer.propertyPostalCode || '',
      property_type: 'residential' as const,
      passport_id: passportId,
      created_at: now,
      updated_at: now,
    };

    const passport = {
      id: passportId,
      org_id: orgId,
      property_id: propertyId,
      entry_ids: [],
      homeowner_access_enabled: false,
      created_at: now,
      updated_at: now,
    };

    const [propResult, passResult] = await Promise.all([
      client.from('sync_data').upsert({
        id: propertyId,
        store_name: 'properties',
        data: property,
        updated_at: now,
        device_id: 'intake_form',
        org_id: orgId,
        deleted: false,
      }),
      client.from('sync_data').upsert({
        id: passportId,
        store_name: 'passports',
        data: passport,
        updated_at: now,
        device_id: 'intake_form',
        org_id: orgId,
        deleted: false,
      }),
    ]);

    if (propResult.error || passResult.error) {
      const msg = propResult.error?.message || passResult.error?.message;
      console.error('[intake] Property/passport insert failed:', msg);
      // Non-blocking — lead + customer already saved
    }

    // Update lead record with property_id
    const updatedLead = { ...lead, property_id: propertyId };
    await client.from('sync_data').upsert({
      id: lead.id,
      store_name: 'intake_leads',
      data: updatedLead,
      updated_at: now,
      device_id: 'intake_form',
      org_id: orgId,
      deleted: false,
    });

    // Update customer with property_ids
    const updatedCustomer = {
      ...customer,
      property_ids: [...(customer.property_ids ?? []), propertyId],
    };
    await client.from('sync_data').upsert({
      id: customer.id,
      store_name: 'customers',
      data: updatedCustomer,
      updated_at: now,
      device_id: 'intake_form',
      org_id: orgId,
      deleted: false,
    });

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      propertyId,
    });
  } catch (err) {
    console.error('[intake] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
