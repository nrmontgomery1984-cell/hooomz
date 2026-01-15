# Hooomz Web App - Quick Start

## Get Running in 3 Steps

### 1. Install Dependencies

```bash
# From monorepo root
cd /path/to/hooomz
npm install
```

### 2. Build All Packages

```bash
# Build all @hooomz packages
npm run build
```

### 3. Start Development Server

```bash
# Start the web app
cd apps/web
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## What You'll See

### Home Page (/)
- Welcome message
- Quick stats (Active Projects, This Week)
- 6 module cards for quick access
- Online/offline indicator

### Navigation
Horizontal scrolling navigation with 7 sections:
- 📊 Dashboard (home)
- 🏗️ Projects
- 👥 Customers
- 💰 Estimates
- 📅 Schedule
- 📋 Field Docs
- 📈 Reports

### All Pages
Each page has:
- Mobile-optimized layout
- Large touch targets (44px minimum)
- Placeholder content
- Module integration notes

---

## Mobile Testing

### Desktop Browser
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select iPhone or Android device
4. Test touch interactions

### Physical Device
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start dev server: `npm run dev`
3. Open on phone: `http://YOUR_IP:3000`
4. Test with actual touch/gloves

---

## Project Structure at a Glance

```
src/
├── app/                  # Pages (App Router)
│   ├── layout.tsx        # Root layout + nav
│   ├── page.tsx          # Home page
│   ├── projects/         # /projects
│   ├── customers/        # /customers
│   ├── estimates/        # /estimates
│   ├── schedule/         # /schedule
│   ├── field/            # /field
│   └── reports/          # /reports
│
├── components/
│   └── ui/               # Reusable components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Navigation.tsx
│       └── PageHeader.tsx
│
└── lib/
    ├── repositories/     # Data access layer
    └── services/         # Service layer
```

---

## Using Services in Pages

```typescript
// Example: Get projects
import { getProjectService } from '@/lib/services';

export default async function ProjectsPage() {
  const projectService = getProjectService();
  const result = await projectService.getAllProjects();
  const projects = result.data || [];

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

---

## Tailwind Utilities

### Buttons
```tsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-accent">Accent Action</button>
```

### Cards
```tsx
<div className="card">Static Card</div>
<div className="card-interactive">Clickable Card</div>
```

### Form Inputs
```tsx
<input className="input-touch" type="text" />
```

### Navigation Items
```tsx
<div className="nav-item">Navigation Item</div>
<div className="nav-item-active">Active Item</div>
```

---

## Common Tasks

### Add a New Page

1. Create file: `src/app/my-page/page.tsx`
2. Export default component
3. Add to navigation in `src/components/ui/Navigation.tsx`

### Add a New Component

1. Create file: `src/components/ui/MyComponent.tsx`
2. Export from `src/components/ui/index.ts`
3. Import and use: `import { MyComponent } from '@/components/ui'`

### Connect to a Service

1. Import service: `import { getProjectService } from '@/lib/services'`
2. Get instance: `const service = getProjectService()`
3. Call methods: `const result = await service.getAllProjects()`
4. Handle response: `const data = result.data || []`

---

## Module Integration

All @hooomz packages are already imported:

```typescript
// Available services:
import {
  getProjectService,      // @hooomz/core
  getCustomerService,     // @hooomz/customers
  getEstimateService,     // @hooomz/estimating
  getScheduleService,     // @hooomz/scheduling
  getTaskService,         // @hooomz/scheduling
  getInspectionService,   // @hooomz/field-docs
  getPhotoService,        // @hooomz/field-docs
  getChecklistService,    // @hooomz/field-docs
  getDashboardService,    // @hooomz/reporting
  getReportService,       // @hooomz/reporting
  getExportService,       // @hooomz/reporting
} from '@/lib/services';
```

---

## Next Steps

### 1. Implement Features
Choose a module and implement its features:
- Projects: CRUD operations, status management
- Customers: Contact management, project history
- Estimates: Line items, calculations, approvals
- Schedule: Task creation, calendar view, assignments
- Field: Photo upload, checklists, inspections
- Reports: Dashboard views, report generation, exports

### 2. Add Database
Replace in-memory repositories:
- Choose database (PostgreSQL, MySQL, MongoDB)
- Update repository implementations
- Add database connection in `src/lib/db/`
- Run migrations

### 3. Enable Offline
Implement service worker:
- Create service worker file
- Cache static assets
- Queue offline actions
- Background sync for uploads

### 4. Add Authentication
Implement user auth:
- Choose auth provider (NextAuth, Clerk, etc.)
- Add login/signup pages
- Protect routes
- Store user session

---

## Troubleshooting

### TypeScript Errors
```bash
# Rebuild packages
cd ../../  # Go to monorepo root
npm run build

# Clear Next.js cache
cd apps/web
rm -rf .next
npm run dev
```

### Missing Dependencies
```bash
# Reinstall
npm install

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# Use different port
npm run dev -- -p 3001
```

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 🎉 You're Ready!

The app is set up and running. Start by exploring the existing pages, then begin implementing features for your chosen module.

**Happy coding!** 🚀
