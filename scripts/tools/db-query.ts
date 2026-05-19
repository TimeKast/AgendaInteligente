#!/usr/bin/env tsx
/**
 * Read-Only Database Query Runner
 *
 * Executes SQL queries against the Neon PostgreSQL database in read-only mode.
 * Blocks write operations (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, REVOKE).
 *
 * Usage:
 *   pnpm db:query "SELECT * FROM users LIMIT 5"
 *   pnpm db:query "SELECT * FROM users" --json
 *   pnpm db:query --tables
 *   pnpm db:query --describe users
 *   pnpm db:query --help
 *
 * @see project/backlog/v5.5/issues/SKT-006-db-query-runner.md
 */

import { Pool } from '@neondatabase/serverless';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedArgs {
  query: string | null;
  json: boolean;
  tables: boolean;
  describe: string | null;
  help: boolean;
}

interface QueryResult {
  rows: Record<string, unknown>[];
  fields: { name: string }[];
  rowCount: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_PREFIXES = ['SELECT', 'WITH', 'EXPLAIN', 'SHOW'] as const;

const WRITE_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'GRANT',
  'REVOKE',
] as const;

const HELP_TEXT = `
📊 db:query — Read-Only Database Query Runner

Usage:
  pnpm db:query "SQL"                    Execute a SELECT query
  pnpm db:query "SQL" --json             Output as JSON
  pnpm db:query --tables                 List all public tables
  pnpm db:query --describe <table>       Describe table columns
  pnpm db:query --help                   Show this help

Examples:
  pnpm db:query "SELECT * FROM users LIMIT 5"
  pnpm db:query "SELECT count(*) FROM users WHERE role = 'admin'"
  pnpm db:query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  pnpm db:query --tables
  pnpm db:query --describe users
  pnpm db:query "SELECT * FROM users" --json

Allowed statements: SELECT, WITH (CTEs), EXPLAIN, SHOW
Blocked: INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, REVOKE

Note: Write operations are blocked for safety. Use pnpm db:seed for data changes.
`.trim();

