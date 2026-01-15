# Hooomz Web Application

Mobile-first construction management platform built with Next.js 14+ App Router.

## Overview

The web application provides a mobile-optimized interface for construction contractors to manage projects, customers, estimates, schedules, field documentation, and reporting. Designed specifically for use on job sites with large touch targets for gloved hands and offline-capable architecture.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS 3.4+
- **Package Manager**: npm workspaces (monorepo)

## Features

### Mobile-First Design
- **Large Touch Targets**: Minimum 44px touch targets (iOS standard)
- **Glove-Friendly UI**: Extra spacing and larger interactive elements
- **Responsive Layout**: Optimized for mobile, tablet, and desktop
- **Safe Area Support**: iOS safe area insets for notch/home indicator

### Offline-Capable Architecture
- Service worker ready (to be implemented)
- Local storage for offline data
- Sync indicators and status
- Optimistic UI updates

### Module Integration
Integrates all @hooomz packages:
- `@hooomz/core` - Project management
- `@hooomz/customers` - Customer management
- `@hooomz/estimating` - Cost estimation
- `@hooomz/scheduling` - Task and timeline management
- `@hooomz/field-docs` - Inspections, photos, checklists
- `@hooomz/reporting` - Analytics and report generation

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with navigation
│   │   ├── page.tsx            # Home/dashboard page
│   │   ├── projects/           # Project management
│   │   ├── customers/          # Customer management
│   │   ├── estimates/          # Cost estimation
│   │   ├── schedule/           # Task scheduling
│   │   ├── field/              # Field documentation
│   │   └── reports/            # Reporting and analytics
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── PageHeader.tsx
│   │   └── features/           # Feature-specific components
│   ├── lib/
│   │   ├── repositories/       # Concrete repository implementations
│   │   │   ├── project.repository.ts
│   │   │   └── customer.repository.ts
│   │   ├── services/           # Service instantiation with DI
│   │   │   └── index.ts
│   │   └── db/                 # Database connection (to be implemented)
│   └── hooks/                  # React hooks
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- All @hooomz packages built

### Installation

From the monorepo root:

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development server
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type check
npm run lint

# Clean build artifacts
npm run clean
```

## Design System

### Colors

**Primary** (Blue): Used for primary actions and navigation
- `primary-600`: `#0284c7` - Main brand color
- Light variants: 50-500
- Dark variants: 700-900

**Accent** (Orange/Yellow): Used for highlights and construction themes
- `accent-500`: `#d97706`
- Light variants: 50-400
- Dark variants: 600-900

### Touch-Friendly Components

All interactive elements follow mobile-first design principles:

#### Buttons
```tsx
<button className="btn-primary">
  Large Touch Target
</button>

<button className="btn-secondary">
  Secondary Action
</button>

<button className="btn-accent">
  Accent Action
</button>
```

#### Form Inputs
```tsx
<input className="input-touch" type="text" />
```

#### Navigation
```tsx
<div className="nav-item">
  Navigation Item
</div>

<div className="nav-item-active">
  Active Navigation Item
</div>
```

#### Cards
```tsx
<div className="card">
  Static Card
</div>

<div className="card-interactive">
  Interactive Card
</div>
```

### Spacing

Custom spacing for field use:
- `touch`: 44px - Minimum touch target
- `touch-lg`: 56px - Large touch target

## Routing

### Pages

| Route | Module | Description |
|-------|--------|-------------|
| `/` | Dashboard | Home page with quick access |
| `/projects` | @hooomz/core | Project management |
| `/customers` | @hooomz/customers | Customer management |
| `/estimates` | @hooomz/estimating | Cost estimation |
| `/schedule` | @hooomz/scheduling | Task scheduling |
| `/field` | @hooomz/field-docs | Field documentation |
| `/reports` | @hooomz/reporting | Reports and analytics |

## Dependency Injection

Services are instantiated with concrete repository implementations through the service layer:

```typescript
import { getProjectService, getCustomerService } from '@/lib/services';

// Get service instance with injected dependencies
const projectService = getProjectService();
const customerService = getCustomerService();

// Use service methods
const projects = await projectService.getAllProjects();
const customers = await customerService.getAllCustomers();
```

## Repository Implementation

Concrete repository implementations connect to data storage (currently in-memory for demo):

```typescript
// apps/web/src/lib/repositories/project.repository.ts
export class ProjectRepository implements IProjectRepository {
  // Implements all IProjectRepository methods
  // Currently uses in-memory storage
  // In production, would connect to database
}
```

## Progressive Web App (PWA)

The app is designed to be PWA-ready:

### Manifest
- `themeColor`: `#0284c7`
- `appleWebApp.capable`: true
- Touch icons configured

### Service Worker (To Be Implemented)
- Cache static assets
- Offline API responses
- Background sync for uploads

### Offline Indicators
- Online/offline status display
- Sync status for photos and checklists
- Pending uploads counter

## Mobile Optimization

### Touch Targets
- Minimum 44px (iOS standard)
- Extra padding for gloved hands
- Large buttons and form inputs

