# Hooomz Documentation Index

Complete documentation guide for the Hooomz construction management platform.

## Getting Started

Start here if you're new to the project:

1. **[README.md](README.md)** - Project overview and quick start
2. **[GETTING_STARTED.md](GETTING_STARTED.md)** - Detailed setup instructions
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and patterns

## Core Documentation

### Setup and Configuration

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Complete setup guide
  - Prerequisites and installation
  - First-time setup
  - Daily development workflow
  - Troubleshooting common issues

- **[BUILD_SYSTEM.md](BUILD_SYSTEM.md)** - Build and deployment
  - Build order and dependencies
  - Build scripts usage
  - CI/CD integration
  - Performance tips

- **[.github/README.md](.github/README.md)** - CI/CD documentation
  - GitHub Actions workflows
  - Pre-commit hooks
  - Deployment strategies
  - Cache optimization

### Architecture and Design

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
  - High-level architecture diagram
  - Module structure
  - Data flow patterns
  - Design patterns explained
  - Technology choices
  - Future roadmap

- **[ADDING_MODULES.md](ADDING_MODULES.md)** - Creating new features
  - Step-by-step module creation
  - Example: Inventory module
  - Best practices
  - Common issues and solutions

## Package Documentation

### Foundation Packages

- **[packages/shared-contracts/README.md](packages/shared-contracts/README.md)** - Type system
  - All entity types
  - Validation schemas
  - API contracts
  - Utility functions
  - Constants and enums

### Feature Packages

- **[packages/customers/README.md](packages/customers/README.md)** - Customer management
  - Customer CRUD operations
  - Search and filtering
  - Duplicate detection
  - Contact preferences

- **packages/projects/README.md** - Project management *(placeholder)*
  - Project lifecycle
  - Status tracking
  - Budget management

- **packages/estimating/README.md** - Cost estimation *(placeholder)*
  - Line item management
  - Tax and markup calculations
  - Variance analysis

- **packages/scheduling/README.md** - Task scheduling *(placeholder)*
  - Task dependencies
  - Timeline management
  - Resource allocation

- **packages/field-docs/README.md** - Field documentation *(placeholder)*
  - Inspections and checklists
  - Photo management
  - Offline capabilities

- **packages/reporting/README.md** - Analytics and reports *(placeholder)*
  - Dashboard metrics
  - Financial reports
  - Export capabilities

### Application

- **[apps/web/README.md](apps/web/README.md)** - Web application
  - Running locally
  - Project structure
  - Routing and navigation
  - Component library
  - Deployment options
  - Performance optimization

## Testing

- **[tests/README.md](tests/README.md)** - Testing guide
  - Running tests
  - Test categories
  - Writing new tests
  - Coverage requirements
  - Best practices

## Quick Reference

### Common Commands

```bash
# Setup
pnpm install              # Install dependencies
pnpm build                # Build all packages
node scripts/verify-setup.js  # Verify setup

# Development
pnpm dev                  # Start dev server
pnpm test:watch          # Run tests in watch mode

# Quality
pnpm lint                 # Lint code
pnpm lint:fix            # Fix linting issues
pnpm typecheck           # Type check
pnpm format              # Format code

# CI/CD
pnpm ci                   # Run full CI checks
pnpm clean               # Remove build artifacts
```

### Directory Structure

```
hooomz/
├── README.md                    # Project overview
├── GETTING_STARTED.md          # Setup guide
├── ARCHITECTURE.md             # System architecture
├── BUILD_SYSTEM.md             # Build documentation
├── ADDING_MODULES.md           # Module creation guide
├── DOCUMENTATION_INDEX.md      # This file
│
├── .github/
│   ├── workflows/ci.yml        # CI/CD workflow
│   └── README.md               # CI/CD docs
│
├── packages/
│   ├── shared-contracts/       # Types and contracts
│   ├── db/                     # Database layer
│   ├── ui/                     # UI components
│   ├── customers/              # Customer management
│   ├── projects/               # Project management
│   ├── estimating/             # Cost estimation
│   ├── scheduling/             # Task scheduling
│   ├── field-docs/             # Field documentation
│   └── reporting/              # Analytics
│
├── apps/
│   └── web/                    # Next.js application
│       └── README.md           # Web app docs
│
├── tests/                      # Integration tests
│   └── README.md               # Testing guide
│
└── scripts/                    # Build scripts
    ├── build.js                # Main build script
    └── verify-setup.js         # Setup verification
```

## Documentation by Task

### I want to...

#### ...set up the project for the first time
1. Read [README.md](README.md) for overview
2. Follow [GETTING_STARTED.md](GETTING_STARTED.md)
3. Run `node scripts/verify-setup.js`

