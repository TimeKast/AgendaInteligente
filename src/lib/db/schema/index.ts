/**
 * Database Schema Exports
 *
 * Central export point for all Drizzle ORM schemas.
 * This is the Single Source of Truth (SSOT) for database structure.
 */

// =============================================================================
// User & Auth Schemas
// =============================================================================
export * from './users';

// =============================================================================
// Invites Schema
// =============================================================================
export * from './invites';

// =============================================================================
// Audit Schema
// =============================================================================
export * from './audit';

// =============================================================================
// Notifications Schema
// =============================================================================
export * from './notifications';

// =============================================================================
// Rate Limiting Schema
// =============================================================================
export * from './rate-limit';

// =============================================================================
// AgendaInteligente — Notification schedule (E-002, not the kit's notif-prefs)
// =============================================================================
export * from './notification-prefs';

// =============================================================================
// AgendaInteligente — Billing scaffold (E-070, E-071, E-072)
// =============================================================================
export * from './billing';

// =============================================================================
// AgendaInteligente — Organization hierarchy (E-003 Category, E-004 Project,
// E-005 Activity)
// =============================================================================
export * from './categories';
export * from './projects';
export * from './activities';
export * from './subtasks';
export * from './day-sheets';
export * from './week-sheets';
export * from './goals';
export * from './goal-links';

// =============================================================================
// AgendaInteligente — Email verification tokens (ISSUE-004)
// =============================================================================
export * from './email-verifications';
