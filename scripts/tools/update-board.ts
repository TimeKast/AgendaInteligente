import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

/**
 * Update Board Script
 *
 * Intelligently scans `project/backlog/` and generates a hierarchical
 * `project/backlog/BOARD.md` file.
 *
 * Auto-detects structure:
 * - If milestone folders exist (v1.0, v2.1, etc.) → group by milestone
 * - If epic metadata exists → group by epic within milestone
 * - If flat structure → just show issues
 *
 * Usage: pnpm update-board
 */

const BACKLOG_DIR = 'project/backlog';
const ISSUES_GLOB = `${BACKLOG_DIR}/**/issues/*.md`;
const BOARD_FILE = path.join(BACKLOG_DIR, 'BOARD.md');

interface Issue {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done' | 'wont-do' | 'postponed';
  priority: string;
  sp: number;
  epic?: string;
  milestone?: string;
  path: string;
}

function parseStatus(content: string): Issue['status'] {
  if (content.match(/[>-] \*\*(Status|Estado):\*\*.*(✅|Completed|Completado|Done)/i))
    return 'done';
  if (content.match(/[>-] \*\*(Status|Estado):\*\*.*(In Progress|En Progreso|🚧|Working)/i))
    return 'in-progress';
  if (
    content.match(
      /[>-] \*\*(Status|Estado):\*\*.*(Won't Do|Wont Do|Cancelled|Cancelado|❌|No se hará)/i
    )
  )
    return 'wont-do';
  if (
    content.match(
      /[>-] \*\*(Status|Estado):\*\*.*(Postponed|Pospuesto|Deferred|Diferido|⏸️|Post-MVP)/i
    )
  )
    return 'postponed';
  return 'todo';
}

function parsePriority(content: string): string {
  const match = content.match(/[>-] \*\*(Priority|Prioridad):\*\* (.*)/i);
  return match ? match[2].trim() : '';
}

/** Parse Story Points from issue metadata. Returns 0 if missing or invalid. */
export function parseStoryPoints(content: string): number {
  const match = content.match(/[>-] \*\*(Story Points|SP):\*\* (\d+)/i);
  if (!match) return 0;
  const value = parseInt(match[2], 10);
  return isNaN(value) ? 0 : value;
}

function parseEpic(content: string): string | undefined {
  const match = content.match(/[>-] \*\*Epic:\*\* (.*)/i);
  return match ? match[1].trim() : undefined;
}

function parseTitle(content: string): string {
  const titleMatch = content.match(/^# ([\w-]+): (.*)$/m);
  if (!titleMatch) return 'Sin Título';

  // Prefer Issue ID from metadata over H1 prefix (handles post-rename mismatches)
  const metaIdMatch = content.match(/[>-] \*\*Issue ID:\*\* ([\w-]+)/i);
  const id = metaIdMatch ? metaIdMatch[1] : titleMatch[1];
  return `${id}: ${titleMatch[2]}`;
}

function extractMilestone(filePath: string): string | undefined {
  // Extract milestone from path like "v1.1/issues/..." or "M1/issues/..."
  const match = filePath.match(/\/?(v[\d.]+|M\d+)\//i);
  return match ? match[1] : undefined;
}

async function main() {
  console.log('📋 Updating Backlog Board...');

  const files = await glob(ISSUES_GLOB);
  const issues: Issue[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(BACKLOG_DIR, file);

    issues.push({
      id: path.basename(file, '.md'),
      title: parseTitle(content),
      status: parseStatus(content),
      priority: parsePriority(content),
      sp: parseStoryPoints(content),
      epic: parseEpic(content),
      milestone: extractMilestone(relativePath),
      path: relativePath,
    });
  }

  // Detect structure
  const hasMilestones = issues.some((i) => i.milestone);
  const hasEpics = issues.some((i) => i.epic);

  console.log(
    `  Structure: ${hasMilestones ? 'Milestones' : 'Flat'}, Epics: ${hasEpics ? 'Yes' : 'No'}`
  );

  const content = hasMilestones
    ? generateMilestoneBoard(issues, hasEpics)
    : generateFlatBoard(issues);

  fs.writeFileSync(BOARD_FILE, content);
  console.log(`✅ Board updated with ${issues.length} issues: ${BOARD_FILE}`);
}

/**
 * Auto-format a markdown table with aligned columns (prettier-style).
 * Pads each cell so columns are visually aligned in raw markdown.
 */
function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => {
    const cellWidths = rows.map((r) => (r[i] ?? '').length);
    return Math.max(h.length, ...cellWidths);
  });

  const pad = (text: string, width: number) => text + ' '.repeat(Math.max(0, width - text.length));
  const headerRow = '| ' + headers.map((h, i) => pad(h, colWidths[i])).join(' | ') + ' |';
  const separator = '|' + colWidths.map((w) => '-'.repeat(w + 2)).join('|') + '|';
  const dataRows = rows.map(
    (row) => '| ' + row.map((cell, i) => pad(cell, colWidths[i])).join(' | ') + ' |'
  );

  return [headerRow, separator, ...dataRows].join('\n') + '\n';
}

function generateMilestoneBoard(issues: Issue[], groupByEpic: boolean): string {
  // Group by milestone
  const milestones = new Map<string, Issue[]>();

  for (const issue of issues) {
    const key = issue.milestone || 'Backlog';
    if (!milestones.has(key)) milestones.set(key, []);
    milestones.get(key)!.push(issue);
  }

  // Sort milestones (newest first: v2.1 > v1.1, M2 > M1)
  const sortedMilestones = Array.from(milestones.entries()).sort((a, b) =>
    b[0].localeCompare(a[0], undefined, { numeric: true })
  );

  // === Global Summary ===
  const allInProgress = issues.filter((i) => i.status === 'in-progress');
  const allTodo = issues.filter((i) => i.status === 'todo');
  const allDone = issues.filter((i) => i.status === 'done');
  const allPostponed = issues.filter((i) => i.status === 'postponed');
  const allWontDo = issues.filter((i) => i.status === 'wont-do');

  const sumSP = (items: Issue[]) => items.reduce((s, i) => s + i.sp, 0);
  const totalSP = sumSP(issues);

  const summaryRows: string[][] = [
    ['🚧 In Progress', String(allInProgress.length), String(sumSP(allInProgress))],
    ['📅 To Do', String(allTodo.length), String(sumSP(allTodo))],
    ['✅ Done', String(allDone.length), String(sumSP(allDone))],
  ];
  if (allPostponed.length > 0)
    summaryRows.push(['⏸️ Postponed', String(allPostponed.length), String(sumSP(allPostponed))]);
  if (allWontDo.length > 0)
    summaryRows.push(["❌ Won't Do", String(allWontDo.length), String(sumSP(allWontDo))]);
  summaryRows.push([`**Total**`, `**${issues.length}**`, `**${totalSP}**`]);

  let md = `# 🚴 Sprint Board

> **Auto-generated** by \`pnpm update-board\`. Do not edit manually.

## 📊 Global Summary

`;
  md += formatTable(['Status', 'Count', 'SP'], summaryRows);
  md += '\n';

  // === Milestone Progress Table ===
  const milestoneRows: string[][] = [];
  for (const [milestone, milestoneIssues] of sortedMilestones) {
    const total = milestoneIssues.length;
    const doneCount = milestoneIssues.filter(
      (i) => i.status === 'done' || i.status === 'wont-do'
    ).length;
    const milestoneSP = milestoneIssues.reduce((sum, i) => sum + i.sp, 0);
    const pctDone = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const icon = pctDone === 100 ? '✅' : pctDone >= 80 ? '🟡' : '🔵';
    milestoneRows.push([
      `${icon} ${milestone}`,
      `${pctDone}%`,
      String(doneCount),
      String(total),
      String(milestoneSP),
    ]);
  }

  md += `### Milestones\n\n`;
  md += formatTable(['Milestone', 'Progress', 'Done', 'Total', 'SP'], milestoneRows);
  md += '\n';

  // === Straggler Detection ===
  const stragglers: { issue: Issue; milestone: string; pctDone: number }[] = [];

  for (const [milestone, milestoneIssues] of sortedMilestones) {
    const doneCount = milestoneIssues.filter(
      (i) => i.status === 'done' || i.status === 'wont-do'
    ).length;
    const pctDone = Math.round((doneCount / milestoneIssues.length) * 100);

    if (pctDone >= 80 && pctDone < 100) {
      const pending = milestoneIssues.filter(
        (i) => i.status === 'todo' || i.status === 'in-progress'
      );
      for (const issue of pending) {
        stragglers.push({ issue, milestone, pctDone });
      }
    }
  }

  if (stragglers.length > 0) {
    md += `> [!WARNING]\n`;
    md += `> **${stragglers.length} issue(s) pendiente(s) en milestones casi cerrados:**\n`;
    for (const s of stragglers) {
      md += `> - [${s.issue.title}](${s.issue.path}) — ${s.milestone} (${s.pctDone}% done)${getPriorityBadge(s.issue.priority)}\n`;
    }
    md += '\n';
  }

  md += '---\n\n';

  // === Per-Milestone Sections ===
  for (const [milestone, milestoneIssues] of sortedMilestones) {
    const inProgress = milestoneIssues.filter((i) => i.status === 'in-progress');
    const todo = milestoneIssues.filter((i) => i.status === 'todo');
    const done = milestoneIssues.filter((i) => i.status === 'done');
    const postponed = milestoneIssues.filter((i) => i.status === 'postponed');
    const wontDo = milestoneIssues.filter((i) => i.status === 'wont-do');
    const total = milestoneIssues.length;
    const doneCount = done.length + wontDo.length;
    const pctDone = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const progressBar = pctDone === 100 ? '✅' : pctDone >= 80 ? '🟡' : '🔵';

    const sectionSP = milestoneIssues.reduce((sum, i) => sum + i.sp, 0);
    md += `## ${progressBar} ${milestone} — ${pctDone}% (${doneCount}/${total}) — ${sectionSP} SP\n\n`;

    if (inProgress.length > 0) {
      md += `### 🚧 In Progress\n\n`;
      md += renderIssueList(inProgress, groupByEpic, milestone);
      md += '\n';
    }

    if (todo.length > 0) {
      md += `### 📅 To Do\n\n`;
      md += renderIssueList(todo, groupByEpic, milestone);
      md += '\n';
    }

    if (done.length > 0) {
      md += `<details>\n<summary>✅ Done (${done.length})</summary>\n\n`;
      md += renderIssueList(done, false, milestone);
      md += '</details>\n\n';
    }

    if (postponed.length > 0) {
      md += `<details>\n<summary>⏸️ Postponed (${postponed.length})</summary>\n\n`;
      md += renderIssueList(postponed, false, milestone);
      md += '</details>\n\n';
    }

    if (wontDo.length > 0) {
      md += `<details>\n<summary>❌ Won't Do (${wontDo.length})</summary>\n\n`;
      md += renderIssueList(wontDo, false, milestone);
      md += '</details>\n\n';
    }

    md += '---\n\n';
  }

  return md;
}

function generateFlatBoard(issues: Issue[]): string {
  const todo = issues.filter((i) => i.status === 'todo');
  const inProgress = issues.filter((i) => i.status === 'in-progress');
  const done = issues.filter((i) => i.status === 'done');
  const postponed = issues.filter((i) => i.status === 'postponed');
  const wontDo = issues.filter((i) => i.status === 'wont-do');

  let md = `# 🚴 Sprint Board

> **Auto-generated** by \`pnpm update-board\`. Do not edit manually.

## 🚧 In Progress (${inProgress.length})
${renderIssueList(inProgress, false)}

## 📅 To Do (${todo.length})
${renderIssueList(todo, false)}

## ✅ Done (${done.length})
${renderIssueList(done, false)}
`;

  if (postponed.length > 0) {
    md += `
## ⏸️ Postponed (${postponed.length})
${renderIssueList(postponed, false)}
`;
  }

  if (wontDo.length > 0) {
    md += `
## ❌ Won't Do (${wontDo.length})
${renderIssueList(wontDo, false)}
`;
  }

  return md;
}

function renderIssueList(issues: Issue[], groupByEpic: boolean, milestone?: string): string {
  if (issues.length === 0) return '_No issues_\n';

  if (!groupByEpic) {
    return (
      issues
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((i) => `- [${i.title}](${i.path})${getPriorityBadge(i.priority)}`)
        .join('\n') + '\n'
    );
  }

  // Group by epic
  const byEpic = new Map<string, Issue[]>();
  for (const issue of issues) {
    const key = issue.epic || 'Other';
    if (!byEpic.has(key)) byEpic.set(key, []);
    byEpic.get(key)!.push(issue);
  }

  let result = '';
  for (const [epic, epicIssues] of Array.from(byEpic.entries()).sort()) {
    if (epic !== 'Other') {
      result += `**${rebaseEpicPaths(epic, milestone)}** (${epicIssues.length})\n`;
    }
    for (const issue of epicIssues.sort((a, b) => a.id.localeCompare(b.id))) {
      result += `- [${issue.title}](${issue.path})${getPriorityBadge(issue.priority)}\n`;
    }
    result += '\n';
  }

  return result;
}

/**
 * Issue files store epic links as `](../epics/FOO.md)` — correct relative to
 * the issue (`v{X}/issues/FOO.md` → `../epics/` = `v{X}/epics/`). But BOARD.md
 * lives one level up (`project/backlog/BOARD.md`), so we rebase to
 * `v{X}/epics/FOO.md` when rendering.
 */
function rebaseEpicPaths(epicLabel: string, milestone?: string): string {
  if (!milestone) return epicLabel;
  return epicLabel.replace(/\]\(\.\.\/epics\//g, `](${milestone}/epics/`);
}

function getPriorityBadge(priority: string): string {
  if (priority.includes('P0') || priority.includes('Crítico')) return ' 🔴';
  if (priority.includes('P1')) return ' 🟡';
  return '';
}

main().catch(console.error);
