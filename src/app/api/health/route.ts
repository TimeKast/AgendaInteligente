/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Returns application health status for monitoring and load balancers.
 * - status: ok | degraded | error
 * - database: connected | error (if DATABASE_URL is configured)
 *
 * @see OBS-002
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { isDatabaseConfigured } from '@/lib/env';
import { logger } from '@/lib/logger';

// Get version from package.json (injected at build time)
const version = process.env.npm_package_version || '1.0.0';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  database?: 'connected' | 'error' | 'not_configured';
  uptime?: number;
}

export async function GET() {
  const health: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
  };

  // Check database connectivity (if configured)
  if (isDatabaseConfigured()) {
    try {
      await db.execute(sql`SELECT 1`);
      health.database = 'connected';
    } catch (error) {
      health.database = 'error';
      health.status = 'degraded';
      logger.error('[Health] Database check failed', { error });
    }
  } else {
    health.database = 'not_configured';
  }

  // Add server uptime if available
  if (typeof process.uptime === 'function') {
    health.uptime = Math.floor(process.uptime());
  }

  // Return 200 for ok, 503 for degraded/error
  const statusCode = health.status === 'ok' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

// Disable caching for real-time status
export const dynamic = 'force-dynamic';
