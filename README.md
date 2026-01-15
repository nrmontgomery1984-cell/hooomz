# Hooomz

A mobile-first construction management platform built with TypeScript and pnpm workspaces.

[![CI](https://github.com/your-org/hooomz/workflows/CI/badge.svg)](https://github.com/your-org/hooomz/actions)

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd hooomz
pnpm install

# Verify setup
node scripts/verify-setup.js

# Build everything
pnpm build

# Start development
pnpm dev
```

📖 **[Read the full Getting Started guide](GETTING_STARTED.md)**

## Project Structure

```
hooomz/
├── apps/
│   └── web/                    # Next.js web application
├── packages/
│   ├── shared-contracts/       # TypeScript types and contracts
│   ├── db/                     # Database layer (IndexedDB)
│   ├── ui/                     # UI component library
│   ├── customers/              # Customer management
│   ├── projects/               # Project management
│   ├── estimating/             # Estimation and invoicing
│   ├── scheduling/             # Task scheduling
│   ├── field-docs/             # Field documentation and photos
│   └── reporting/              # Reporting and analytics
├── tests/                      # Integration tests
├── scripts/                    # Build and utility scripts
└── .github/                    # CI/CD workflows
```

## Features

- 🏗️ **Project Management** - Track jobs from estimate to completion
- 💰 **Estimating & Invoicing** - Create detailed estimates with automatic calculations
- 📅 **Scheduling** - Task management with dependencies
- 👥 **Customer Management** - Maintain customer records and history
- 📸 **Field Documentation** - Capture photos and inspections on-site
- 📊 **Reporting** - Project analytics and financial reports
- 📴 **Offline-First** - Works without internet, syncs when connected

## Available Scripts

### Development
```bash
pnpm dev              # Start dev server
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
```

### Code Quality
```bash
pnpm lint             # Lint all packages
pnpm lint:fix         # Lint and fix issues
pnpm typecheck        # TypeScript type check
pnpm format           # Format with Prettier
```

### CI/CD
```bash
pnpm ci               # Run full CI checks locally
pnpm clean            # Remove build artifacts
```

## Technology Stack

- **Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS
- **State**: React hooks, service layer pattern
- **Database**: IndexedDB (offline-first)
- **Testing**: Vitest, Testing Library
- **Build**: pnpm workspaces, custom build scripts
- **CI/CD**: GitHub Actions, Husky git hooks

## Documentation

- 📘 [Getting Started Guide](GETTING_STARTED.md) - Complete setup instructions
- 🧪 [Testing Guide](tests/README.md) - How to write and run tests
- 🔄 [CI/CD Guide](.github/README.md) - Continuous integration setup
- 📦 Package READMEs - Each package has its own documentation

## Development Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make changes and commit:**
   ```bash
   git commit -m "feat(module): description"
   ```
   Pre-commit hooks automatically run lint and type checks.

3. **Push and create PR:**
   ```bash
   git push origin feat/your-feature
   ```
   CI will automatically run tests, lint, type check, and build.

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(customers): add customer search
fix(estimating): correct tax calculation
docs: update README
test(projects): add integration tests
```

## Requirements

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Mobile-First Design

This application is designed with a mobile-first approach for use on construction sites:
- Large touch targets for gloved hands
- Offline functionality for areas without connectivity
- Photo capture and annotation
- Voice input support
- Simple, focused interfaces

## Contributing

1. Read the [Getting Started guide](GETTING_STARTED.md)
2. Create a feature branch
3. Make your changes with tests
4. Ensure `pnpm ci` passes
5. Submit a pull request

## License

[Add your license here]
