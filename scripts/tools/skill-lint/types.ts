export type Severity = 'error' | 'warning';

export interface Finding {
  skill: string;
  check: string;
  severity: Severity;
  message: string;
  line?: number;
  hint?: string;
}

export interface Skill {
  name: string;
  path: string;
  raw: string;
  frontmatter: Record<string, string>;
  body: string;
  bodyLines: string[];
}

export interface LintContext {
  skills: Skill[];
  skillNames: Set<string>;
  packageDeps: Set<string>;
  hooksRegistry: Set<string>;
  repoRoot: string;
}

export type Check = (skill: Skill, ctx: LintContext) => Finding[];
