#!/usr/bin/env node

/**
 * Verification script to ensure the build system is correctly configured
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    log(`✓ ${description}`, colors.green);
  } else {
    log(`✗ ${description} - File not found: ${filePath}`, colors.red);
  }

  return exists;
}

function checkPackageScript(packagePath, scriptName) {
  const fullPath = path.resolve(__dirname, '..', packagePath, 'package.json');

  if (!fs.existsSync(fullPath)) {
    log(`✗ Package not found: ${packagePath}`, colors.red);
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  const hasScript = packageJson.scripts && packageJson.scripts[scriptName];

  if (hasScript) {
    log(`✓ ${packagePath} has '${scriptName}' script`, colors.green);
  } else {
    log(`✗ ${packagePath} missing '${scriptName}' script`, colors.red);
  }

  return hasScript;
}

function main() {
  log('\n┌─────────────────────────────────────────┐', colors.bright);
  log('│  Verifying Build System Setup          │', colors.bright);
  log('└─────────────────────────────────────────┘\n', colors.bright);

  let allChecksPass = true;

  // Check core files
  log('\n📄 Checking core configuration files:', colors.yellow);
  allChecksPass &= checkFile('package.json', 'Root package.json');
  allChecksPass &= checkFile('pnpm-workspace.yaml', 'PNPM workspace config');
  allChecksPass &= checkFile('scripts/build.js', 'Build script');
  allChecksPass &= checkFile('.github/workflows/ci.yml', 'GitHub Actions CI workflow');
  allChecksPass &= checkFile('.husky/pre-commit', 'Pre-commit hook');
  allChecksPass &= checkFile('.husky/commit-msg', 'Commit message hook');
  allChecksPass &= checkFile('.prettierrc.json', 'Prettier config');
  allChecksPass &= checkFile('.prettierignore', 'Prettier ignore');

  // Check test configuration
  log('\n🧪 Checking test configuration:', colors.yellow);
  allChecksPass &= checkFile('tests/vitest.config.ts', 'Vitest config');
  allChecksPass &= checkFile('tests/setup.ts', 'Test setup');
  allChecksPass &= checkFile('tests/fixtures.ts', 'Test fixtures');

  // Check package scripts
  log('\n📦 Checking package scripts:', colors.yellow);
  const packages = [
    'packages/shared-contracts',
    'packages/customers',
    'packages/projects',
    'packages/estimating',
    'packages/scheduling',
    'packages/field-docs',
    'packages/reporting',
  ];

  packages.forEach((pkg) => {
    allChecksPass &= checkPackageScript(pkg, 'build');
    allChecksPass &= checkPackageScript(pkg, 'lint');
    allChecksPass &= checkPackageScript(pkg, 'typecheck');
  });

  // Check web app
  log('\n🌐 Checking web app:', colors.yellow);
  allChecksPass &= checkPackageScript('apps/web', 'build');
  allChecksPass &= checkPackageScript('apps/web', 'dev');
  allChecksPass &= checkPackageScript('apps/web', 'lint');

  // Summary
  log('\n┌─────────────────────────────────────────┐', colors.bright);
  if (allChecksPass) {
    log('│  ✓ All checks passed!                   │', colors.green);
    log('└─────────────────────────────────────────┘\n', colors.green);
    log('You can now run:', colors.bright);
    log('  pnpm install    - Install dependencies', colors.reset);
    log('  pnpm build      - Build all packages', colors.reset);
    log('  pnpm test       - Run tests', colors.reset);
    log('  pnpm ci         - Run full CI checks\n', colors.reset);
  } else {
    log('│  ✗ Some checks failed                   │', colors.red);
    log('└─────────────────────────────────────────┘\n', colors.red);
    process.exit(1);
  }
}

main();
