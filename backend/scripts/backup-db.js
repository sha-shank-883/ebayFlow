/**
 * PostgreSQL Database Backup Script
 *
 * Usage:
 *   node backup-db.js              # Create a new backup
 *   node backup-db.js --restore    # Restore from the latest backup
 *
 * Environment Variables:
 *   PGHOST     - Database host (default: localhost)
 *   PGPORT     - Database port (default: 5432)
 *   PGUSER     - Database user (default: postgres)
 *   PGPASSWORD - Database password (required)
 *   PGDATABASE - Database name (required)
 *
 * Prerequisites:
 *   - PostgreSQL client tools (pg_dump) must be installed and in PATH
 *   - Node.js 18+
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { pipeline } = require("stream/promises");

// Configuration
const BACKUP_DIR = path.join(__dirname, "..", "backups");
const RETENTION_DAYS = 30;
const BACKUP_PREFIX = "db_backup";
const BACKUP_EXT = ".sql.gz";

/**
 * Ensure the backups directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Generate a timestamped backup filename
 */
function getBackupFilename() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  return `${BACKUP_PREFIX}_${timestamp}${BACKUP_EXT}`;
}

/**
 * Run pg_dump and compress output with gzip
 */
async function createBackup() {
  ensureBackupDir();

  const filename = getBackupFilename();
  const filePath = path.join(BACKUP_DIR, filename);

  console.log(`Starting database backup...`);
  console.log(`Backup file: ${filePath}`);

  return new Promise((resolve, reject) => {
    const pgDump = spawn("pg_dump", [], {
      env: { ...process.env },
    });

    const gzip = zlib.createGzip({ level: 9 });
    const outputStream = fs.createWriteStream(filePath);

    pgDump.stdout.pipe(gzip).pipe(outputStream);

    let stderr = "";
    pgDump.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pgDump.on("error", (err) => {
      reject(new Error(`Failed to start pg_dump: ${err.message}`));
    });

    pgDump.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`pg_dump exited with code ${code}: ${stderr}`));
        return;
      }

      outputStream.on("finish", () => {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          fs.unlinkSync(filePath);
          reject(new Error("Backup file is empty, backup failed"));
          return;
        }

        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`Backup completed successfully: ${sizeMB} MB`);
        resolve(filePath);
      });
    });
  });
}

/**
 * Delete backups older than the retention period
 */
function cleanupOldBackups() {
  console.log(`Cleaning up backups older than ${RETENTION_DAYS} days...`);

  if (!fs.existsSync(BACKUP_DIR)) {
    console.log("No backup directory found, skipping cleanup");
    return;
  }

  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(BACKUP_EXT));
  const now = new Date();
  let deletedCount = 0;

  for (const file of files) {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const ageDays = (now - stats.mtime) / (1000 * 60 * 60 * 24);

    if (ageDays > RETENTION_DAYS) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old backup: ${file} (${ageDays.toFixed(1)} days old)`);
      deletedCount++;
    }
  }

  console.log(`Cleanup complete: ${deletedCount} backup(s) removed`);
}

/**
 * Find the latest backup file
 */
function getLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return null;
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(BACKUP_EXT))
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);

  return files.length > 0 ? files[0] : null;
}

/**
 * Restore database from a backup file
 */
async function restoreBackup(backupPath) {
  console.log(`Restoring database from: ${backupPath}`);

  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const inputStream = fs.createReadStream(backupPath);

    const psql = spawn("psql", [], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    inputStream.pipe(gunzip).pipe(psql.stdin);

    let stdout = "";
    let stderr = "";

    psql.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    psql.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    psql.on("error", (err) => {
      reject(new Error(`Failed to start psql: ${err.message}`));
    });

    psql.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`psql exited with code ${code}: ${stderr}`));
        return;
      }
      console.log("Database restore completed successfully");
      resolve();
    });
  });
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const restoreMode = args.includes("--restore");

  try {
    if (restoreMode) {
      const latest = getLatestBackup();
      if (!latest) {
        console.error("Error: No backups found to restore from");
        process.exit(1);
      }
      console.log(`Latest backup: ${latest.name}`);
      await restoreBackup(latest.path);
    } else {
      await createBackup();
      cleanupOldBackups();
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
