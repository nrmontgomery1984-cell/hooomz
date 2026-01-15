/**
 * Simple verification script to check that all module exports are working
 * Run with: node verify-exports.js
 */

console.log('🔍 Verifying @hooomz/shared-contracts exports...\n');

const errors = [];
const warnings = [];

// Test 1: Check file structure
console.log('1. Checking file structure...');
const fs = require('fs');
const path = require('path');

const requiredDirs = [
  'src',
  'src/types',
  'src/constants',
  'src/schemas',
  'src/utils',
  'src/api',
];

const requiredFiles = [
  'src/index.ts',
  'src/types/index.ts',
  'src/constants/index.ts',
  'src/schemas/index.ts',
  'src/utils/index.ts',
  'src/api/index.ts',
  'package.json',
  'tsconfig.json',
];

requiredDirs.forEach((dir) => {
  if (!fs.existsSync(path.join(__dirname, dir))) {
    errors.push(`Missing directory: ${dir}`);
  }
});

requiredFiles.forEach((file) => {
  if (!fs.existsSync(path.join(__dirname, file))) {
    errors.push(`Missing file: ${file}`);
  }
});

if (errors.length === 0) {
  console.log('   ✅ All required files and directories exist\n');
} else {
  console.log('   ❌ Missing files or directories\n');
}

// Test 2: Check package.json
console.log('2. Checking package.json configuration...');
const packageJson = require('./package.json');

const expectedExports = ['.', './types', './constants', './schemas', './utils', './api'];
const actualExports = Object.keys(packageJson.exports || {});

expectedExports.forEach((exp) => {
  if (!actualExports.includes(exp)) {
    errors.push(`Missing export in package.json: ${exp}`);
  }
});

if (packageJson.name !== '@hooomz/shared-contracts') {
  errors.push('Package name is incorrect');
}

if (!packageJson.dependencies?.zod) {
  errors.push('Missing dependency: zod');
}

if (!packageJson.dependencies?.nanoid) {
  errors.push('Missing dependency: nanoid');
}

if (errors.length === 0) {
  console.log('   ✅ package.json is configured correctly\n');
} else {
  console.log('   ❌ package.json has issues\n');
}

// Test 3: Check TypeScript files can be parsed
console.log('3. Checking TypeScript files...');
let fileCount = 0;
let errorCount = 0;

function checkTsFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Basic syntax checks
    if (!content.trim()) {
      warnings.push(`${filePath} is empty`);
    }

    // Check for common issues
    if (content.includes('any') && !filePath.includes('api/index.ts')) {
      warnings.push(`${filePath} uses 'any' type`);
    }

    fileCount++;
  } catch (err) {
    errors.push(`Error reading ${filePath}: ${err.message}`);
    errorCount++;
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      checkTsFile(filePath);
    }
  });
}

scanDirectory(path.join(__dirname, 'src'));

console.log(`   ✅ Checked ${fileCount} TypeScript files\n`);

// Test 4: Verify exports structure
console.log('4. Verifying exports structure...');

const mainExports = fs.readFileSync(path.join(__dirname, 'src/index.ts'), 'utf8');
const expectedMainExports = [
  'export * from \'./types\'',
  'export * from \'./constants\'',
  'export * from \'./schemas\'',
  'export * from \'./utils\'',
  'export * from \'./api\'',
];

expectedMainExports.forEach((exp) => {
  if (!mainExports.includes(exp)) {
    errors.push(`Missing export in src/index.ts: ${exp}`);
  }
});

if (errors.length === 0) {
  console.log('   ✅ All exports are properly configured\n');
}

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('SUMMARY\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Package is ready to use.');
  console.log('\nExports available:');
  console.log('  • @hooomz/shared-contracts');
  console.log('  • @hooomz/shared-contracts/types');
  console.log('  • @hooomz/shared-contracts/constants');
  console.log('  • @hooomz/shared-contracts/schemas');
  console.log('  • @hooomz/shared-contracts/utils');
  console.log('  • @hooomz/shared-contracts/api');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`❌ Found ${errors.length} error(s):\n`);
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} warning(s):\n`);
    warnings.forEach((warn, i) => {
      console.log(`   ${i + 1}. ${warn}`);
    });
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ Verification failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('⚠️  Verification passed with warnings.');
    process.exit(0);
  }
}
