# Getting Started with Hooomz

This guide will help you set up the Hooomz development environment from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **pnpm** v8 or higher ([Installation guide](https://pnpm.io/installation))
- **Git** ([Download](https://git-scm.com/))

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hooomz
```

### 2. Install Dependencies

```bash
pnpm install
```

This will:
- Install all dependencies for all packages
- Set up Husky git hooks
- Configure pre-commit checks

### 3. Verify Setup

```bash
node scripts/verify-setup.js
```

This will check that all required files and configurations are in place.

### 4. Build All Packages

```bash
pnpm build
```

This will build all packages in the correct dependency order:
1. shared-contracts
2. db and ui
3. Feature packages (customers, projects, estimating, scheduling, field-docs, reporting)
4. web app

### 5. Start Development Server

```bash
pnpm dev
```

The web app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
hooomz/
├── apps/
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/           # App router pages
│       │   ├── components/    # Shared components
│       │   └── services/      # Service layer
│       └── package.json
├── packages/
│   ├── shared-contracts/      # TypeScript types and contracts
│   ├── db/                    # Database layer (IndexedDB)
│   ├── ui/                    # UI component library
│   ├── customers/             # Customer management
│   ├── projects/              # Project management
│   ├── estimating/            # Estimation and invoicing
│   ├── scheduling/            # Task scheduling
│   ├── field-docs/            # Field documentation and photos
│   └── reporting/             # Reporting and analytics
├── tests/                     # Integration tests
├── scripts/                   # Build and utility scripts
├── .github/                   # GitHub Actions workflows
└── .husky/                    # Git hooks

```

## Development Workflow

### Daily Development

```bash
# Start the dev server with hot reload
pnpm dev

# Run tests in watch mode (in another terminal)
pnpm test:watch

# Lint your changes
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**

3. **Commit with conventional commits:**
   ```bash
   git commit -m "feat(customers): add customer search"
   ```

   The pre-commit hook will automatically:
   - Run linting
   - Run type checking
   - Validate commit message format

4. **Push and create a PR:**
   ```bash
   git push origin feat/your-feature-name
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance
- `perf`: Performance
- `ci`: CI/CD
- `build`: Build system

**Examples:**
```bash
feat(estimating): add tax calculation for multiple jurisdictions
fix(scheduling): correct task dependency validation
docs: update README with API examples
test(customers): add integration tests for customer CRUD
```

## Available Scripts

### Build Commands

```bash
pnpm build              # Build all packages in correct order
pnpm build:packages     # Build only packages (not web app)
pnpm build:app          # Build only web app
pnpm build:shared       # Build only shared-contracts
```

### Development

```bash
pnpm dev                # Start Next.js dev server
```

### Testing

```bash
pnpm test               # Run all tests
pnpm test:integration   # Run integration tests only
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Run tests with coverage report
```

### Code Quality

```bash
pnpm lint               # Lint all packages
pnpm lint:fix           # Lint and auto-fix issues
pnpm typecheck          # Type check all packages
pnpm format             # Format code with Prettier
pnpm format:check       # Check code formatting
```

### Cleanup

```bash
pnpm clean              # Remove build artifacts
pnpm clean:all          # Remove build artifacts and node_modules
```

### CI

```bash
pnpm ci                 # Run full CI checks locally
```

This runs the same checks as GitHub Actions:
1. Install dependencies (frozen lockfile)
2. Build all packages
3. Lint
4. Type check
5. Run tests

## Working with Packages

### Building a Single Package

```bash
pnpm --filter @hooomz/customers build
```

### Running Tests for a Single Package

```bash
pnpm --filter @hooomz/customers test
```

### Adding a Dependency

```bash
# To a specific package
pnpm --filter @hooomz/customers add lodash

# To the web app
pnpm --filter web add react-icons

# Dev dependency to root
pnpm add -D -w typescript
```

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean everything and rebuild
pnpm clean:all
pnpm install
pnpm build
```

### Type Errors

```bash
# Rebuild shared-contracts first
pnpm build:shared

# Then rebuild everything
pnpm build
```

### Git Hook Issues

If git hooks aren't working:

```bash
# Reinstall hooks
rm -rf .husky
pnpm prepare
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find and kill the process (Unix/Mac)
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

## IDE Setup

### VS Code (Recommended)

Install these extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

Recommended settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Integration tests
pnpm test:integration

# Specific test file
pnpm test tests/integration/project-lifecycle.test.ts

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

View coverage report: `tests/reports/coverage/index.html`

### Writing Tests

See [tests/README.md](tests/README.md) for detailed testing documentation.

## CI/CD

### GitHub Actions

CI runs automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

The workflow:
1. **Test** - Runs integration tests
2. **Lint** - Checks code quality
3. **TypeCheck** - Validates TypeScript
4. **Build** - Builds all packages

See [.github/README.md](.github/README.md) for CI/CD documentation.

## Architecture Overview

### Monorepo Structure

Hooomz uses a pnpm workspace monorepo with:
- **apps/web** - Next.js 14 application with App Router
- **packages/** - Shared packages used by the web app

### Technology Stack

- **Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS
- **State Management**: React hooks, service layer pattern
- **Database**: IndexedDB (offline-first)
- **Testing**: Vitest, Testing Library
- **Build**: pnpm workspaces, custom build scripts
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier, TypeScript, Husky

### Key Concepts

1. **Offline-First**: All data stored locally in IndexedDB
2. **Service Layer**: Business logic separated from UI
3. **Type Safety**: Shared contracts package for types
4. **Module Boundaries**: Clear separation between features
5. **Test Coverage**: Integration tests for critical workflows

## Next Steps

1. **Explore the code:**
   - Start with `apps/web/src/app/page.tsx`
   - Look at service implementations in `apps/web/src/services/`
   - Review shared types in `packages/shared-contracts/`

2. **Run the app:**
   ```bash
   pnpm dev
   ```

3. **Make a change:**
   - Pick a component to modify
   - Save and see hot reload in action

4. **Run tests:**
   ```bash
   pnpm test:watch
   ```

5. **Create your first feature:**
   - Follow the patterns in existing modules
   - Write tests first (TDD)
   - Use conventional commits

## Getting Help

- **Documentation**: Check the README files in each package
- **Tests**: Look at test files for usage examples
- **CI/CD**: See `.github/README.md`
- **Architecture**: Review this guide and code comments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm ci` to verify
5. Commit using conventional commits
6. Push and create a pull request

## License

[Add your license here]
