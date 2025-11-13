# Hooomz Buildz - Project Context Document

## Project Overview

**Hooomz Buildz** is a full-stack construction project management platform built for contractors to manage renovation projects, track time, create estimates, and convert quotes into actionable scopes of work.

### Tech Stack
- **Frontend**: React 18.2, Vite, React Router, TailwindCSS, Lucide Icons
- **Backend**: Node.js, Express, Supabase (PostgreSQL)
- **State Management**: React hooks (useState, useEffect, useMemo)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Key Libraries**:
  - Axios (API calls)
  - date-fns (date handling)
  - joi (validation)
  - jsqr (QR code scanning)

---

## Database Schema

### Core Project Structure

The database uses a hierarchical structure for organizing construction work:

```
Projects
  ├── Scope Categories (e.g., "Interior", "Framing", "Drywall and Paint")
  │     ├── Scope Subcategories (e.g., "Living Room", "Wall Framing")
  │     │     ├── Scope Items (individual tasks)
  │     │     │     ├── Materials
  │     │     │     ├── Tools
  │     │     │     ├── Checklist Items
  │     │     │     ├── Photos
  │     │     │     └── Comments
  │     │     │
  │     │     └── Time Entries (tracks actual work time)
  │
  ├── Estimates (quotes for clients)
  │     └── Estimate Line Items
  │
  ├── Project Members (team collaboration)
  └── Workers (Nathan, Nishant, etc.)
```

### Table Schemas

