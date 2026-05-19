# Setting Up PostgreSQL Database on Render for eBay Flow AI

This guide walks you through creating and managing a PostgreSQL database on Render for the eBay Flow AI application.

## Prerequisites

- A [Render](https://render.com) account
- Your eBay Flow AI codebase with Prisma schema ready

---

## Step 1: Create a PostgreSQL Database on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** in the top-right corner
3. Select **PostgreSQL**
4. Configure the database:

| Setting | Value |
|---------|-------|
| **Name** | `ebayflow-db` (or your preferred name) |
| **Database** | `sellerflow` (the database name) |
| **User** | `sellerflow` (the database user) |
| **Region** | Same region as your backend web service (e.g., `London`) |
| **Instance Type** | `Free` (for development) or `Starter` ($7/mo) for production |
| **PostgreSQL Version** | `16` (latest stable) |

5. Click **Create Database**

### Free Tier Limitations

- Database expires after 90 days (must be manually renewed)
- 1 GB storage limit
- No automatic backups
- Single connection limit (no connection pooling)
- Spins down after inactivity

For production, use the **Starter** plan or higher.

---

## Step 2: Obtain the Connection String

After the database is created:

1. Go to the database dashboard
2. Navigate to the **Info** tab (or **Connection** tab)
3. Copy the **Internal Connection String** (for services in the same Render account) or **External Connection String** (for local development or external services)

### Connection String Format

```
postgresql://<username>:<password>@<hostname>:<port>/<database_name>
```

### Example

```
postgresql://sellerflow:abc123xyz@ep-abc123xyz.us-east-2.aws.neon.tech:5432/sellerflow
```

### Parts of the Connection String

| Part | Description |
|------|-------------|
| `postgresql://` | Protocol identifier |
| `sellerflow` | Database username |
| `abc123xyz` | Database password |
| `ep-abc123xyz.us-east-2.aws.neon.tech` | Database hostname |
| `5432` | PostgreSQL port (default) |
| `sellerflow` | Database name |

---

## Step 3: Configure the Backend with the Connection String

### In Render Backend Service

1. Go to your backend web service dashboard on Render
2. Navigate to the **Environment** tab
3. Add or update the `DATABASE_URL` environment variable:

```
DATABASE_URL=postgresql://sellerflow:password@hostname:5432/sellerflow
```

4. Click **Save Changes**
5. Render will automatically redeploy

### For Local Development

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set:

```
DATABASE_URL="postgresql://sellerflow:password@hostname:5432/sellerflow"
```

---

## Step 4: Run Migrations on Production Database

### Method 1: Via Render Web Service Build Command (Recommended)

If you configured your backend build command as specified in [DEPLOY_RENDER.md](./DEPLOY_RENDER.md), migrations run automatically on every deployment:

```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

The `npx prisma migrate deploy` step applies all pending migrations to the production database.

### Method 2: Via Render Shell

1. Go to your backend web service dashboard
2. Click the **Shell** tab
3. Wait for the shell to connect
4. Run:

```bash
cd backend
npx prisma migrate deploy
```

### Method 3: From Local Machine

Run migrations from your local machine pointing to the production database:

```bash
cd backend
DATABASE_URL="postgresql://sellerflow:password@hostname:5432/sellerflow" npx prisma migrate deploy
```

### Method 4: Via CI/CD Pipeline

Add migration deployment to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Deploy database migrations
  run: |
    cd backend
    npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Step 5: Run Seed on Production Database

> **Warning**: The seed script (`prisma/seed.ts`) deletes existing data before inserting new data. Only run this on fresh databases or when you intentionally want to reset all data.

### Method 1: Via Render Shell

1. Go to your backend web service dashboard
2. Click the **Shell** tab
3. Run:

```bash
cd backend
npx ts-node prisma/seed.ts
```

### Method 2: From Local Machine

```bash
cd backend
DATABASE_URL="postgresql://sellerflow:password@hostname:5432/sellerflow" npx ts-node prisma/seed.ts
```

### Method 3: As a Post-Deploy Script

Add a post-deploy script to your `backend/package.json`:

```json
{
  "scripts": {
    "db:seed": "ts-node prisma/seed.ts",
    "postdeploy": "npx prisma migrate deploy && npx ts-node prisma/seed.ts"
  }
}
```

Then run after deployment:

```bash
cd backend
npm run postdeploy
```

### What the Seed Script Creates

The seed script (`backend/prisma/seed.ts`) creates:

- **Demo User**: `demo@sellerflow.ai` with password `password123`
- **Super Admin**: `contact@ebayflow.com` with password from `SUPER_ADMIN_PASSWORD` env var (default: `EbayFlow@883`)
- **Demo Workspace**: "SellerFlow Demo Store" with sample data
- **Sample Listings**: 5 sample eBay listings
- **Sample Orders**: 20 sample orders with random dates
- **Sample Inventory**: 5 inventory items
- **Website Content**: Home, About, Contact, Pricing, Features, FAQ pages with sections
- **Testimonials**: 6 sample testimonials
- **FAQ Categories**: 5 categories with 17 FAQ items
- **Pricing Plans**: 6 plans (Starter, Professional, Enterprise for monthly/yearly)
- **Navigation Items**: 29 navigation items (header + footer)
- **Admin Roles**: Super Admin, Editor, Viewer roles

---

## Step 6: Verify Database Setup

### Check Database Connectivity

From Render Shell or local machine:

```bash
cd backend
npx prisma db pull
```

This introspects the database and confirms the connection is working.

### Check Migration Status

```bash
cd backend
npx prisma migrate status
```

This shows which migrations have been applied and which are pending.

### Verify Seed Data

Connect to the database using a PostgreSQL client (pgAdmin, DBeaver, or psql) and check:

```sql
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Workspace";
SELECT COUNT(*) FROM "Listing";
SELECT COUNT(*) FROM "Page";
```

---

## Backup Strategy

### Render Automatic Backups

Render provides automatic backups based on your plan:

| Plan | Backup Frequency | Retention |
|------|-----------------|-----------|
| Free | None | N/A |
| Starter ($7/mo) | Daily | 7 days |
| Standard ($25/mo) | Daily | 14 days |
| Pro ($100/mo) | Hourly | 30 days |

### Manual Backups

#### Export Database Dump

From Render Shell or a machine with database access:

```bash
pg_dump "postgresql://sellerflow:password@hostname:5432/sellerflow" > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Restore from Backup

```bash
psql "postgresql://sellerflow:password@hostname:5432/sellerflow" < backup_20250101_120000.sql
```

#### Automated Backup Script

Create a backup script and schedule it with cron:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASE_URL="postgresql://sellerflow:password@hostname:5432/sellerflow"

# Create backup
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/ebayflow_backup_$TIMESTAMP.sql"

# Compress
gzip "$BACKUP_DIR/ebayflow_backup_$TIMESTAMP.sql"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "ebayflow_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ebayflow_backup_$TIMESTAMP.sql.gz"
```

Make it executable and add to crontab:

```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /path/to/backup.sh (runs daily at 2 AM)
```

### Backup Best Practices

1. **Test Restores**: Periodically test restoring from backups to verify they work
2. **Off-site Storage**: Store backups in a different location (S3, Google Cloud Storage)
3. **Encryption**: Encrypt backups containing sensitive data
4. **Retention Policy**: Keep at least 30 days of daily backups
5. **Point-in-Time Recovery**: Use Render's Pro plan for hourly backups and PITR

---

## Connection Pooling

### Why Connection Pooling Matters

PostgreSQL has a limited number of concurrent connections. Without pooling:

- Each request opens a new database connection
- Serverless platforms (Vercel, Render free tier) can exhaust connection limits
- Connection overhead adds latency to every request

### Render Connection Limits

| Plan | Max Connections |
|------|----------------|
| Free | 20 |
| Starter | 50 |
| Standard | 100 |
| Pro | 200 |

### Option A: Prisma Connection Pooling (Built-in)

Prisma Client has built-in connection pooling. Configure it in your Prisma schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Add connection pool settings to the connection URL:

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname?connection_limit=10&pool_timeout=30
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `connection_limit` | Max connections in the pool | Number of CPU cores * 2 + 1 |
| `pool_timeout` | Seconds to wait for a connection | 10 |

### Option B: PgBouncer (External Connection Pooler)

For high-traffic applications, use PgBouncer:

#### Using Render's Built-in PgBouncer

Render provides PgBouncer for PostgreSQL databases on paid plans:

1. Go to your PostgreSQL database dashboard
2. Navigate to the **Info** tab
3. Copy the **PgBouncer Connection String**
4. Use this connection string in your `DATABASE_URL` environment variable

The PgBouncer connection string looks like:

```
postgresql://user:pass@hostname-pgbouncer.render.com:6543/dbname
```

#### PgBouncer Configuration Recommendations

```
# pgbouncer.ini (if self-hosting)

[databases]
sellerflow = host=localhost port=5432 dbname=sellerflow

[pgbouncer]
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
```

| Setting | Recommended Value | Description |
|---------|------------------|-------------|
| `pool_mode` | `transaction` | Best for Prisma (releases connection after each transaction) |
| `max_client_conn` | `200` | Maximum client connections |
| `default_pool_size` | `20` | Connections per database/user pair |
| `min_pool_size` | `5` | Minimum idle connections |

### Option C: Connection String with Serverless Optimization

For serverless environments (Vercel serverless functions), add these parameters:

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname?connection_limit=5&pool_timeout=20&connect_timeout=10
```

Lower connection limits prevent overwhelming the database during traffic spikes.

---

## Database Maintenance

### Running Prisma Studio

Prisma Studio provides a visual database browser:

```bash
cd backend
npx prisma studio
```

For production, expose it temporarily:

```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma studio --port 5555
```

### Checking Database Size

```sql
SELECT pg_size_pretty(pg_database_size('sellerflow'));
```

### Checking Table Sizes

```sql
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
```

### Vacuum and Analyze

Run periodically to maintain performance:

```sql
VACUUM ANALYZE;
```

---

## Troubleshooting

### Connection Refused

**Problem**: `ECONNREFUSED` or `P1001: Can't reach database server`

**Solution**:
- Verify the database is running (check Render dashboard)
- Check that `DATABASE_URL` is correct (hostname, port, credentials)
- Ensure the database is in the same region as your backend
- Free tier databases may be paused; wake them up via the dashboard

### Too Many Connections

**Problem**: `FATAL: too many connections for role "sellerflow"`

**Solution**:
- Enable connection pooling (see above)
- Reduce `connection_limit` in your connection string
- Check for connection leaks in your application code
- Upgrade to a plan with higher connection limits

### Migration Fails

**Problem**: `npx prisma migrate deploy` fails

**Solution**:
1. Check migration status:
   ```bash
   npx prisma migrate status
   ```
2. View migration logs for specific errors
3. If a migration is partially applied, you may need to:
   - Manually fix the database state
   - Create a new migration to correct the issue
   - Use `npx prisma migrate resolve --applied <migration_name>` to mark as applied

### Seed Script Fails

**Problem**: `npx ts-node prisma/seed.ts` fails

**Solution**:
- Check that migrations have been applied first
- Verify the database is empty or the seed script handles existing data
- Check the error output for specific constraint violations
- The seed script uses `upsert` for website data but `deleteMany` for core data

### Slow Queries

**Problem**: Database queries are slow

**Solution**:
1. Check query execution plans:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM "Listing" WHERE "workspaceId" = 'xxx';
   ```
2. Ensure indexes exist on frequently queried columns (Prisma schema includes indexes)
3. Consider connection pooling to reduce connection overhead
4. Upgrade database plan for more resources

### Database Disk Full

**Problem**: `ERROR: could not extend file: No space left on device`

**Solution**:
- Upgrade to a plan with more storage
- Delete old data (audit logs, old sync logs)
- Run `VACUUM FULL` to reclaim space
- Set up data retention policies

---

## Migration Workflow

### Development Workflow

```bash
# 1. Make changes to schema.prisma
# 2. Create a migration
cd backend
npx prisma migrate dev --name add_new_field

# 3. Test locally
npx prisma db seed

# 4. Push changes to Git
git add .
git commit -m "feat: add new field to listing"
git push

# 5. Deploy (migrations run automatically via build command)
```

### Production Migration Checklist

- [ ] Test migration on a staging database first
- [ ] Backup production database before migrating
- [ ] Run `npx prisma migrate status` to check pending migrations
- [ ] Run `npx prisma migrate deploy` to apply migrations
- [ ] Verify application works after migration
- [ ] Monitor database performance for 24 hours

### Rollback Strategy

Prisma does not support automatic rollback. To rollback:

1. Restore from a database backup taken before the migration
2. Or, create a new migration that reverses the changes

---

## Security Best Practices

1. **Never commit `DATABASE_URL`** to version control
2. **Use environment variables** for all connection strings
3. **Enable SSL** for database connections (Render does this by default)
4. **Rotate passwords** periodically via Render dashboard
5. **Use separate databases** for development, staging, and production
6. **Restrict access** to the database dashboard
7. **Monitor access logs** for unusual activity

---

## Cost Estimation

| Plan | Monthly Cost | Storage | Connections | Backups |
|------|-------------|---------|-------------|---------|
| Free | $0 | 1 GB | 20 | None |
| Starter | $7 | 10 GB | 50 | Daily (7 days) |
| Standard | $25 | 50 GB | 100 | Daily (14 days) |
| Pro | $100 | 200 GB | 200 | Hourly (30 days) |

For a production eBay Flow AI deployment, **Starter** ($7/mo) is the minimum recommended plan.