// ---------------------------------------------------------------------------
// Arg Parsing
// ---------------------------------------------------------------------------

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // skip node + script path
  const result: ParsedArgs = {
    query: null,
    json: false,
    tables: false,
    describe: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--json':
        result.json = true;
        break;
      case '--tables':
        result.tables = true;
        break;
      case '--describe': {
        const next = args[i + 1];
        if (!next || next.startsWith('--')) {
          console.error('❌ --describe requires a table name');
          process.exit(1);
        }
        result.describe = next;
        i++; // skip next arg
        break;
      }
      case '--help':
      case '-h':
        result.help = true;
        break;
      default:
        if (!arg.startsWith('--')) {
          result.query = arg;
        }
        break;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Query Validation
// ---------------------------------------------------------------------------

/**
 * Strip SQL comments (single-line and multi-line) from a query string.
 */
export function stripComments(sql: string): string {
  // Remove multi-line comments /* ... */
  let result = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove single-line comments -- ...
  result = result.replace(/--.*$/gm, '');
  return result.trim();
}

/**
 * Validate that a SQL query is read-only.
 * Returns null if valid, or an error message if blocked.
 */
export function validateQuery(sql: string): string | null {
  if (!sql || !sql.trim()) {
    return 'Empty query';
  }

  const cleaned = stripComments(sql);
  if (!cleaned) {
    return 'Empty query after stripping comments';
  }

  // Normalize whitespace and uppercase for prefix check
  const normalized = cleaned.replace(/\s+/g, ' ').trim().toUpperCase();

  // Check if starts with an allowed prefix
  const startsWithAllowed = ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));

  if (!startsWithAllowed) {
    return 'Write operations are not allowed. Use pnpm db:seed for data changes.';
  }

  // Check for write keywords anywhere in the query (multi-statement or CTE abuse)
  // Split by semicolons to detect multi-statement attacks
  const statements = normalized.split(';').filter((s) => s.trim().length > 0);

  for (const stmt of statements) {
    const trimmed = stmt.trim();
    // Each statement after the first must also be read-only
    const stmtStartsWithAllowed = ALLOWED_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
    if (!stmtStartsWithAllowed && trimmed.length > 0) {
      return 'Write operations are not allowed. Use pnpm db:seed for data changes.';
    }
  }

  // Check for write keywords inside CTEs: WITH x AS (UPDATE/INSERT/DELETE ...)
  // Look for write keywords after opening parens inside CTE definitions
  const cteBodyRegex = /\bAS\s*\(/gi;
  let match;
  while ((match = cteBodyRegex.exec(normalized)) !== null) {
    // Find the matching closing paren
    let depth = 1;
    let pos = match.index + match[0].length;
    while (pos < normalized.length && depth > 0) {
      if (normalized[pos] === '(') depth++;
      if (normalized[pos] === ')') depth--;
      pos++;
    }
    const cteBody = normalized.slice(match.index + match[0].length, pos - 1);
    for (const keyword of WRITE_KEYWORDS) {
      if (cteBody.includes(keyword)) {
        return 'Write operations are not allowed. Use pnpm db:seed for data changes.';
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Output Formatting
// ---------------------------------------------------------------------------

/**
 * Format query results as an ASCII table.
 */
export function formatTable(rows: Record<string, unknown>[], fields: { name: string }[]): string {
  if (fields.length === 0) {
    return '(no columns)';
  }

  const MAX_COL_WIDTH = 40;
  const columns = fields.map((f) => f.name);

  // Calculate column widths (capped at MAX_COL_WIDTH)
  const widths = columns.map((col) => {
    const headerWidth = col.length;
    const maxDataWidth = rows.reduce((max, row) => {
      const val = formatValue(row[col]);
      return Math.max(max, val.length);
    }, 0);
    return Math.min(Math.max(headerWidth, maxDataWidth), MAX_COL_WIDTH);
  });

  // Build horizontal borders
  const topBorder = '┌' + widths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐';
  const midBorder = '├' + widths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤';
  const botBorder = '└' + widths.map((w) => '─'.repeat(w + 2)).join('┴') + '┘';

  // Build header row
  const header =
    '│' +
    columns.map((col, i) => ` ${truncate(col, widths[i]).padEnd(widths[i])} `).join('│') +
    '│';

  // Build data rows
  const dataRows = rows.map(
    (row) =>
      '│' +
      columns
        .map((col, i) => ` ${truncate(formatValue(row[col]), widths[i]).padEnd(widths[i])} `)
        .join('│') +
      '│'
  );

  const parts = [topBorder, header, midBorder, ...dataRows, botBorder];
  return parts.join('\n');
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/**
 * Format query results as JSON.
 */
export function formatJson(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows, null, 2);
}

// ---------------------------------------------------------------------------
// SQL Shortcuts
// ---------------------------------------------------------------------------

const LIST_TABLES_SQL = `
  SELECT table_name, 
         pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name
`;

function describeTableSql(tableName: string): string {
  // Sanitize table name — only allow alphanumeric and underscores
  const sanitized = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  return `
    SELECT 
      column_name, 
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = '${sanitized}'
    ORDER BY ordinal_position
  `;
}

// ---------------------------------------------------------------------------
// Query Execution
// ---------------------------------------------------------------------------

async function executeQuery(pool: Pool, sql: string): Promise<QueryResult> {
  const start = performance.now();
  const result = await pool.query(sql);
  const durationMs = Math.round(performance.now() - start);

  return {
    rows: result.rows as Record<string, unknown>[],
    fields: result.fields.map((f) => ({ name: f.name })),
    rowCount: result.rowCount ?? result.rows.length,
    durationMs,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Load env vars — done here (not top-level) to avoid side effects during tests
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });

  const parsed = parseArgs(process.argv);

  // Handle --help
  if (parsed.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not configured. Set it in .env.local');
    process.exit(1);
  }

  // Determine SQL to run
  let sql: string;

  if (parsed.tables) {
    sql = LIST_TABLES_SQL;
  } else if (parsed.describe) {
    sql = describeTableSql(parsed.describe);
  } else if (parsed.query) {
    sql = parsed.query;
  } else {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Validate query
  const error = validateQuery(sql);
  if (error) {
    console.error(`❌ ${error}`);
    process.exit(1);
  }

  // Execute
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const result = await executeQuery(pool, sql);

    if (result.rows.length === 0 && parsed.describe) {
      console.error(`❌ Table '${parsed.describe}' not found in public schema`);
      process.exit(1);
    }

    // Output
    if (parsed.json) {
      console.log(formatJson(result.rows));
    } else {
      if (result.rows.length === 0) {
        console.log('(0 rows)');
      } else {
        console.log(formatTable(result.rows, result.fields));
      }
      console.log(`\n${result.rowCount} rows returned (${result.durationMs}ms)`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Query failed: ${message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Only run when executed directly (not when imported by tests)
const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('db-query.ts') || process.argv[1].endsWith('db-query'));

if (isDirectExecution) {
  main();
}