#### 1. **projects**
Main project/job container
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  client_name TEXT,
  client_contact TEXT,
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  status TEXT DEFAULT 'active', -- 'planning', 'active', 'on_hold', 'completed', 'cancelled'
  budget DECIMAL(12, 2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP  -- soft delete
);
```

#### 2. **scope_categories**
Top-level work categories
```sql
CREATE TABLE scope_categories (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Standard Categories** (from category_templates):
- Demo
- Design and Planning
- Foundation
- Framing - Structural
- Framing - Non structural
- Building Envelope
- Drywall and Paint
- Flooring
- Finish Carpentry
- Siding
- Roofing
- Masonry
- Landscaping
- Hardscaping
- Millwork
- Tile
- Stairs and Railing

#### 3. **scope_subcategories**
Subcategories within categories
```sql
CREATE TABLE scope_subcategories (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES scope_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Subcategories** (Framing - Structural):
- Framing - Walls
- Framing - slip wall
- Bracing
- Sheathing - Walls
- Sheathing - Roof
- Framing - Roof

#### 4. **scope_items** (The Main Task Table)
Individual work tasks with rich metadata
```sql
CREATE TABLE scope_items (
  -- Core fields
  id UUID PRIMARY KEY,
  subcategory_id UUID REFERENCES scope_subcategories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  display_order INTEGER DEFAULT 0,

  -- Time tracking
  estimated_hours DECIMAL(8, 2),
  actual_hours DECIMAL(8, 2) DEFAULT 0,  -- Auto-calculated from time_entries

  -- Dates
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  -- Todoist-inspired fields
  priority INTEGER DEFAULT 4,  -- 1=urgent/red, 2=high/orange, 3=medium/yellow, 4=normal
  assignee_id UUID REFERENCES auth.users(id),
  labels TEXT[],  -- Array of tags
  parent_task_id UUID REFERENCES scope_items(id),  -- For subtasks
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  reminder_date TIMESTAMP,
  location TEXT,  -- Physical room/area
  duration_minutes INTEGER,  -- Estimated time
  section_id UUID REFERENCES task_sections(id),

  -- Template links (optional)
  category_template_id UUID REFERENCES category_templates(id),
  subcategory_template_id UUID REFERENCES subcategory_templates(id)
);
```

#### 5. **scope_item_materials**
Materials needed for each task
```sql
CREATE TABLE scope_item_materials (
  id UUID PRIMARY KEY,
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
```

#### 6. **scope_item_tools**
Tools required for each task
```sql
CREATE TABLE scope_item_tools (
  id UUID PRIMARY KEY,
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
```

#### 7. **scope_item_checklist**
Atul Gawande-style quality checklists (5-9 critical steps)
```sql
CREATE TABLE scope_item_checklist (
  id UUID PRIMARY KEY,
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,  -- Added in later migration
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES auth.users(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
```

**Checklist Philosophy** (from Atul Gawande's "The Checklist Manifesto"):
- Simple and concise (5-9 items per task)
- Focus on critical steps that are easy to skip
- "Do-confirm" style (perform task, then check off)
- Example templates: Drywall Installation, Wall Framing, Interior Painting, Tile Installation, Trim Installation

#### 8. **scope_item_photos**
Before/during/after documentation
```sql
CREATE TABLE scope_item_photos (
  id UUID PRIMARY KEY,
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  photo_type TEXT,  -- 'before', 'during', 'after', 'issue', 'other'
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP
);
```

#### 9. **scope_item_comments**
Task discussions (Todoist-style)
```sql
CREATE TABLE scope_item_comments (
  id UUID PRIMARY KEY,
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 10. **time_entries**
Actual time tracking for tasks
```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,  -- Auto-calculated
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Key Trigger**: When time entries are inserted/updated/deleted, the `scope_items.actual_hours` field is automatically recalculated.

#### 11. **estimates**
Client quotes that can be converted to project scope
```sql
CREATE TABLE estimates (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'sent', 'approved', 'rejected', 'converted'
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  valid_until DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 12. **estimate_line_items**
Individual items in an estimate
```sql
CREATE TABLE estimate_line_items (
  id UUID PRIMARY KEY,
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  category VARCHAR(255),  -- Stored as "Category › Subcategory" string
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'ea',
  unit_price DECIMAL(10, 2) DEFAULT 0,
  labor_hours DECIMAL(10, 2),
  materials_cost DECIMAL(10, 2),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 13. **project_members**
Team collaboration and permissions
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',  -- 'owner', 'admin', 'member', 'viewer'
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(project_id, user_id)
);
```

**Auto-trigger**: When a project is created, the creator is automatically added as 'owner'.

#### 14. **workers**
Contractor employees (Nathan, Nishant, etc.)
```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  hourly_rate DECIMAL(8, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Default Workers**:
- Nathan (General Contractor)
- Nishant (General Contractor)

#### 15. **task_sections**
Todoist-style sections for organizing tasks within projects
```sql
CREATE TABLE task_sections (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 16. **checklist_templates**
Reusable checklist templates for common tasks
```sql
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category_template_id UUID REFERENCES category_templates(id),
  subcategory_template_id UUID REFERENCES subcategory_templates(id),
  description TEXT,
  created_at TIMESTAMP
);
```

**Pre-seeded Templates**:
- Drywall Installation
- Wall Framing
- Interior Painting
- Tile Installation
- Trim Installation

#### 17. **checklist_template_items**
Individual steps in checklist templates
```sql
CREATE TABLE checklist_template_items (
  id UUID PRIMARY KEY,
  checklist_template_id UUID REFERENCES checklist_templates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

#### 18. **category_templates & subcategory_templates**
Standard construction categories reference data
```sql
CREATE TABLE category_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP
);

CREATE TABLE subcategory_templates (
  id UUID PRIMARY KEY,
  category_template_id UUID REFERENCES category_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP,
  UNIQUE(category_template_id, name)
);
```

---

## Architecture & File Structure

```
hooomz/
├── client/                      # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Projects/
│   │   │   │   ├── modules/
│   │   │   │   │   ├── TaskTrackerModule.jsx       # Main task list (grouped by category)
│   │   │   │   │   ├── TimeTrackerModule.jsx       # Time entry tracking
│   │   │   │   │   ├── EstimateModule.jsx          # Quote creation & conversion
│   │   │   │   │   ├── FinancialsModule.jsx        # Invoices, expenses
│   │   │   │   │   ├── DocumentsModule.jsx         # File management
│   │   │   │   │   ├── ActivityLogModule.jsx       # Audit trail
│   │   │   │   │   ├── ContactsModule.jsx          # Client/vendor contacts
│   │   │   │   │   ├── ScheduleModule.jsx          # Calendar view
│   │   │   │   │   ├── CommunicationModule.jsx     # Messages
│   │   │   │   │   └── AnalyticsModule.jsx         # Reports/metrics
│   │   │   │   ├── ModuleNav.jsx                   # Module tab navigation
│   │   │   │   ├── TaskDetailDialog.jsx            # Task edit dialog with materials/tools/checklist
│   │   │   │   ├── AddTaskDialog.jsx               # Create new task
│   │   │   │   ├── ProjectMembersDialog.jsx        # Team management
│   │   │   │   └── TimeTracker.jsx                 # Legacy time tracker
│   │   │   └── UI/
│   │   │       ├── ModernCard.jsx                  # Card component
│   │   │       └── Button.jsx                      # Button component
│   │   ├── pages/
│   │   │   └── ProjectDetailNew.jsx                # Main project page (module container)
│   │   ├── services/
│   │   │   └── projectsApi.js                      # API service layer
│   │   └── styles/
│   │       └── design-tokens.js                    # Color/spacing constants
│   └── package.json
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── projects.js                         # All project/scope/estimate endpoints
│   │   ├── repositories/
│   │   │   ├── projectsRepo.js                     # Project CRUD, members, workers
│   │   │   ├── scopeRepo.js                        # Categories, subcategories, items, details
│   │   │   ├── estimatesRepo.js                    # Estimates & line items
│   │   │   └── timeEntriesRepo.js                  # Time tracking
│   │   ├── utils/
│   │   │   └── supabase.js                         # Supabase client setup
│   │   ├── middleware/
│   │   │   ├── auth.js                             # Auth verification
│   │   │   ├── validation.js                       # Request validation
│   │   │   └── errorHandler.js                     # Global error handling
│   │   └── index.js                                # Express server entry
│   ├── migrations/
│   │   ├── create_projects_and_time_tracking.sql   # Core schema
│   │   ├── enhance_tasks_with_details_and_templates.sql  # Materials, tools, checklists
│   │   ├── add_todoist_like_fields.sql             # Priority, labels, assignee, etc.
│   │   ├── add_project_members.sql                 # Team collaboration
│   │   ├── add_due_date_to_scope_items.sql         # Deadline tracking
│   │   └── create_estimates.sql                    # Estimates feature
│   └── package.json
│
├── shared/                      # Shared types/utilities (future)
├── scripts/                     # Utility scripts
└── package.json                 # Workspace root
```

---

## Current Implementation

### Frontend Components

#### **TaskTrackerModule.jsx**
**Purpose**: Main task list view with filtering and category grouping

**Key Features**:
- Groups tasks by **category** (not subcategory) with visual hierarchy
- Category headers with gradient blue styling
- Subcategory sections within each category
- Filters: search, category, location, assignee, due date, duration
- "Hide Completed" toggle (persisted to localStorage)
- Inline editing for task description and subcategory
- Status toggle (Complete/Reopen)
- Click task to open TaskDetailDialog

**Data Flow**:
```
projectsApi.getProjectWithScope(projectId)
  → Returns: { ...project, categories: [...] }
  → Each category has subcategories with items
  → filteredProject → displayedProject (after filters applied)
```

**UI Structure**:
```
┌─────────────────────────────────────┐
│ CATEGORY NAME (blue header)        │
├─────────────────────────────────────┤
│  Subcategory 1                      │
│    → Task 1  [Edit] [✓ Done]       │
│    → Task 2  [Edit] [✓ Done]       │
│                                     │
│  Subcategory 2                      │
│    → Task 3  [Edit] [✓ Done]       │
└─────────────────────────────────────┘
```

#### **EstimateModule.jsx**
**Purpose**: Create client quotes and convert them to project scopes

**Key Features**:
- Create estimates with client info
- Add line items with:
  - Category/subcategory (cascading dropdowns from project scope)
  - Description, quantity, unit, unit price
  - Auto-calculated line totals
- Delete estimates and line items
- **Convert to Scope** button:
  - Creates categories/subcategories if they don't exist
  - Creates scope_items from line items
  - Moves pricing info to task notes field
  - Updates estimate status to 'converted'

**Convert to Scope Logic**:
```javascript
1. Group line items by "Category › Subcategory"
2. For each category:
   - Find or create scope_category
3. For each subcategory:
   - Find or create scope_subcategory
4. For each line item:
   - Create scope_item with:
     - description: item.description
     - notes: "From estimate: {name}\nQuantity: {qty} {unit}\nUnit Price: ${price}\nTotal: ${total}"
     - estimated_hours: item.labor_hours (if present)
     - status: 'pending'
5. Update estimate.status = 'converted'
```

#### **TaskDetailDialog.jsx**
**Purpose**: Full task editor with materials, tools, checklist, photos

**Features**:
- Edit all task fields (description, notes, status, priority, assignee, location, due date, duration)
- Manage materials list
- Manage tools list
- Manage checklist items (with toggle completion)
- Upload photos (before/during/after)
- Assign to team members

**Data Flow**:
```
projectsApi.getScopeItemDetails(itemId)
  → scopeRepo.getScopeItemDetails(itemId)
  → Returns: {
      materials: [...],
      tools: [...],
      checklist: [...],
      photos: [...],
      projectMembers: [...],
      category: "Drywall and Paint",
      subcategory: "Drywall - Walls"
    }
```

### Backend API Structure

#### **routes/projects.js**
All project-related endpoints (RESTful design)

**Projects**:
- `GET /api/projects` - List all projects (filtered by user membership)
- `GET /api/projects/:id` - Get single project
- `GET /api/projects/:id/scope` - Get project with full scope hierarchy
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Soft delete project

**Scope Categories**:
- `POST /api/projects/:projectId/categories` - Create category
- `POST /api/projects/categories/:categoryId/subcategories` - Create subcategory

**Scope Items (Tasks)**:
- `GET /api/projects/:projectId/items` - Get all tasks for project
- `GET /api/projects/items/:itemId` - Get single task
- `GET /api/projects/items/:itemId/details` - Get task with materials/tools/checklist/photos
- `POST /api/projects/subcategories/:subcategoryId/items` - Create task
- `PUT /api/projects/items/:itemId` - Update task
- `DELETE /api/projects/items/:itemId` - Delete task

**Time Tracking**:
- `GET /api/projects/:projectId/time-entries` - Get all time entries
- `GET /api/projects/time-entries/active/:workerName` - Get active timer
- `POST /api/projects/items/:itemId/time-entries` - Start timer
- `POST /api/projects/time-entries/:entryId/stop` - Stop timer
- `PUT /api/projects/time-entries/:entryId` - Update entry
- `DELETE /api/projects/time-entries/:entryId` - Delete entry

**Estimates**:
- `GET /api/projects/:projectId/estimates` - List estimates
- `GET /api/projects/estimates/:estimateId` - Get single estimate
- `POST /api/projects/:projectId/estimates` - Create estimate
- `PUT /api/projects/estimates/:estimateId` - Update estimate
- `DELETE /api/projects/estimates/:estimateId` - Delete estimate

**Estimate Line Items**:
- `POST /api/projects/estimates/:estimateId/line-items` - Create line item
- `PUT /api/projects/line-items/:lineItemId` - Update line item
- `DELETE /api/projects/line-items/:lineItemId` - Delete line item

**Project Members**:
- `GET /api/projects/:projectId/members` - List members
- `POST /api/projects/:projectId/members` - Add member
- `PUT /api/projects/members/:memberId/role` - Update role
- `DELETE /api/projects/members/:memberId` - Remove member

**Workers**:
- `GET /api/projects/workers` - Get active workers

**Checklist Toggle**:
- `POST /api/projects/checklist/:checklistItemId/toggle` - Toggle checklist item completion

---

## Data Flow Patterns

### 1. **Loading a Project with Scope**
```
User navigates to project
  → ProjectDetailNew.jsx componentDidMount
  → projectsApi.getProjectWithScope(projectId)
  → GET /api/projects/:id/scope
  → projectsRepo.getProjectWithScope(projectId)
    → Fetches project
    → Fetches all categories (ordered by display_order)
    → Fetches all subcategories for those categories
    → Fetches all items for those subcategories
    → Organizes into hierarchy: project → categories[] → subcategories[] → items[]
  → Returns to frontend
  → TaskTrackerModule renders with nested map:
      categories.map(cat =>
        cat.subcategories.map(sub =>
          sub.items.map(item => <TaskRow />)))
```

### 2. **Creating a Task**
```
User clicks "Add New Task"
  → AddTaskDialog opens
  → User selects category (dropdown)
  → Subcategories filter based on category (cascading)
  → User selects subcategory, enters description
  → projectsApi.createScopeItem(subcategoryId, { description, ... })
  → POST /api/projects/subcategories/:subcategoryId/items
  → scopeRepo.createScopeItem({ subcategory_id, description, ... })
  → INSERT INTO scope_items
  → Returns created item
  → window.location.reload() to refresh UI
```

### 3. **Editing Task Details**
```
User clicks task in TaskTrackerModule
  → setSelectedTask(item)
  → setIsTaskDialogOpen(true)
  → TaskDetailDialog renders
  → useEffect calls projectsApi.getScopeItemDetails(item.id)
  → GET /api/projects/items/:itemId/details
  → scopeRepo.getScopeItemDetails(itemId)
    → Fetches item with category/subcategory info
    → Fetches projectMembers (for assignee dropdown)
    → Fetches materials, tools, checklist, photos in parallel
  → Returns { materials, tools, checklist, photos, projectMembers }
  → Dialog shows all tabs (Details, Materials, Tools, Checklist, Photos)
  → User edits and clicks Save
  → projectsApi.updateScopeItem(itemId, updates)
  → PUT /api/projects/items/:itemId
  → scopeRepo.updateScopeItem(itemId, updates)
    → If status changed to 'completed', adds completed_at timestamp
  → window.location.reload()
```

### 4. **Converting Estimate to Scope**
```
User creates estimate with line items
  → EstimateModule state: selectedEstimate with line_items[]
  → User clicks "Convert to Scope"
  → handleConvertToScope() runs:
    1. Group line items by category (split "Category › Subcategory" string)
    2. For each unique category:
       - projectsApi.getProjectWithScope(projectId) to get existing categories
       - Check if category exists, if not: projectsApi.createCategory(projectId, { name })
    3. For each subcategory:
       - Check if subcategory exists under category, if not: projectsApi.createSubcategory(categoryId, { name })
    4. For each line item:
       - projectsApi.createScopeItem(subcategoryId, {
           description: item.description,
           notes: "From estimate: {name}\n...",
           estimated_hours: item.labor_hours,
           status: 'pending'
         })
    5. projectsApi.updateEstimate(estimateId, { status: 'converted' })
  → User sees alert: "Successfully converted X line items to project scope!"
  → Navigate to Task Tracker to see new tasks
```

---

## Key Business Logic

### **Auto-Calculated Fields**

1. **scope_items.actual_hours**
   - Automatically recalculated when time_entries are inserted/updated/deleted
   - Trigger: `update_scope_item_actual_hours()`
   - Formula: `SUM(time_entries.duration_minutes) / 60.0`

2. **time_entries.duration_minutes**
   - Calculated when end_time is set
   - Formula: `(end_time - start_time) in minutes`

3. **estimate_line_items total**
   - Frontend calculation only (not stored)
   - Formula: `quantity * unit_price`

### **Status Workflow**

**scope_items.status**:
- `pending` → `in_progress` → `completed`
- Can also go to `cancelled` from any state
- When set to `completed`, `completed_at` timestamp is added

**estimates.status**:
- `draft` → `sent` → `approved`/`rejected`
- `converted` (after converting to scope)

### **Priority System** (Todoist-style)
- `1` = Urgent (red)
- `2` = High (orange)
- `3` = Medium (yellow)
- `4` = Normal (default, white)

### **Row Level Security (RLS)**

All tables have RLS enabled with policies like:
```sql
-- Example: Users can only see projects they're members of
CREATE POLICY "Users can view estimates for their projects"
  ON estimates FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );
```

---

## Current TODOs & Known Gaps

### **Missing/Incomplete Features**

1. **Nested Tasks (Subtasks)**
   - `scope_items.parent_task_id` field exists but not used in UI
   - No visual hierarchy for parent/child tasks
   - No indentation or nesting in TaskTrackerModule

2. **Recurring Tasks**
   - `is_recurring` and `recurrence_pattern` fields exist but not implemented
   - No logic to auto-create recurring task instances

3. **Labels/Tags**
   - `labels TEXT[]` field exists but no UI to add/edit/filter by labels

4. **Task Sections**
   - `task_sections` table exists but not used
   - Could be used for Kanban-style columns or project phases

5. **Reminders**
   - `reminder_date` field exists but no notification system

6. **Estimate Templates**
   - Template library UI exists (EstimateModule) but no backend templates

7. **Photo Upload**
   - TaskDetailDialog has Photos tab but no actual upload functionality
   - Would need Supabase Storage integration

8. **Comments**
   - `scope_item_comments` table exists but no UI for it

9. **Analytics/Reports**
   - AnalyticsModule placeholder exists but empty
   - Could show: time vs estimate, budget tracking, completion rates

10. **Calendar View**
    - ScheduleModule placeholder exists
    - Could integrate `due_date` and `reminder_date` fields

### **Data Model Concerns**

1. **estimate_line_items.category**
   - Currently stored as string "Category › Subcategory"
   - No referential integrity to actual categories
   - Could cause sync issues if categories are renamed

2. **scope_items has too many fields**
   - Mix of core fields, Todoist-style fields, template links
   - May benefit from normalization (e.g., separate task_metadata table)

3. **No project templates**
   - `category_templates` and `subcategory_templates` exist
   - But no way to bootstrap a new project from a template
   - Each project starts empty

4. **No budget tracking**
   - `projects.budget` field exists but no expense tracking
   - No way to compare actual costs vs budget

5. **Time entries use worker_name (string)**
   - Should reference `workers.id` or `auth.users.id`
   - Current implementation is error-prone

---

## Nested Loop Architecture Design Needed

### **Problem Statement**
Currently, the task management system is **flat hierarchical**:
```
Project → Category → Subcategory → Task
```

For complex construction projects, we need **nested loops** to handle:
- **Phases** (e.g., "Phase 1: Foundation", "Phase 2: Framing")
- **Iterations** (e.g., "First Floor", "Second Floor", "Third Floor")
- **Rooms/Areas** (e.g., "Living Room", "Kitchen", "Bathroom 1")
- **Task Repetition** (e.g., "Install outlet" × 20 rooms)

### **Desired Architecture**
```
Project
  └── Phase (e.g., "Framing Phase")
      └── Loop Context (e.g., "Per Floor")
          └── Loop Iteration (e.g., "First Floor")
              └── Category (e.g., "Framing - Structural")
                  └── Subcategory (e.g., "Wall Framing")
                      └── Loop Context (e.g., "Per Room")
                          └── Loop Iteration (e.g., "Living Room")
                              └── Task Template (e.g., "Install 2x4 studs")
                                  └── Task Instance (actual work item)
```

### **Key Questions for Design**

1. **Loop Definition**:
   - How do we define loop contexts? (e.g., "Per Floor", "Per Room", "Per Unit")
   - Should loops be hierarchical? (e.g., Building → Floor → Room)

2. **Task Templates vs Instances**:
   - Should we separate task templates from instances?
   - How do we handle modifications to a task instance without affecting the template?

3. **Scope Propagation**:
   - If we add a new room mid-project, how do we auto-generate all applicable tasks for that room?
   - How do we handle partial completion (e.g., some rooms done, others not)?

4. **Filtering & Views**:
   - How do users filter tasks by loop iteration (e.g., "show all tasks for 2nd floor")?
   - Should we have a matrix view (rows=tasks, columns=rooms)?

5. **Database Schema**:
   - Do we add new tables (e.g., `project_phases`, `loop_contexts`, `loop_iterations`, `task_templates`, `task_instances`)?
   - Or do we use JSON fields to store loop metadata?

6. **Migration Path**:
   - How do we migrate existing flat tasks to the new nested system?
   - Can old and new systems coexist during transition?

---

## Example Use Cases for Nested Loops

### **Use Case 1: Multi-Floor Building**
```
Project: 222 Whitney Renovation
  Phase: Framing
    Loop: Floors (1st, 2nd, 3rd)
      Category: Framing - Structural
        Task Template: "Frame exterior walls"
          → 1st Floor: Frame exterior walls [pending]
          → 2nd Floor: Frame exterior walls [completed]
          → 3rd Floor: Frame exterior walls [in_progress]
```

### **Use Case 2: Repeated Rooms**
```
Project: Apartment Complex
  Phase: Finish Work
    Loop: Units (Unit 1A, 1B, 1C, 2A, 2B, 2C)
      Loop: Rooms (Living Room, Kitchen, Bedroom 1, Bedroom 2, Bathroom)
        Category: Flooring
          Task Template: "Install laminate flooring"
            → Unit 1A / Living Room: Install laminate [completed]
            → Unit 1A / Kitchen: Install laminate [in_progress]
            → Unit 1A / Bedroom 1: Install laminate [pending]
            → Unit 1B / Living Room: Install laminate [pending]
            ...
```

### **Use Case 3: Per-Room Outlets**
```
Project: House Renovation
  Phase: Electrical
    Loop: Rooms (12 rooms)
      Category: Electrical
        Task Template: "Install outlets (4 per room)"
          → Living Room: Install outlets [completed]
          → Kitchen: Install outlets [in_progress]
          → Master Bedroom: Install outlets [pending]
          ...
```

---

## Repository Patterns

### **Current Pattern** (projects, scope, estimates, timeEntries repos)

```javascript
// Example: scopeRepo.js

export const createScopeItem = async (itemData) => {
  const { data, error } = await supabase
    .from('scope_items')
    .insert(itemData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getScopeItemDetails = async (itemId) => {
  // Fetch item with nested relations
  const { data, error } = await supabase
    .from('scope_items')
    .select(`
      *,
      subcategory:scope_subcategories!inner(
        id, name,
        category:scope_categories!inner(id, name, project_id)
      )
    `)
    .eq('id', itemId)
    .single()

  if (error) throw error

  // Fetch related details in parallel
  const [materials, tools, checklist, photos] = await Promise.all([
    getScopeItemMaterials(itemId),
    getScopeItemTools(itemId),
    getScopeItemChecklist(itemId),
    getScopeItemPhotos(itemId)
  ])

  return { ...data, materials, tools, checklist, photos }
}
```

**Key Principles**:
1. **Separation of Concerns**: Repos handle data access, routes handle HTTP, services handle business logic
2. **Error Propagation**: Repos throw errors, routes catch and format them
3. **Nested Queries**: Use Supabase's select syntax for joins
4. **Parallel Fetching**: Use Promise.all for independent queries
5. **Auto-timestamps**: Triggers handle `updated_at`, repos don't need to set it manually

---

## Frontend State Management

**Pattern**: Local component state with React hooks

```javascript
// Example from TaskTrackerModule.jsx

const [filteredProject, setFilteredProject] = useState(null)
const [filters, setFilters] = useState({
  search: '',
  category: '',
  assignee: '',
  dueDate: '',
  duration: '',
  location: ''
})
const [hideCompleted, setHideCompleted] = useState(() => {
  return localStorage.getItem('hideCompleted') === 'true'
})

// Fetch data on mount
useEffect(() => {
  const fetchProject = async () => {
    const data = await projectsApi.getProjectWithScope(projectId)
    setFilteredProject(data)
  }
  fetchProject()
}, [projectId])

// Memoized filtering
const displayedProject = useMemo(() => {
  if (!filteredProject?.categories) return filteredProject

  return {
    ...filteredProject,
    categories: filteredProject.categories
      .map(category => ({
        ...category,
        subcategories: category.subcategories
          .map(sub => ({
            ...sub,
            items: sub.items.filter(item => {
              // Apply all filters
              if (hideCompleted && item.status === 'completed') return false
              if (filters.search && !item.description.includes(filters.search)) return false
              // ... more filters
              return true
            })
          }))
          .filter(sub => sub.items.length > 0)
      }))
      .filter(cat => cat.subcategories.length > 0)
  }
}, [filteredProject, filters, hideCompleted])
```

**No global state management** (Redux, Zustand, etc.) - keeps things simple for now.

---

## API Service Layer

**Pattern**: Centralized API calls with consistent error handling

```javascript
// client/src/services/projectsApi.js

import api from './api'  // Axios instance with baseURL configured

export const getProjectWithScope = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/scope`)
  return response.data.data  // Unwrap { data: ... } envelope
}

export const createScopeItem = async (subcategoryId, itemData) => {
  const response = await api.post(`/projects/subcategories/${subcategoryId}/items`, itemData)
  return response.data.data
}

export const updateScopeItem = async (itemId, updates) => {
  const response = await api.put(`/projects/items/${itemId}`, updates)
  return response.data.data
}
```

**Response Format**:
```javascript
// Success
{ data: { ... } }

// Error
{ error: "Error message" }
```

---

## Styling & UI Patterns

### **Design System**

**Colors** (from design-tokens.js):
```javascript
export const colors = {
  primary: '#3B82F6',     // Blue
  success: '#10B981',     // Green
  warning: '#F59E0B',     // Orange
  danger: '#EF4444',      // Red
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    500: '#6B7280',
    700: '#374151',
    900: '#111827'
  }
}
```

**Component Library**:
- `ModernCard` - Wrapper with shadow, border-radius, padding
- `Button` - Variants: default, outline, ghost

**Responsive Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Common Patterns**:
```jsx
// Category header (gradient)
<div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-t-lg border-b border-blue-200">
  <h2 className="text-lg font-bold">{category.name}</h2>
</div>

// Status badge
<span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
  Completed
</span>

// Filter dropdown
<select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
  <option value="">All Categories</option>
  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
</select>
```

---

## Environment & Configuration

### **.env** (server)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5000
```

### **Supabase Client** (server/src/utils/supabase.js)
```javascript
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default supabase
```

**Important**: Uses **service role key** on server to bypass RLS for admin operations.

---

## Testing Status

**Current State**: ❌ No automated tests

**Needed**:
- Unit tests for repositories (scopeRepo, projectsRepo, estimatesRepo)
- Integration tests for API endpoints
- Frontend component tests (React Testing Library)
- E2E tests (Playwright/Cypress)

---

## Deployment

**Current Setup**:
- Frontend: Likely Vercel or Netlify (not specified in code)
- Backend: Likely Railway or Render (not specified)
- Database: Supabase (PostgreSQL)

**Migration Process**:
```bash
# Run migrations manually via Supabase SQL editor or:
node server/migrations/run-migration.js <migration-file.sql>
```

---

## Performance Considerations

1. **Indexes**: All foreign keys and commonly queried fields have indexes
2. **Eager Loading**: Use Supabase's nested select to avoid N+1 queries
3. **Pagination**: ⚠️ Not implemented yet - all tasks loaded at once
4. **Memoization**: useMemo for expensive filtering operations
5. **Optimistic Updates**: ⚠️ Not implemented - uses window.location.reload() after mutations

---

## Security

### **Authentication**
- Supabase Auth with JWT tokens
- Middleware: `auth.js` verifies tokens on protected routes

### **Authorization**
- Row Level Security (RLS) on all tables
- Policies check project_members for access
- Service role key used on backend for admin operations

### **Input Validation**
- Joi schemas in validation.js middleware
- SQL injection protection via Supabase parameterized queries

### **Known Vulnerabilities**
- ⚠️ No rate limiting on estimate conversion (could spam scope items)
- ⚠️ No file size limits on photo uploads
- ⚠️ No CSRF protection

---

## Next Steps for Nested Loop Architecture

### **Recommended Approach**

1. **Design Loop Schema**:
   - Create `project_loops` table (e.g., "Floors", "Units", "Rooms")
   - Create `loop_iterations` table (e.g., "1st Floor", "2nd Floor")
   - Create `task_templates` table (reusable task definitions)
   - Create `task_instances` table (actual work items linked to loops)

2. **Maintain Backward Compatibility**:
   - Keep existing `scope_items` for non-looped tasks
   - Add `is_template` flag to distinguish templates from instances
   - Add `template_id` foreign key to link instances to templates

3. **UI Updates**:
   - Add loop management interface
   - Add matrix view (tasks × loop iterations)
   - Add bulk actions (e.g., "Mark all living room tasks as complete")

4. **Migration Strategy**:
   - Create new tables alongside existing ones
   - Add feature flag to toggle between old/new UI
   - Gradually migrate projects to new system

---

## Questions for Design Discussion

1. Should loops be **project-level** (defined once per project) or **category-level** (each category can have different loops)?

2. How do we handle **cross-cutting tasks** that don't fit a loop? (e.g., "Order materials for entire project")

3. Should **task instances inherit** all template properties, or can they diverge?

4. How do we visualize **progress across loops**? (e.g., "Framing is 80% done across all floors")

5. Do we need **dependencies between loop iterations**? (e.g., "Can't start 2nd floor framing until 1st floor is complete")

6. How do we handle **partial loops**? (e.g., "3 bedrooms on 1st floor, 2 bedrooms on 2nd floor")

---

## Contact & Collaboration

This project is being actively developed for **Nathan Montgomery** (contractor).

For questions about the nested loop architecture, please reference:
- This document (BUILDZ_CONTEXT.md)
- Database schema files (server/migrations/*.sql)
- Current implementations (client/src/components/Projects/modules/*.jsx)

**Key Stakeholders**:
- Nathan (General Contractor, Owner)
- Nishant (General Contractor)
