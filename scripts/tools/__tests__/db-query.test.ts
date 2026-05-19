/**
 * Unit tests for db-query.ts
 *
 * Tests the pure functions: parseArgs, validateQuery, stripComments, formatTable, formatJson.
 * No database connection required.
 */

import { describe, it, expect } from 'vitest';
import { parseArgs, validateQuery, stripComments, formatTable, formatJson } from '../db-query';

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('parses a simple SQL query', () => {
    const result = parseArgs(['node', 'script.ts', 'SELECT * FROM users']);
    expect(result.query).toBe('SELECT * FROM users');
    expect(result.json).toBe(false);
    expect(result.tables).toBe(false);
    expect(result.describe).toBeNull();
    expect(result.help).toBe(false);
  });

  it('parses --json flag', () => {
    const result = parseArgs(['node', 'script.ts', 'SELECT 1', '--json']);
    expect(result.query).toBe('SELECT 1');
    expect(result.json).toBe(true);
  });

  it('parses --tables flag', () => {
    const result = parseArgs(['node', 'script.ts', '--tables']);
    expect(result.tables).toBe(true);
    expect(result.query).toBeNull();
  });

  it('parses --describe with table name', () => {
    const result = parseArgs(['node', 'script.ts', '--describe', 'users']);
    expect(result.describe).toBe('users');
  });

  it('parses --help flag', () => {
    const result = parseArgs(['node', 'script.ts', '--help']);
    expect(result.help).toBe(true);
  });

  it('parses -h shorthand', () => {
    const result = parseArgs(['node', 'script.ts', '-h']);
    expect(result.help).toBe(true);
  });

  it('parses combined flags', () => {
    const result = parseArgs(['node', 'script.ts', 'SELECT 1', '--json']);
    expect(result.query).toBe('SELECT 1');
    expect(result.json).toBe(true);
  });

  it('handles no arguments', () => {
    const result = parseArgs(['node', 'script.ts']);
    expect(result.query).toBeNull();
    expect(result.help).toBe(false);
    expect(result.tables).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// stripComments
// ---------------------------------------------------------------------------

describe('stripComments', () => {
  it('strips single-line comments', () => {
    expect(stripComments('SELECT 1 -- this is a comment')).toBe('SELECT 1');
  });

  it('strips multi-line comments', () => {
    expect(stripComments('SELECT /* comment */ 1')).toBe('SELECT  1');
  });

  it('strips multi-line comments spanning lines', () => {
    const sql = `SELECT 1
/* this is
a multi-line
comment */
FROM users`;
    expect(stripComments(sql)).toContain('SELECT 1');
    expect(stripComments(sql)).toContain('FROM users');
    expect(stripComments(sql)).not.toContain('multi-line');
  });

  it('handles comment-only input', () => {
    expect(stripComments('-- just a comment')).toBe('');
  });

  it('handles empty input', () => {
    expect(stripComments('')).toBe('');
  });

  it('strips malicious comments hiding write operations', () => {
    const sql = '-- DROP TABLE users\nSELECT 1';
    const result = stripComments(sql);
    expect(result).toBe('SELECT 1');
    expect(result).not.toContain('DROP');
  });
});

// ---------------------------------------------------------------------------
// validateQuery
// ---------------------------------------------------------------------------

describe('validateQuery', () => {
  describe('allowed queries', () => {
    it('allows SELECT', () => {
      expect(validateQuery('SELECT * FROM users')).toBeNull();
    });

    it('allows select (case insensitive)', () => {
      expect(validateQuery('select * from users')).toBeNull();
    });

    it('allows SELECT with whitespace', () => {
      expect(validateQuery('  SELECT * FROM users  ')).toBeNull();
    });

    it('allows WITH (CTE) followed by SELECT', () => {
      expect(validateQuery('WITH cte AS (SELECT 1) SELECT * FROM cte')).toBeNull();
    });

    it('allows EXPLAIN', () => {
      expect(validateQuery('EXPLAIN SELECT * FROM users')).toBeNull();
    });

    it('allows EXPLAIN ANALYZE', () => {
      expect(validateQuery('EXPLAIN ANALYZE SELECT * FROM users')).toBeNull();
    });

    it('allows SHOW', () => {
      expect(validateQuery('SHOW server_version')).toBeNull();
    });

    it('allows SELECT with subqueries', () => {
      expect(validateQuery('SELECT * FROM (SELECT id FROM users) sub')).toBeNull();
    });

    it('allows SELECT with comments stripped', () => {
      expect(validateQuery('-- this is a comment\nSELECT 1')).toBeNull();
    });
  });

  describe('blocked queries', () => {
    it('blocks INSERT', () => {
      expect(validateQuery('INSERT INTO users (name) VALUES (1)')).not.toBeNull();
    });

    it('blocks UPDATE', () => {
      expect(validateQuery('UPDATE users SET name = 1')).not.toBeNull();
    });

    it('blocks DELETE', () => {
      expect(validateQuery('DELETE FROM users')).not.toBeNull();
    });

    it('blocks DROP', () => {
      expect(validateQuery('DROP TABLE users')).not.toBeNull();
    });

    it('blocks ALTER', () => {
      expect(validateQuery('ALTER TABLE users ADD COLUMN x int')).not.toBeNull();
    });

    it('blocks TRUNCATE', () => {
      expect(validateQuery('TRUNCATE users')).not.toBeNull();
    });

    it('blocks CREATE', () => {
      expect(validateQuery('CREATE TABLE test (id int)')).not.toBeNull();
    });

    it('blocks GRANT', () => {
      expect(validateQuery('GRANT ALL ON users TO public')).not.toBeNull();
    });

    it('blocks REVOKE', () => {
      expect(validateQuery('REVOKE ALL ON users FROM public')).not.toBeNull();
    });
  });

  describe('multi-statement attacks', () => {
    it('blocks SELECT followed by DROP', () => {
      expect(validateQuery('SELECT 1; DROP TABLE users')).not.toBeNull();
    });

    it('blocks SELECT followed by DELETE', () => {
      expect(validateQuery('SELECT 1; DELETE FROM users')).not.toBeNull();
    });

    it('allows multiple SELECT statements', () => {
      expect(validateQuery('SELECT 1; SELECT 2')).toBeNull();
    });
  });

  describe('CTE abuse', () => {
    it('blocks CTE with UPDATE', () => {
      expect(
        validateQuery('WITH x AS (UPDATE users SET name = 1 RETURNING *) SELECT * FROM x')
      ).not.toBeNull();
    });

    it('blocks CTE with DELETE', () => {
      expect(
        validateQuery('WITH x AS (DELETE FROM users RETURNING *) SELECT * FROM x')
      ).not.toBeNull();
    });

    it('blocks CTE with INSERT', () => {
      expect(
        validateQuery('WITH x AS (INSERT INTO users (name) VALUES (1) RETURNING *) SELECT * FROM x')
      ).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('blocks empty query', () => {
      expect(validateQuery('')).not.toBeNull();
    });

    it('blocks whitespace-only query', () => {
      expect(validateQuery('   ')).not.toBeNull();
    });

    it('blocks comment-only query', () => {
      expect(validateQuery('-- just a comment')).not.toBeNull();
    });

    it('allows query with WHERE containing write keyword substring', () => {
      // "updated_at" contains "UPDATE" but this is column name, not statement
      // However our validation checks statement-level, not keyword-in-column
      expect(validateQuery("SELECT * FROM users WHERE updated_at > '2024-01-01'")).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// formatTable
// ---------------------------------------------------------------------------

describe('formatTable', () => {
  it('formats a simple table', () => {
    const rows = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const fields = [{ name: 'id' }, { name: 'name' }];
    const result = formatTable(rows, fields);

    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).toContain('┌');
    expect(result).toContain('┘');
  });

  it('handles NULL values', () => {
    const rows = [{ id: 1, name: null }];
    const fields = [{ name: 'id' }, { name: 'name' }];
    const result = formatTable(rows, fields);

    expect(result).toContain('NULL');
  });

  it('handles empty rows', () => {
    const fields = [{ name: 'id' }, { name: 'name' }];
    const result = formatTable([], fields);

    // Should still show headers
    expect(result).toContain('id');
    expect(result).toContain('name');
  });

  it('handles no columns', () => {
    const result = formatTable([], []);
    expect(result).toBe('(no columns)');
  });

  it('handles long values', () => {
    const rows = [{ description: 'A very long description that spans many characters' }];
    const fields = [{ name: 'description' }];
    const result = formatTable(rows, fields);

    expect(result).toContain('A very long description');
  });

  it('handles numeric values', () => {
    const rows = [{ count: 42, avg: 3.14 }];
    const fields = [{ name: 'count' }, { name: 'avg' }];
    const result = formatTable(rows, fields);

    expect(result).toContain('42');
    expect(result).toContain('3.14');
  });

  it('handles boolean values', () => {
    const rows = [{ active: true, deleted: false }];
    const fields = [{ name: 'active' }, { name: 'deleted' }];
    const result = formatTable(rows, fields);

    expect(result).toContain('true');
    expect(result).toContain('false');
  });

  it('handles object values as JSON', () => {
    const rows = [{ data: { key: 'value' } }];
    const fields = [{ name: 'data' }];
    const result = formatTable(rows, fields);

    expect(result).toContain('{"key":"value"}');
  });
});

// ---------------------------------------------------------------------------
// formatJson
// ---------------------------------------------------------------------------

describe('formatJson', () => {
  it('formats rows as JSON array', () => {
    const rows = [{ id: 1, name: 'Alice' }];
    const result = formatJson(rows);
    const parsed = JSON.parse(result);

    expect(parsed).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('formats empty array', () => {
    const result = formatJson([]);
    expect(JSON.parse(result)).toEqual([]);
  });

  it('is valid JSON', () => {
    const rows = [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: null, active: false },
    ];
    const result = formatJson(rows);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('preserves null values', () => {
    const rows = [{ id: 1, name: null }];
    const result = formatJson(rows);
    const parsed = JSON.parse(result);
    expect(parsed[0].name).toBeNull();
  });
});
