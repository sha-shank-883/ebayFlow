#!/usr/bin/env bash
set -e

echo "=== Render Build Script ==="

cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install --production=false

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Building Next.js application..."
npm run build

echo "=== Build Complete ==="
