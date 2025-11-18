# Expense Tracker Implementation Guide

## Overview

Comprehensive expense tracking system for project management with receipt upload, OCR data extraction, and approval workflows.

## ✅ Phase 1: Database & Backend (COMPLETED)

### Files Created:

1. **`server/migrations/create_expenses_table.sql`**
   - Creates `expenses` table with full schema
   - Creates `expense_categories` table with 10 default categories
   - Adds indexes for performance
   - Includes OCR data storage (JSONB)
   - Approval workflow (pending/approved/rejected)
   - Tags for flexible categorization

2. **`server/migrations/README_EXPENSES_MIGRATION.md`**
   - Migration instructions
   - Database structure documentation
   - RLS policy examples
   - Storage bucket setup guide

3. **`server/src/repositories/expensesRepo.js`**
   - Complete CRUD operations
   - Statistics and analytics
   - Date range and category filtering
   - OCR data management
   - Approval/rejection workflows

4. **`server/src/routes/expenses.js`**
   - RESTful API endpoints
   - All expense operations
   - Proper error handling
   - Authentication middleware

5. **`server/src/index.js`** (Updated)
   - Registered expenses router at `/api/expenses`

### API Endpoints Available:

```
GET    /api/expenses/all                    # All expenses across projects
GET    /api/expenses/project/:projectId     # Expenses for specific project
GET    /api/expenses/categories              # Get expense categories
GET    /api/expenses/stats?projectId=X       # Expense statistics
GET    /api/expenses/date-range?startDate=&endDate=  # Date range filter
GET    /api/expenses/category/:category      # Filter by category
GET    /api/expenses/:expenseId              # Get single expense
POST   /api/expenses                         # Create expense
PUT    /api/expenses/:expenseId              # Update expense
DELETE /api/expenses/:expenseId              # Delete expense
POST   /api/expenses/:expenseId/approve      # Approve expense
POST   /api/expenses/:expenseId/reject       # Reject expense
POST   /api/expenses/:expenseId/ocr          # Update OCR data
```

## 📋 Phase 2: Frontend Components (TODO)

### 2.1 Global Expenses Page

Create `client/src/pages/GlobalExpenses.jsx`:
- Similar to GlobalAnalytics structure
- Project selector dropdown (All Projects + individual projects)
- Expense table/spreadsheet view
- Filter by date range, category, status
- Summary statistics cards
- Export to CSV functionality

### 2.2 Expense Upload Component

Create `client/src/components/Expenses/ExpenseUploadDialog.jsx`:
- File upload (drag & drop or click)
- Google Drive picker integration
- Camera capture for mobile
- Preview uploaded receipt
- Manual entry form (if no receipt)
- Auto-fill from OCR data

### 2.3 Expense Table Component

Create `client/src/components/Expenses/ExpensesTable.jsx`:
- Spreadsheet-like interface (react-table or similar)
- Sortable columns
- Inline editing
- Row selection
- Bulk actions (approve, delete, export)
- Receipt thumbnail preview
- Expandable row details

### 2.4 Expense Form

Create `client/src/components/Expenses/ExpenseForm.jsx`:
- Date picker
- Vendor autocomplete
- Category dropdown (from categories API)
- Amount input with validation
- Description/notes textarea
- Tags input
- Receipt upload field
- Submit/cancel buttons

### 2.5 OCR Processing Component

Create `client/src/components/Expenses/OCRProcessor.jsx`:
- Show OCR processing status
- Display extracted data
- Allow user to confirm/edit extracted fields
- Confidence indicators
- Manual override options

##  🔧 Phase 3: Integration & Features (TODO)

### 3.1 Google Drive Integration

#### Option 1: Google Picker API (Recommended)
```javascript
// Install: npm install @react-oauth/google
// Use Google Picker to select files from Drive
// Download selected file
// Upload to Supabase Storage
```

#### Option 2: Direct Upload to Drive
```javascript
// Use Google Drive API
// Store Drive file ID in database
// Link to file in Drive
```

### 3.2 Receipt OCR Processing

#### Option 1: Google Cloud Vision API (Recommended)
- Excellent accuracy
- Extracts text, amounts, dates
- Detects vendor names
- Paid service ($1.50 per 1000 images)

#### Option 2: Tesseract.js (Free)
- Client-side OCR
- Good for basic receipts
- No API costs
- Lower accuracy than Cloud Vision

#### Option 3: AWS Textract
- Good accuracy
- Specialized for documents
- Extracts key-value pairs
- Pay per use

### 3.3 Camera Capture (Mobile)

