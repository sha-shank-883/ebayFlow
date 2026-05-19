import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = {
    'Cache-Control': 'no-cache',
  };

  let dbStatus: 'connected' | 'error' = 'error';
  let dbLatency = 0;

  try {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Math.round(performance.now() - start);
    dbStatus = 'connected';
  } catch {
    dbLatency = 0;
  }

  const mem = process.memoryUsage();
  const uptime = process.uptime();

  const body = {
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime * 1000) / 1000,
    database: {
      status: dbStatus,
      latency: dbLatency,
    },
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
    },
    version: process.env.npm_package_version || '1.0.0',
  };

  const status = dbStatus === 'connected' ? 200 : 503;

  return NextResponse.json(body, { status, headers });
}
