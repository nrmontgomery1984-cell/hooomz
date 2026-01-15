#!/usr/bin/env node

/**
 * Build script that respects package dependencies
 *
 * Build order:
 * 1. shared-contracts (foundation)
 * 2. db (depends on shared-contracts)
 * 3. ui (depends on shared-contracts)
 * 4. All other packages in parallel (depend on shared-contracts)
 * 5. web app (depends on all packages)
 */

const { execSync } = require('child_process');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${colors.bright}${description}...${colors.reset}`, colors.blue);
  try {
    execSync(command, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    log(`✓ ${description} completed`, colors.green);
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, colors.red);
    process.exit(1);
  }
}

function main() {
  const startTime = Date.now();

  log('\n┌─────────────────────────────────────┐', colors.bright);
  log('│  Building Hooomz Monorepo           │', colors.bright);
  log('└─────────────────────────────────────┘\n', colors.bright);

  // Step 1: Build shared-contracts first (foundation)
  log('\n📦 Step 1: Building foundation packages', colors.yellow);
  execCommand(
    'pnpm --filter @hooomz/shared-contracts build',
    'Building @hooomz/shared-contracts'
  );

  // Step 2: Build db and ui (depend on shared-contracts)
  log('\n📦 Step 2: Building core infrastructure', colors.yellow);
  execCommand(
    'pnpm --filter @hooomz/db build',
    'Building @hooomz/db'
  );
  execCommand(
    'pnpm --filter @hooomz/ui build',
    'Building @hooomz/ui'
  );

  // Step 3: Build all feature packages in parallel
  log('\n📦 Step 3: Building feature packages', colors.yellow);
  execCommand(
    'pnpm --filter @hooomz/customers --filter @hooomz/projects --filter @hooomz/estimating --filter @hooomz/scheduling --filter @hooomz/field-docs --filter @hooomz/reporting build',
    'Building feature packages (parallel)'
  );

  // Step 4: Build web app (depends on all packages)
  log('\n📦 Step 4: Building web application', colors.yellow);
  execCommand(
    'pnpm --filter web build',
    'Building web app'
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n┌─────────────────────────────────────┐', colors.green);
  log(`│  ✓ Build completed in ${duration}s       │`, colors.green);
  log('└─────────────────────────────────────┘\n', colors.green);
}

main();
