import { describe, it, expect } from 'vitest';
import { parseStoryPoints } from '../../scripts/tools/update-board';

describe('parseStoryPoints', () => {
  it('parses standard format: > **Story Points:** N', () => {
    const content = '> **Story Points:** 5';
    expect(parseStoryPoints(content)).toBe(5);
  });

  it('parses short format: > **SP:** N', () => {
    const content = '> **SP:** 3';
    expect(parseStoryPoints(content)).toBe(3);
  });

  it('parses with dash prefix: - **Story Points:** N', () => {
    const content = '- **Story Points:** 8';
    expect(parseStoryPoints(content)).toBe(8);
  });

  it('returns 0 when field is missing', () => {
    const content = '> **Priority:** P1\n> **Status:** 📋 Backlog';
    expect(parseStoryPoints(content)).toBe(0);
  });

  it('returns 0 for non-numeric value', () => {
    const content = '> **Story Points:** abc';
    expect(parseStoryPoints(content)).toBe(0);
  });

  it('returns 0 for empty value', () => {
    const content = '> **Story Points:** ';
    expect(parseStoryPoints(content)).toBe(0);
  });

  it('parses from full issue content with multiple metadata lines', () => {
    const content = `# TEST-001: Test Issue

> **Issue ID:** TEST-001
> **Priority:** P1
> **Effort:** M
> **Story Points:** 13
> **Status:** 📋 Backlog

## Descripción
Some description here.`;
    expect(parseStoryPoints(content)).toBe(13);
  });

  it('is case-insensitive', () => {
    const content = '> **story points:** 2';
    expect(parseStoryPoints(content)).toBe(2);
  });
});
