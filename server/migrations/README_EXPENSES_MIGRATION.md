# Expense Tracking System Migration

## Overview

This migration creates the database structure for a comprehensive expense tracking system with:

- **Receipt uploads** (Google Drive, camera, file upload)
- **OCR processing** for automatic data extraction
- **Multi-project support** with project association
- **Approval workflow** for expense management
- **Flexible categorization** with tags and categories
- **Detailed expense metadata** (vendor, date, amount, notes)

## How to Run

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy and paste the contents of `create_expenses_table.sql`
5. Click **Run**

## Database Structure

### Tables Created

#### 1. `expenses`
Main table for storing expense records:
- Basic info: date, vendor, category, description, amount
- Receipt: url, filename, upload timestamp
- OCR data: extracted data (JSON), confidence score
- Approval: status, approved_by, approved_at
- Metadata: notes, tags, created_by, timestamps

#### 2. `expense_categories`
Predefined expense categories:
- Materials, Labor, Equipment, Permits
- Transportation, Utilities, Professional Services
- Insurance, Waste Removal, Other

### Default Categories

The migration includes 10 default categories with colors and icons:

| Category | Color | Icon | Description |
|----------|-------|------|-------------|
| Materials | Blue | Package | Building materials and supplies |
| Labor | Green | Users | Labor costs and subcontractors |
| Equipment | Orange | Wrench | Tools and equipment rentals |
| Permits | Indigo | FileText | Permits and inspections |
| Transportation | Purple | Truck | Vehicle and fuel costs |
| Utilities | Teal | Zap | Electricity, water, gas |
| Professional Services | Red | Briefcase | Architects, engineers, consultants |
| Insurance | Pink | Shield | Project insurance costs |
| Waste Removal | Orange | Trash | Debris and waste disposal |
| Other | Gray | MoreHorizontal | Miscellaneous expenses |

## Features

### OCR Data Storage

The `ocr_data` JSONB field can store extracted information like:
```json
{
  "vendor": "Home Depot",
  "date": "2025-01-15",
  "total": 342.18,
  "items": [
    {"description": "2x4 Lumber", "quantity": 20, "price": 8.99},
    {"description": "Screws Box", "quantity": 2, "price": 12.50}
  ],
  "tax": 28.50,
  "payment_method": "Credit Card"
}
```

### Status Workflow

Expenses can have three statuses:
- **pending**: Awaiting approval (default)
- **approved**: Approved by manager
- **rejected**: Rejected with notes

### Tags

Expenses support flexible tagging for:
- Custom categorization
- Project phases
- Specific tracking needs
- Example: `['urgent', 'reimbursable', 'phase-1']`

## Next Steps

After running the migration:

1. **Backend**: Create API endpoints for CRUD operations
2. **File Upload**: Set up Supabase Storage bucket for receipts
3. **OCR Integration**: Integrate OCR service (Google Vision API, Tesseract, etc.)
4. **Frontend**: Build expense management UI
5. **Mobile**: Add camera capture for receipts

## Storage Setup (Required)

Create a Supabase Storage bucket for receipts:

1. Go to Storage in Supabase Dashboard
2. Create new bucket: `expense-receipts`
3. Set as **Public** or configure RLS policies:

```sql
-- Allow authenticated users to upload receipts
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-receipts');

-- Allow users to view receipts for their projects
CREATE POLICY "Users can view project receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'expense-receipts');
```

## RLS Policies (Recommended)

Enable Row Level Security on the expenses table:

```sql
-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Users can view expenses for projects they're members of
CREATE POLICY "Users can view project expenses"
ON expenses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = expenses.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Users can insert expenses for projects they're members of
CREATE POLICY "Users can create project expenses"
ON expenses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = expenses.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Only admins/owners can approve expenses
CREATE POLICY "Admins can approve expenses"
ON expenses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = expenses.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('admin', 'owner')
  )
);
```

## Migration is Idempotent

This migration can be run multiple times safely. It uses:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `ON CONFLICT DO NOTHING` for category inserts
