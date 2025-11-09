# UI Wireframes & Design System

## Design Philosophy

- **Clean and minimal** - Avoid clutter
- **Trade-focused** - Designed for contractors' real-world use
- **Mobile-first** - Responsive by default
- **Accessibility** - WCAG 2.1 AA compliance

## Color Palette

### Primary Colors
- **Primary Blue**: `#0284c7` - CTAs, links, active states
- **Primary Dark**: `#0369a1` - Hover states
- **Primary Light**: `#e0f2fe` - Backgrounds, highlights

### Neutral Colors
- **Gray 900**: `#111827` - Headings
- **Gray 700**: `#374151` - Body text
- **Gray 500**: `#6b7280` - Secondary text
- **Gray 300**: `#d1d5db` - Borders
- **Gray 100**: `#f3f4f6` - Backgrounds

### Semantic Colors
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Info**: `#3b82f6` (Blue)

## Typography

- **Headings**: Inter (Bold)
  - H1: 3rem (48px)
  - H2: 2.25rem (36px)
  - H3: 1.875rem (30px)
  - H4: 1.5rem (24px)

- **Body**: Inter (Regular)
  - Base: 1rem (16px)
  - Small: 0.875rem (14px)
  - Tiny: 0.75rem (12px)

## Components

### Card
```jsx
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```
- White background
- 8px border radius
- Box shadow for depth
- 24px padding

### Button
```jsx
<Button variant="primary">Click Me</Button>
```
Variants:
- `primary` - Blue, for main actions
- `secondary` - Gray, for secondary actions
- `danger` - Red, for destructive actions
- `ghost` - Transparent, for tertiary actions

Sizes:
- `sm` - 32px height
- `md` - 40px height (default)
- `lg` - 48px height

### Modal
```jsx
<Modal isOpen={true} onClose={handleClose} title="Modal Title">
  Modal content
</Modal>
```
- Centered overlay
- ESC to close
- Click outside to close
- Smooth fade-in animation

### FileUpload
```jsx
<FileUpload
  onFileSelect={handleFiles}
  multiple={true}
  accept="image/*"
/>
```
- Drag-and-drop support
- File preview thumbnails
- Size validation
- Type validation

### Dropdown
```jsx
<Dropdown
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]}
  value={selected}
  onChange={setSelected}
/>
```

## Page Layouts

### Dashboard
```
┌─────────────────────────────────────────┐
│  Header (Nav + User)                    │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │  My Homes                       │    │
│  │  [+ Add Home]                   │    │
│  └─────────────────────────────────┘    │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ Home │  │ Home │  │ Home │          │
│  │  #1  │  │  #2  │  │  #3  │          │
│  └──────┘  └──────┘  └──────┘          │
└─────────────────────────────────────────┘
```

### Home Profile
```
┌─────────────────────────────────────────┐
│  Header (Back + Home Address)           │
├─────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │Rooms │  │Mater │  │Syst. │          │
│  └──────┘  └──────┘  └──────┘          │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ Docs │  │Maint │  │Share │          │
│  └──────┘  └──────┘  └──────┘          │
└─────────────────────────────────────────┘
```

### Materials List
```
┌─────────────────────────────────────────┐
│  Materials          [+ Add Material]    │
├─────────────────────────────────────────┤
│  [Filter] [Sort]                        │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ Flooring - Master Bedroom       │    │
│  │ Armstrong Luxe Plank            │    │
│  │ Color: Silver Chalice           │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Paint - Living Room             │    │
│  │ Benjamin Moore                  │    │
│  │ Color: Simply White             │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Maintenance Calendar
```
┌─────────────────────────────────────────┐
│  Maintenance        [+ Add Task]        │
├─────────────────────────────────────────┤
│  [List View] [Calendar View]            │
├─────────────────────────────────────────┤
│  Overdue (2)                            │
│  ┌─────────────────────────────────┐    │
│  │ ⚠ Change HVAC filters           │    │
│  │   Due: 3 days ago               │    │
│  │   [Complete]                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Upcoming (5)                           │
│  ┌─────────────────────────────────┐    │
│  │ Test smoke detectors            │    │
│  │   Due: In 2 weeks               │    │
│  │   [Complete]                    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Color contrast ratios meet WCAG AA
- Screen reader friendly

## Icons

Using **Lucide React** for consistent iconography:
- `Home` - Homes
- `DoorOpen` - Rooms
- `Package` - Materials
- `Settings` - Systems
- `FileText` - Documents
- `Wrench` - Maintenance
- `HardHat` - Contractors
- `Building` - Realtors

## Future Enhancements

- Dark mode support
- Custom themes for B2B clients
- Advanced data visualization (charts)
- Interactive home floor plans
- AR overlay designs
