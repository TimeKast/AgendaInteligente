/**
 * TimeKast Factory — lint-staged Configuration
 *
 * Runs linting and formatting only on staged files
 * before each commit (via husky pre-commit hook)
 *
 * NOTE: lint-staged only runs for files that EXIST.
 * When deleting issue files, run `pnpm update-board` manually
 * or use the pre-commit hook which handles deletions.
 */
module.exports = {
  // TypeScript/JavaScript files: lint + format
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // JSON/YAML/Markdown: format only
  '*.{json,yaml,yml,md}': ['prettier --write'],

  // CSS files: format
  '*.css': ['prettier --write'],

  // Backlog Automation: Update Board when issues change
  // Matches: project/backlog/issues/*.md (flat) or project/backlog/v*/issues/*.md (milestones)
  // NOTE: Only triggers for MODIFIED/ADDED files, not DELETED (lint-staged limitation)
  'project/backlog/**/issues/*.md': [
    'prettier --write',
    'pnpm update-board',
    'git add project/backlog/BOARD.md',
  ],
};
