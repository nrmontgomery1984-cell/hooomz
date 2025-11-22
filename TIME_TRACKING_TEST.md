# Time Tracking Workflow Test

This document contains step-by-step API tests for the Buildz time tracking system.

## Prerequisites

Before running these tests, get the following IDs from Supabase:

```sql
-- Get employee IDs
SELECT id, first_name, last_name FROM employees WHERE is_active = TRUE;

-- Get category IDs for garage project
SELECT id, name, phase_id FROM categories
WHERE project_id = '08d59b47-1a9e-49c5-82f2-e6cafc06027c';
```

Replace the placeholder IDs below with your actual UUIDs.

## Test Scenario

Nathan clocks in at 8:00 AM to work on Framing, takes a break at 10:00 AM, resumes at 10:15 AM, switches to Electrical work at 12:00 PM, and clocks out at 4:00 PM.

---

## Step 1: Clock In (8:00 AM - Start Framing)

```bash
curl -X POST http://localhost:8080/api/time-tracking/clock-in \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "NATHAN_EMPLOYEE_ID",
    "project_id": "08d59b47-1a9e-49c5-82f2-e6cafc06027c",
    "category_id": "FRAMING_CATEGORY_ID",
    "clock_in_time": "2025-01-20T08:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "time_entry": {
    "id": "...",
    "employee_id": "...",
    "project_id": "08d59b47-1a9e-49c5-82f2-e6cafc06027c",
    "category_id": "...",
    "clock_in_time": "2025-01-20T08:00:00.000Z",
    "clock_in_time_rounded": "2025-01-20T08:00:00.000Z",
    "clock_out_time": null,
    "break_duration": 0,
    "approval_status": "draft"
  },
  "message": "Clocked in successfully"
}
```

**Save the `time_entry.id` for later steps!**

---

## Step 2: Start Break (10:00 AM)

```bash
curl -X POST http://localhost:8080/api/time-tracking/TIME_ENTRY_ID/break/start \
  -H "Content-Type: application/json" \
  -d '{
    "break_start_time": "2025-01-20T10:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "message": "Break started",
  "break_start_time": "2025-01-20T10:00:00.000Z",
  "break_start_time_rounded": "2025-01-20T10:00:00.000Z"
}
```

---

## Step 3: End Break (10:15 AM)

```bash
curl -X POST http://localhost:8080/api/time-tracking/TIME_ENTRY_ID/break/end \
  -H "Content-Type: application/json" \
  -d '{
    "break_end_time": "2025-01-20T10:15:00Z"
  }'
```

**Expected Response:**
```json
{
  "message": "Break ended",
  "break_end_time": "2025-01-20T10:15:00.000Z",
  "break_end_time_rounded": "2025-01-20T10:15:00.000Z",
  "total_break_minutes": 15
}
```

---

## Step 4: Switch Category (12:00 PM - Switch to Electrical)

```bash
curl -X POST http://localhost:8080/api/time-tracking/TIME_ENTRY_ID/switch-category \
  -H "Content-Type: application/json" \
  -d '{
    "new_category_id": "ELECTRICAL_CATEGORY_ID",
    "switch_time": "2025-01-20T12:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "old_entry": {
    "id": "...",
    "clock_out_time": "2025-01-20T12:00:00.000Z",
    "hours_worked": 3.75
  },
  "new_entry": {
    "id": "...",
    "clock_in_time": "2025-01-20T12:00:00.000Z",
    "category_id": "ELECTRICAL_CATEGORY_ID"
  },
  "message": "Switched category successfully"
}
```

**Save the new `new_entry.id` for the clock-out step!**

---

## Step 5: Clock Out (4:00 PM)

```bash
curl -X POST http://localhost:8080/api/time-tracking/NEW_TIME_ENTRY_ID/clock-out \
  -H "Content-Type: application/json" \
  -d '{
    "clock_out_time": "2025-01-20T16:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "time_entry": {
    "id": "...",
    "clock_in_time": "2025-01-20T12:00:00.000Z",
    "clock_out_time": "2025-01-20T16:00:00.000Z",
    "hours_worked": 4,
    "labor_cost": 180,
    "labor_revenue": 240
  },
  "message": "Clocked out successfully"
}
```

---

## Step 6: View Today's Activity