```javascript
// Use HTML5 camera input
<input
  type="file"
  accept="image/*"
  capture="environment"  // Use back camera
  onChange={handlePhotoCapture}
/>
```

### 3.4 Supabase Storage Setup

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false);

-- RLS Policies
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-receipts');

CREATE POLICY "Users can view project receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'expense-receipts');
```

## 📱 Phase 4: UI/UX Enhancements (TODO)

### 4.1 Navigation

Update `client/src/components/Layout/ModernLayout.jsx`:
```javascript
const buildzNav = [
  { label: 'Projects', path: '/projects', icon: Hammer },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Time', path: '/time', icon: Clock },
  { label: 'Expenses', path: '/expenses', icon: DollarSign }, // ADD THIS
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Contacts', path: '/contacts', icon: Users },
]
```

Update `client/src/App.jsx`:
```javascript
import GlobalExpenses from './pages/GlobalExpenses'

// Add route
<Route path="/expenses" element={<ModernLayout><GlobalExpenses /></ModernLayout>} />
```

### 4.2 Dashboard Widgets

Create expense summary cards:
- Total expenses this month
- Pending approvals count
- Top spending categories
- Recent expenses list

### 4.3 Mobile Optimization

- Responsive table (stack on mobile)
- Touch-friendly buttons
- Camera capture button
- Swipe actions for approve/reject

## 🎨 Recommended Libraries

### Frontend
```json
{
  "@tanstack/react-table": "^8.x",      // Table component
  "react-dropzone": "^14.x",           // File upload
  "tesseract.js": "^5.x",              // OCR (if using client-side)
  "@react-oauth/google": "^0.12.x",    // Google auth/picker
  "date-fns": "^3.x",                  // Date handling (already installed)
  "recharts": "^2.x"                   // Charts for analytics
}
```

### Backend (Optional)
```json
{
  "@google-cloud/vision": "^4.x",      // Google Vision API
  "multer": "^1.4.x",                  // File upload handling
  "sharp": "^0.33.x"                   // Image processing
}
```

## 🔐 Security Considerations

1. **File Upload**
   - Validate file types (images, PDFs only)
   - Limit file size (e.g., 10MB max)
   - Scan for malware
   - Generate unique filenames

2. **Data Access**
   - Implement RLS policies
   - Verify project membership
   - Admin-only for approvals

3. **API Keys**
   - Store in environment variables
   - Never commit to git
   - Use backend proxy for OCR calls

## 📊 Example OCR Response Structure

```javascript
{
  "vendor": "Home Depot",
  "date": "2025-01-15",
  "total": 342.18,
  "subtotal": 313.68,
  "tax": 28.50,
  "payment_method": "Visa ending in 1234",
  "items": [
    {
      "description": "2x4x8 Lumber",
      "quantity": 20,
      "unit_price": 8.99,
      "total": 179.80
    },
    {
      "description": "Deck Screws 5lb",
      "quantity": 2,
      "unit_price": 12.50,
      "total": 25.00
    }
  ],
  "confidence": 0.94
}
```

## ✅ Next Steps (Priority Order)

1. ✅ **Run Database Migration** (REQUIRED FIRST)
   - Copy SQL from `create_expenses_table.sql`
   - Run in Supabase SQL Editor
   - Verify tables created

2. ✅ **Set up Supabase Storage**
   - Create `expense-receipts` bucket
   - Configure RLS policies

3. **Create GlobalExpenses Page**
   - Basic layout and structure
   - Project selector
   - Expense list/table

4. **Build Expense Form**
   - Manual entry first
   - File upload later

5. **Add Upload Component**
   - Basic file upload
   - Preview functionality

6. **Integrate OCR** (Later phase)
   - Choose OCR provider
   - Process uploaded receipts
   - Extract and display data

7. **Mobile Camera Capture** (Final phase)
   - Add camera input
   - Mobile optimization

## 🚀 Quick Start for Development

1. Run migration in Supabase
2. Create GlobalExpenses page
3. Add navigation link
4. Create basic expense form
5. Test CRUD operations
6. Add file upload
7. Integrate OCR

## 💡 Feature Ideas for Later

- **Recurring Expenses**: Track monthly/regular expenses
- **Budget Tracking**: Set and monitor project budgets
- **Expense Reports**: Generate PDF reports
- **Email Notifications**: Notify on pending approvals
- **Receipt Matching**: Match receipts to scope items
- **Vendor Management**: Track vendor details
- **Payment Status**: Track paid/unpaid expenses
- **Multi-currency**: Support different currencies
- **Expense Forecasting**: Predict future expenses

---

**Status**: Backend complete, frontend pending
**Last Updated**: 2025-01-17
