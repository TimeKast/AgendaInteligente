import { spawnSync } from 'child_process';

import type { Check, Finding, LintContext } from '../types';
import { extractInlineCode } from '../body-utils';

/**
 * Identifiers that look like kit-level hooks or wrappers.
 *   - useXxx         (React hook convention)
 *   - withXxx        (HOC / action wrapper convention)
 *   - auditFields / softDeleteFields / (camelCase DB helpers ending in Fields)
 *
 * We intentionally do NOT check arbitrary PascalCase identifiers — they trip on
 * generic nouns like `Dialog`, `Table`, `Link` that are legitimate prose usage.
 */
const SYMBOL_PATTERNS: RegExp[] = [
  /^use[A-Z][A-Za-z0-9]*$/,
  /^with[A-Z][A-Za-z0-9]*$/,
  /^[a-z][a-zA-Z0-9]*Fields$/,
];

const FALSE_POSITIVE_ALLOW = new Set<string>([
  // Conceptual hook names the React docs use as generic examples
  'useEffect',
  'useState',
  'useMemo',
  'useCallback',
  'useRef',
  'useContext',
  'useReducer',
  'useLayoutEffect',
  'useImperativeHandle',
  'useId',
  'useTransition',
  'useDeferredValue',
  'useSyncExternalStore',
  'useInsertionEffect',
  'useDebugValue',
  'useOptimistic',
  'useFormStatus',
  'useActionState',
  'useFormState',
  'useEffectEvent',
  // Next.js / RHF / NextAuth commonly-cited hooks
  'useRouter',
  'useSearchParams',
  'usePathname',
  'useParams',
  'useSelectedLayoutSegment',
  'useFormContext',
  'useForm',
  'useFieldArray',
  'useWatch',
  'useController',
  'useSession',
  // next-themes
  'useTheme',
]);

const grepCache = new Map<string, boolean>();

function existsInSrc(repoRoot: string, symbol: string): boolean {
  const cached = grepCache.get(symbol);
  if (cached !== undefined) return cached;

  // rg: word-boundary match against src/; fast enough (<200ms) even on cold cache
  const r = spawnSync('rg', ['--quiet', '--no-messages', '-w', `\\b${symbol}\\b`, 'src'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });

  const found = r.status === 0;
  grepCache.set(symbol, found);
  return found;
}

function isLikelySymbol(text: string): boolean {
  // Ignore text with spaces, parens, slashes — those are code expressions, not bare identifiers
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) return false;
  return SYMBOL_PATTERNS.some((re) => re.test(text));
}

/**
 * Detect mentions of hooks/wrappers in backticks that don't exist anywhere —
 * not in the HOOKS.md registry, not in React conventions, and not in src/.
 *
 * Order of resolution (cheap → expensive):
 *   1. Is it in HOOKS.md?                       → ok
 *   2. Is it an allowlisted framework hook?     → ok
 *   3. Does rg find it in src/?                 → ok
 *   4. Otherwise                                → error
 */
export const symbolsCheck: Check = (skill, ctx: LintContext): Finding[] => {
  const findings: Finding[] = [];
  const seen = new Set<string>();
  const inline = extractInlineCode(skill.body);

  for (const { text, line } of inline) {
    if (!isLikelySymbol(text)) continue;
    if (seen.has(text)) continue;
    seen.add(text);

    if (ctx.hooksRegistry.has(text)) continue;
    if (FALSE_POSITIVE_ALLOW.has(text)) continue;
    if (existsInSrc(ctx.repoRoot, text)) continue;

    findings.push({
      skill: skill.name,
      check: 'symbols',
      severity: 'error',
      message: `Symbol \`${text}\` not found in HOOKS.md nor in src/`,
      line,
      hint: `Either (a) the name is wrong — check HOOKS.md for the canonical spelling, (b) the symbol isn't shipped by the kit — move the example to a "not installed" note, or (c) it's a framework hook missing from the allowlist.`,
    });
  }

  return findings;
};
