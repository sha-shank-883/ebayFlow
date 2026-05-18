#!/usr/bin/env node

/**
 * Environment Validation Script
 *
 * Validates that all required environment variables are present and correctly
 * formatted in the .env file.
 *
 * Usage:
 *   node scripts/validate-env.js
 *
 * Or from the backend directory:
 *   npm run validate-env  (if added to package.json scripts)
 *
 * Exit codes:
 *   0 - All required variables are valid
 *   1 - One or more required variables are missing or invalid
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Resolve .env file from project root (parent of backend directory)
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

// Validation results storage
const results = [];

/**
 * Parse .env file and return key-value pairs
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });

  return env;
}

/**
 * Validate PostgreSQL connection string
 */
function isValidPostgresUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
  } catch {
    return false;
  }
}

/**
 * Validate Redis connection string
 */
function isValidRedisUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'redis:' || parsed.protocol === 'rediss:';
  } catch {
    return false;
  }
}

/**
 * Validate HTTP(S) URL
 */
function isValidHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate directory path exists
 */
function isValidPath(dirPath) {
  try {
    return fs.existsSync(dirPath);
  } catch {
    return false;
  }
}

/**
 * Format validation result for table display
 */
function addResult(variable, status, message) {
  results.push({ variable, status, message });
}

// Main validation logic
function runValidation() {
  console.log('\n=== Environment Validation ===\n');

  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.error(`ERROR: .env file not found at ${envPath}`);
    console.error('Create a .env file in the project root and try again.\n');
    process.exit(1);
  }

  console.log(`Reading .env from: ${envPath}\n`);

  const env = parseEnvFile(envPath);

  if (!env || Object.keys(env).length === 0) {
    console.error('ERROR: .env file is empty or could not be parsed.\n');
    process.exit(1);
  }

  // DATABASE_URL - Required, must be valid PostgreSQL connection string
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    addResult('DATABASE_URL', 'FAIL', 'Missing - required');
  } else if (!isValidPostgresUrl(databaseUrl)) {
    addResult('DATABASE_URL', 'FAIL', `Invalid PostgreSQL URL: ${databaseUrl}`);
  } else {
    addResult('DATABASE_URL', 'PASS', 'Valid');
  }

  // REDIS_URL - Optional, warn if missing
  const redisUrl = env.REDIS_URL;
  if (!redisUrl) {
    addResult('REDIS_URL', 'WARN', 'Missing - optional (Redis features will be disabled)');
  } else if (!isValidRedisUrl(redisUrl)) {
    addResult('REDIS_URL', 'FAIL', `Invalid Redis URL: ${redisUrl}`);
  } else {
    addResult('REDIS_URL', 'PASS', 'Valid');
  }

  // JWT_SECRET - Required, must be at least 32 characters
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    addResult('JWT_SECRET', 'FAIL', 'Missing - required');
  } else if (jwtSecret.length < 32) {
    addResult('JWT_SECRET', 'FAIL', `Too short (${jwtSecret.length} chars, minimum 32)`);
  } else {
    addResult('JWT_SECRET', 'PASS', `Valid (${jwtSecret.length} chars)`);
  }

  // NODE_ENV - Required, must be development, test, or production
  const nodeEnv = env.NODE_ENV;
  const validEnvs = ['development', 'test', 'production'];
  if (!nodeEnv) {
    addResult('NODE_ENV', 'FAIL', 'Missing - required');
  } else if (!validEnvs.includes(nodeEnv)) {
    addResult('NODE_ENV', 'FAIL', `Invalid value: "${nodeEnv}" (must be: ${validEnvs.join(', ')})`);
  } else {
    addResult('NODE_ENV', 'PASS', `Valid (${nodeEnv})`);
  }

  // UPLOAD_DIR - Required, must be valid path
  const uploadDir = env.UPLOAD_DIR;
  if (!uploadDir) {
    addResult('UPLOAD_DIR', 'FAIL', 'Missing - required');
  } else if (!isValidPath(uploadDir)) {
    addResult('UPLOAD_DIR', 'FAIL', `Directory does not exist: ${uploadDir}`);
  } else {
    addResult('UPLOAD_DIR', 'PASS', `Valid (${uploadDir})`);
  }

  // NEXT_PUBLIC_API_URL - Required, must be valid URL
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    addResult('NEXT_PUBLIC_API_URL', 'FAIL', 'Missing - required');
  } else if (!isValidHttpUrl(apiUrl)) {
    addResult('NEXT_PUBLIC_API_URL', 'FAIL', `Invalid URL: ${apiUrl}`);
  } else {
    addResult('NEXT_PUBLIC_API_URL', 'PASS', `Valid (${apiUrl})`);
  }

  // Display results as table
  const col1Width = 24;
  const col2Width = 8;
  const col3Width = 60;

  console.log(
    'Variable'.padEnd(col1Width) +
    'Status'.padEnd(col2Width) +
    'Details'
  );
  console.log('-'.repeat(col1Width + col2Width + col3Width));

  results.forEach((r) => {
    console.log(
      r.variable.padEnd(col1Width) +
      r.status.padEnd(col2Width) +
      r.message
    );
  });

  console.log();

  // Determine exit code
  const failures = results.filter((r) => r.status === 'FAIL');
  const warnings = results.filter((r) => r.status === 'WARN');

  if (failures.length > 0) {
    console.error(`FAILED: ${failures.length} required variable(s) failed validation.`);
    if (warnings.length > 0) {
      console.warn(`WARNING: ${warnings.length} optional variable(s) missing.`);
    }
    console.log();
    process.exit(1);
  } else {
    console.log(`PASSED: All required variables are valid.`);
    if (warnings.length > 0) {
      console.warn(`WARNING: ${warnings.length} optional variable(s) missing.`);
    }
    console.log();
    process.exit(0);
  }
}

runValidation();