#### ...understand the architecture
1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Review [packages/shared-contracts/README.md](packages/shared-contracts/README.md)
3. Check feature package READMEs

#### ...add a new feature
1. Read [ADDING_MODULES.md](ADDING_MODULES.md)
2. Review existing feature package (e.g., [packages/customers/README.md](packages/customers/README.md))
3. Follow the step-by-step guide

#### ...work on the web app
1. Read [apps/web/README.md](apps/web/README.md)
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for patterns
3. Look at existing pages for examples

#### ...write tests
1. Read [tests/README.md](tests/README.md)
2. Check existing test files for patterns
3. Use test fixtures from `tests/fixtures.ts`

#### ...deploy the application
1. Read [apps/web/README.md](apps/web/README.md) - Deployment section
2. Check [BUILD_SYSTEM.md](BUILD_SYSTEM.md)
3. Review [.github/README.md](.github/README.md) for CI/CD

#### ...understand the build system
1. Read [BUILD_SYSTEM.md](BUILD_SYSTEM.md)
2. Check [.github/README.md](.github/README.md)
3. Look at `scripts/build.js`

#### ...contribute to the project
1. Read [README.md](README.md) - Contributing section
2. Follow [GETTING_STARTED.md](GETTING_STARTED.md) - Development Workflow
3. Review [.github/README.md](.github/README.md) for commit conventions

## Documentation Standards

When adding documentation:

### 1. README Structure

Each package README should include:
- Overview and features
- Installation instructions
- Usage examples (basic and advanced)
- API reference
- Type definitions
- Testing examples
- Related documentation links

### 2. Code Comments

```typescript
/**
 * Brief description of what this does
 *
 * @param input - Description of parameter
 * @returns Description of return value
 * @throws Error description (if applicable)
 *
 * @example
 * ```typescript
 * const result = await service.method(input);
 * ```
 */
```

### 3. Architecture Diagrams

Use ASCII art for diagrams:
```
┌─────────────┐
│   Module    │
└─────────────┘
      │
      ↓
┌─────────────┐
│  Service    │
└─────────────┘
```

### 4. Examples

Always include:
- Basic usage example
- Real-world scenario
- Error handling
- TypeScript types

## Keeping Documentation Updated

### When to Update Documentation

**Always update documentation when:**
- Adding new features
- Changing APIs
- Modifying build process
- Adding new packages
- Changing architecture
- Adding environment variables
- Updating dependencies

### Documentation Checklist

- [ ] README updated if public API changed
- [ ] Examples updated if usage changed
- [ ] Architecture diagram updated if structure changed
- [ ] Type documentation updated if types changed
- [ ] Build docs updated if build process changed
- [ ] Deployment docs updated if deployment changed

## Getting Help

### Documentation Issues

If you find documentation that is:
- Outdated
- Incorrect
- Unclear
- Missing

Please:
1. Create an issue with the `documentation` label
2. Include the specific file and section
3. Suggest improvements

### Questions

For questions about:
- **Setup**: Check [GETTING_STARTED.md](GETTING_STARTED.md)
- **Architecture**: Check [ARCHITECTURE.md](ARCHITECTURE.md)
- **Building**: Check [BUILD_SYSTEM.md](BUILD_SYSTEM.md)
- **Testing**: Check [tests/README.md](tests/README.md)
- **Specific package**: Check package README

Still stuck? Create an issue with details about:
- What you're trying to do
- What you've tried
- Error messages (if any)
- Your environment (OS, Node version)

## Documentation Roadmap

### Planned Documentation

- [ ] Detailed API reference for all packages
- [ ] Video tutorials for common tasks
- [ ] Interactive examples
- [ ] Architecture decision records (ADRs)
- [ ] Performance optimization guide
- [ ] Security best practices guide
- [ ] Accessibility guide
- [ ] Internationalization guide

### Contributing to Documentation

Documentation contributions are welcome! Areas that need help:
- Code examples
- Troubleshooting tips
- Use case tutorials
- Package-specific guides
- Diagrams and visuals

## Related Resources

### Internal
- 📘 [Getting Started](GETTING_STARTED.md)
- 📐 [Architecture](ARCHITECTURE.md)
- 🔧 [Build System](BUILD_SYSTEM.md)
- ➕ [Adding Modules](ADDING_MODULES.md)
- 🧪 [Testing Guide](tests/README.md)

### External
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vitest Docs](https://vitest.dev/)
- [pnpm Docs](https://pnpm.io/)

## Version History

- **v0.0.1** - Initial documentation
  - Core architecture documented
  - Build system documented
  - All major READMEs created
  - Getting started guide complete

---

**Last Updated**: 2026-01-15

**Documentation Version**: 0.0.1

**Project Version**: 0.0.1