```bash
curl -X GET "http://localhost:8080/api/time-tracking/dashboard/activity?date=2025-01-20"
```

**Expected Response:**
Shows all time entries for today with employee names, categories, hours worked, and budget tracking.

---

## Step 7: Submit Time Entries for Approval

First, get the time entry IDs from today:

```sql
SELECT id, employee_id, category_id, clock_in_time, hours_worked, approval_status
FROM time_entries
WHERE DATE(clock_in_time) = '2025-01-20';
```

Then submit them:

```bash
curl -X POST http://localhost:8080/api/time-tracking/time-entries/submit \
  -H "Content-Type: application/json" \
  -d '{
    "time_entry_ids": ["ENTRY_ID_1", "ENTRY_ID_2"]
  }'
```

**Expected Response:**
```json
{
  "submitted_count": 2,
  "time_entries": [...]
}
```

---

## Step 8: Manager Approval

```bash
curl -X POST http://localhost:8080/api/time-tracking/time-entries/approve \
  -H "Content-Type: application/json" \
  -d '{
    "time_entry_ids": ["ENTRY_ID_1", "ENTRY_ID_2"],
    "approver_id": "MANAGER_EMPLOYEE_ID"
  }'
```

---

## Step 9: View Payroll Report

```bash
curl -X GET "http://localhost:8080/api/time-tracking/payroll/current"
```

**Expected Response:**
Shows the current pay period with all employee time entries, total hours, total cost, and total revenue.

---

## Step 10: View Budget Tracking

```bash
curl -X GET "http://localhost:8080/api/time-tracking/projects/08d59b47-1a9e-49c5-82f2-e6cafc06027c/budget"
```

**Expected Response:**
```json
{
  "project": {
    "id": "08d59b47-1a9e-49c5-82f2-e6cafc06027c",
    "name": "222 Whitney - Garage"
  },
  "categories": [
    {
      "category_name": "Framing",
      "labor_budget_dollars": 3600,
      "hours_budgeted": 60,
      "hours_spent": 3.75,
      "labor_cost": 168.75,
      "labor_revenue": 225,
      "budget_remaining_dollars": 3375,
      "percent_complete": 6.25
    },
    {
      "category_name": "Electrical Rough-in",
      "labor_budget_dollars": 2400,
      "hours_budgeted": 40,
      "hours_spent": 4,
      "labor_cost": 180,
      "labor_revenue": 240,
      "budget_remaining_dollars": 2160,
      "percent_complete": 10
    }
  ]
}
```

---

## Verification Queries

Run these in Supabase to verify the data:

```sql
-- View all time entries for the test day
SELECT
  te.id,
  e.first_name || ' ' || e.last_name as employee,
  c.name as category,
  te.clock_in_time_rounded,
  te.clock_out_time_rounded,
  te.hours_worked,
  te.break_duration,
  te.labor_cost,
  te.labor_revenue,
  te.approval_status
FROM time_entries te
JOIN employees e ON te.employee_id = e.id
JOIN categories c ON te.category_id = c.id
WHERE DATE(te.clock_in_time) = '2025-01-20'
ORDER BY te.clock_in_time;

-- View budget tracking
SELECT * FROM budget_tracking
WHERE project_id = '08d59b47-1a9e-49c5-82f2-e6cafc06027c'
ORDER BY category_name;

-- View activity log
SELECT
  al.action,
  al.description,
  e.first_name || ' ' || e.last_name as employee,
  al.created_at
FROM activity_log al
JOIN employees e ON al.employee_id = e.id
WHERE DATE(al.created_at) = '2025-01-20'
ORDER BY al.created_at DESC;
```

---

## Expected Final State

After completing all steps, you should have:

1. ✅ 2 time entries (Framing: 3.75 hrs, Electrical: 4 hrs)
2. ✅ 15 minutes of break time recorded
3. ✅ Budget tracking updated for both categories
4. ✅ Activity log entries for all actions
5. ✅ Time entries in "approved" status
6. ✅ Payroll report showing total hours and costs

**Total Hours:** 7.75 hours (8 hours - 0.25 hours break)
**Total Cost:** $348.75 (7.75 × $45)
**Total Revenue:** $465 (7.75 × $60)
**Profit Margin:** $116.25 (25%)