### Viewport
- Mobile-first responsive design
- Safe area insets for iOS notch
- Prevents zoom on input focus

### Performance
- Lazy loading for images
- Route-based code splitting
- Optimized bundle size

## Integration Points

### Core Module Integration
```typescript
// Example: Projects page
import { getProjectService } from '@/lib/services';

export default async function ProjectsPage() {
  const projectService = getProjectService();
  const result = await projectService.getAllProjects();
  const projects = result.data || [];

  return (/* render projects */);
}
```

### Field Docs Offline Sync
```typescript
// Example: Photos with offline support
import { getPhotoService } from '@/lib/services';

const photoService = getPhotoService();

// Add photo (works offline)
await photoService.addPhoto(projectId, filePath, metadata);

// Get unsynced photos
const unsynced = await photoService.getUnsyncedPhotos();

// Mark as uploaded when online
await photoService.markAsUploaded(photoId);
```

## Current Status

### ✅ Completed
- Next.js 14+ App Router setup
- Tailwind CSS configuration with construction theme
- Mobile-first responsive layouts
- Touch-friendly component library
- Navigation between all sections
- Route pages for all modules
- Repository pattern implementation
- Service layer with dependency injection

### 🚧 To Be Implemented
- Feature implementations for each module
- Database connection and persistence
- Service worker for offline support
- Authentication and authorization
- Photo upload and processing
- PDF generation for reports
- Email integration for reports
- Real-time updates via WebSockets
- Data caching and optimization

## Development Guidelines

### Component Creation
1. Use functional components with TypeScript
2. Follow mobile-first design principles
3. Use Tailwind utility classes
4. Ensure 44px minimum touch targets
5. Test on mobile devices

### Service Integration
1. Import services from `@/lib/services`
2. Use async/await with proper error handling
3. Handle loading and error states
4. Show offline indicators when appropriate

### Repository Implementation
1. Implement interface from module packages
2. Use `ApiResponse<T>` return type
3. Handle errors with `createErrorResponse`
4. Add proper TypeScript types

## Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   - Import project in Vercel dashboard
   - Select `apps/web` as root directory

2. **Configure Build**:
   ```bash
   Build Command: cd ../.. && pnpm install && pnpm build
   Output Directory: .next
   Install Command: pnpm install
   Root Directory: apps/web
   ```

3. **Environment Variables**:
   Add any required environment variables in Vercel dashboard

4. **Deploy**:
   Automatic deployment on push to main branch

### Docker

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t hooomz-web .
docker run -p 3000:3000 hooomz-web
```

### Static Export

For static hosting (GitHub Pages, S3, etc.):

```javascript
// next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};
```

```bash
pnpm build
# Outputs to 'out/' directory
```

**Note**: Static export has limitations:
- No server-side rendering
- No API routes
- No dynamic routes without pre-generation
- No Image Optimization API

### Environment Variables

Create `.env.local` for local development:

```bash
# Future: API Configuration
# NEXT_PUBLIC_API_URL=https://api.hooomz.com
# NEXT_PUBLIC_API_KEY=your_api_key

# Future: Authentication
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your_secret_here
# NEXTAUTH_PROVIDERS=google,github

# Future: File Storage
# NEXT_PUBLIC_STORAGE_URL=https://storage.hooomz.com
# STORAGE_BUCKET=hooomz-photos

# Future: Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Important**: Never commit `.env.local` to version control.

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
pnpm add @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // config
});
```

```bash
ANALYZE=true pnpm build
```

### Image Optimization

```typescript
import Image from 'next/image';

// Optimized image loading
<Image
  src="/photo.jpg"
  alt="Project photo"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false,
});
```

## Monitoring and Debugging

### Logging

```typescript
// Development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Production: Use error tracking service
try {
  await service.method();
} catch (error) {
  console.error('Service error:', error);
  // Future: Send to error tracking service
  // Sentry.captureException(error);
}
```

### Error Boundaries

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Troubleshooting

### Build Fails

**Issue**: Package dependencies not built
```bash
# Solution: Build all packages first
cd ../..
pnpm build
```

### Type Errors

**Issue**: Cannot find types from packages
```bash
# Solution: Rebuild shared-contracts
pnpm build:shared
pnpm build
```

### IndexedDB Errors

**Issue**: "IndexedDB is not defined"
**Solution**: Add `'use client'` to components using IndexedDB

### Styles Not Loading

**Issue**: Tailwind classes not applying
**Solution**: Check `tailwind.config.js` content paths:
```javascript
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
],
```

## Browser Support

- Chrome 90+
- Safari 14+ (iOS 14+)
- Firefox 88+
- Edge 90+

## Related Documentation

- 📐 [Architecture](../../ARCHITECTURE.md) - System design and patterns
- 📘 [Getting Started](../../GETTING_STARTED.md) - Setup instructions
- ➕ [Adding Modules](../../ADDING_MODULES.md) - Creating new features
- 🔧 [Build System](../../BUILD_SYSTEM.md) - Build and CI/CD
- 🧪 [Testing Guide](../../tests/README.md) - Testing strategy

## License

MIT
