# Project Management & Time Tracking System - Setup Guide

## Overview
I've created a complete contractor project management system with scope of work tracking and time tracking for your Hooomz Profile app. This system is specifically designed for managing renovation projects like "222 Whitney".

## What's Been Built

### 1. Database Schema (Ready to Deploy)

**File**: `server/migrations/create_projects_and_time_tracking.sql`

Creates 5 tables:
- **projects** - Contractor projects (e.g., 222 Whitney)
- **scope_categories** - Main work categories (Interior, Exterior, Mechanical, etc.)
- **scope_subcategories** - Subcategories within categories (Living Room, Kitchen, etc.)
- **scope_items** - Individual work tasks
- **time_entries** - Time tracking linked to scope items

**Features**:
- Automatic timestamp updates
- Automatic actual hours calculation from time entries
- Cascading deletes for data integrity
- Optimized indexes for performance

### 2. 222 Whitney Project Seed Data (Ready to Deploy)

**File**: `server/migrations/seed_222_whitney_project.sql`

Pre-populated with all tasks from the text messages, organized into:

**Interior** (6 subcategories):
- Living Room (3 tasks)
- Kitchen (3 tasks)
- Hallway (1 task)
- Master Bedroom (1 task)
- Upstairs Bathroom (1 task)
- Upstairs General (3 tasks)

**Downstairs** (5 subcategories):
- Washer/Dryer Bath Area (3 tasks)
- Windows & Doors (2 tasks)
- Stairs (2 tasks)
- Flooring (1 task)
- Entrance (1 task)

**Exterior** (1 subcategory):
- Exterior General (4 tasks)

**Mechanical** (1 subcategory):
- HVAC (1 task - Ryan to install heater)

**General & Cleanup** (2 subcategories):
- Cleanup (1 task - marked as completed)
- Outstanding Items (1 task - Mark's work)

### 3. Backend API (Complete)

**Files Created**:
- `server/src/repositories/projectsRepo.js` - Project database operations
- `server/src/repositories/scopeRepo.js` - Scope items database operations
- `server/src/repositories/timeEntriesRepo.js` - Time tracking database operations
- `server/src/routes/projects.js` - Complete REST API

**API Endpoints**:

#### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:projectId` - Get single project
- `GET /api/projects/:projectId/scope` - Get project with full scope breakdown
- `POST /api/projects` - Create project
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

#### Scope Management
- `GET /api/projects/:projectId/categories` - Get categories
- `POST /api/projects/:projectId/categories` - Create category
- `GET /api/projects/categories/:categoryId/subcategories` - Get subcategories
- `POST /api/projects/categories/:categoryId/subcategories` - Create subcategory
- `GET /api/projects/subcategories/:subcategoryId/items` - Get scope items
- `GET /api/projects/:projectId/items` - Get ALL items for project (for time tracker)
- `POST /api/projects/subcategories/:subcategoryId/items` - Create scope item
- `PUT /api/projects/items/:itemId` - Update scope item
- `DELETE /api/projects/items/:itemId` - Delete scope item

#### Time Tracking
- `GET /api/projects/:projectId/time-entries` - Get time entries (supports filters)
- `GET /api/projects/items/:itemId/time-entries` - Get time for specific item
- `GET /api/projects/time-entries/active/:workerName` - Get active timer
- `POST /api/projects/items/:itemId/time-entries` - Start time entry
- `POST /api/projects/time-entries/:entryId/stop` - Stop timer
- `PUT /api/projects/time-entries/:entryId` - Update time entry
- `DELETE /api/projects/time-entries/:entryId` - Delete time entry

## Next Steps - What YOU Need to Do

### Step 1: Run Database Migrations

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `server/migrations/create_projects_and_time_tracking.sql`
6. Click **Run**
7. Verify success (should see "Success. No rows returned")

### Step 2: Seed the 222 Whitney Project

1. In Supabase SQL Editor, click **New Query** again
2. Copy and paste the contents of `server/migrations/seed_222_whitney_project.sql`
3. Click **Run**
4. You now have the complete 222 Whitney project with all tasks!

### Step 3: Test the API

Restart your server (it's already running with the new routes), then test:

```bash
# Get all projects
curl http://localhost:3001/api/projects

# Get 222 Whitney with full scope
curl http://localhost:3001/api/projects/222-whitney-project-id/scope

# Get all scope items (for time tracker dropdown)
curl http://localhost:3001/api/projects/222-whitney-project-id/items
```

### Step 4: Build the Frontend (Optional - I can do this)

I can create the frontend UI if you'd like, which will include:
- **Projects Dashboard** - View all projects
- **Project Detail View** - See full scope breakdown by category/subcategory
- **Scope Item Management** - Mark tasks as pending/in-progress/completed
- **Time Tracker** - Start/stop timer linked to specific scope items
  - Dropdown will ONLY show scope items from the selected project
  - Prevents tracking time on non-scope tasks
- **Time Reports** - View time by worker, date range, or scope item

## Key Features

### Time Tracker Restrictions
✅ The time tracker dropdown will **ONLY** show tasks from the project's scope of work
✅ Workers cannot track time on tasks that aren't in the scope
✅ This ensures all time entries are linked to approved scope items

### Automatic Hour Tracking
✅ When time entries are added, the scope item's `actual_hours` updates automatically
✅ Compare `estimated_hours` vs `actual_hours` to track budget

### Task Status Tracking
- **Pending** - Not started
- **In Progress** - Currently working on it
- **Completed** - Done (automatic timestamp)
- **Cancelled** - Won't be done

## File Structure

```
server/
├── migrations/
│   ├── create_projects_and_time_tracking.sql
│   └── seed_222_whitney_project.sql
├── src/
│   ├── repositories/
│   │   ├── projectsRepo.js
│   │   ├── scopeRepo.js
│   │   └── timeEntriesRepo.js
│   └── routes/
│       └── projects.js
```

## Database Schema Highlights

### Hierarchical Structure
```
Project (222 Whitney)
├── Category (Interior)
│   ├── Subcategory (Living Room)
│   │   ├── Scope Item (Install baseboard)
│   │   │   └── Time Entry (Nathan, 2 hours)
│   │   ├── Scope Item (Touch up painting)
│   │   └── Scope Item (Install window blinds)
│   └── Subcategory (Kitchen)
│       └── ...
├── Category (Downstairs)
│   └── ...
└── Category (Exterior)
    └── ...
```

### Automatic Calculations
- Time entries automatically update scope item `actual_hours`
- Triggers handle the math for you
- No manual calculation needed!

## Example Usage

### Creating a Time Entry
```javascript
// Start timer for "Install baseboard" task
POST /api/projects/items/{itemId}/time-entries
{
  "worker_name": "Nathan",
  "start_time": "2025-11-08T14:00:00Z"
}

// Stop timer (automatically calculates duration)
POST /api/projects/time-entries/{entryId}/stop
```

### Updating Scope Item Status
```javascript
// Mark task as completed
PUT /api/projects/items/{itemId}
{
  "status": "completed"
}
// Automatically sets completed_at timestamp
```

## Ready to Use!

Once you run the two SQL migrations, the system is fully operational. The backend is complete and the API is ready to use.

Would you like me to:
1. Create the frontend UI components?
2. Add more features (like cost tracking, materials linking, etc.)?
3. Create mobile-optimized views for workers in the field?

Let me know what you'd like next!
