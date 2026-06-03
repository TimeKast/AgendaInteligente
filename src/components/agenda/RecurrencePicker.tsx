'use client';

/**
 * RecurrencePicker — inline picker for an activity's recurrence rule.
 *
 * Uses a simplified DSL (NOT real RRULE — prototype only). Values:
 *   - null                — no recurrence (default)
 *   - "daily"             — every day
 *   - "weekdays"          — every weekday (Mon-Fri)
 *   - "weekly:MO,WE,FR"   — weekly on selected ISO weekday codes
 *   - "biweekly"          — every 2 weeks
 *   - "monthly:15"        — monthly on day 15
 *   - "yearly:YYYY-MM-DD" — yearly on this date
 *   - "every:N:unit"      — every N {day|week|month|year}
 *
 * Decorative for prototype — does not materialize instances.
 */

import { useEffect, useMemo, useState } from 'react';

export type RecurrenceRule = string | null;

interface RecurrencePickerProps {
  value: RecurrenceRule;
  onChange: (next: RecurrenceRule) => void;
  /** Reference date used to seed "yearly" anniversaries. ISO YYYY-MM-DD. */
  referenceDate?: string;
}

type Preset =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

// Only presets the recurrence parser (`src/lib/domain/recurrence.ts`) can
// roundtrip are listed. `biweekly`, `yearly`, and `custom` are scaffolded
// in the type/UI plumbing but the parser doesn't accept them — they
// stayed hidden until the DSL grows.
const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: 'none', label: 'Sin recurrencia' },
  { id: 'daily', label: 'Diaria' },
  { id: 'weekdays', label: 'Cada día de la semana (L-V)' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
];

const ISO_DAYS: Array<{ code: string; label: string }> = [
  { code: 'MO', label: 'L' },
  { code: 'TU', label: 'M' },
  { code: 'WE', label: 'X' },
  { code: 'TH', label: 'J' },
  { code: 'FR', label: 'V' },
  { code: 'SA', label: 'S' },
  { code: 'SU', label: 'D' },
];

type CustomUnit = 'day' | 'week' | 'month' | 'year';

const UNIT_OPTIONS: Array<{ id: CustomUnit; label: string }> = [
  { id: 'day', label: 'día' },
  { id: 'week', label: 'semana' },
  { id: 'month', label: 'mes' },
  { id: 'year', label: 'año' },
];

function detectPreset(rule: RecurrenceRule): Preset {
  if (!rule) return 'none';
  if (rule === 'daily') return 'daily';
  // Roundtrip the L-V preset: any weekly rule that names exactly Mon-Fri
  // is rendered as the dedicated "Cada día de la semana (L-V)" preset.
  if (rule === 'weekly:MO,TU,WE,TH,FR') return 'weekdays';
  if (rule.startsWith('weekly:')) return 'weekly';
  if (rule.startsWith('monthly:')) return 'monthly';
  return 'none';
}

export function RecurrencePicker({ value, onChange, referenceDate }: RecurrencePickerProps) {
  const initialPreset = useMemo(() => detectPreset(value), [value]);
  const [preset, setPreset] = useState<Preset>(initialPreset);

  // Weekly: selected day codes
  const initialDays = useMemo(() => {
    if (value && value.startsWith('weekly:')) {
      return value.slice('weekly:'.length).split(',').filter(Boolean);
    }
    return ['MO'];
  }, [value]);
  const [weeklyDays, setWeeklyDays] = useState<string[]>(initialDays);

  // Monthly: day-of-month
  const initialMonthDay = useMemo(() => {
    if (value && value.startsWith('monthly:')) {
      const n = parseInt(value.slice('monthly:'.length), 10);
      if (Number.isFinite(n) && n >= 1 && n <= 31) return n;
    }
    if (referenceDate) {
      const d = parseInt(referenceDate.slice(8, 10), 10);
      if (Number.isFinite(d)) return d;
    }
    return 1;
  }, [value, referenceDate]);
  const [monthDay, setMonthDay] = useState<number>(initialMonthDay);

  // Yearly: ISO date
  const initialYearDate = useMemo(() => {
    if (value && value.startsWith('yearly:')) return value.slice('yearly:'.length);
    return referenceDate ?? '';
  }, [value, referenceDate]);
  const [yearDate, setYearDate] = useState<string>(initialYearDate);

  // Custom: every N unit
  const initialCustom = useMemo(() => {
    if (value && value.startsWith('every:')) {
      const [, nStr, unit] = value.split(':');
      const n = parseInt(nStr, 10);
      const u = (unit as CustomUnit) ?? 'day';
      return { n: Number.isFinite(n) && n >= 1 ? n : 1, unit: u };
    }
    return { n: 2, unit: 'day' as CustomUnit };
  }, [value]);
  const [customN, setCustomN] = useState<number>(initialCustom.n);
  const [customUnit, setCustomUnit] = useState<CustomUnit>(initialCustom.unit);

  // Recompute rule whenever preset / sub-state changes.
  useEffect(() => {
    const next = buildRule(preset, {
      weeklyDays,
      monthDay,
      yearDate,
      customN,
      customUnit,
    });
    if (next !== value) {
      onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, weeklyDays, monthDay, yearDate, customN, customUnit]);

  function toggleDay(code: string) {
    setWeeklyDays((days) =>
      days.includes(code) ? days.filter((d) => d !== code) : [...days, code]
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
      }}
    >
      <select
        value={preset}
        onChange={(e) => setPreset(e.target.value as Preset)}
        aria-label="Preset de recurrencia"
        style={{
          appearance: 'none',
          backgroundColor: 'var(--ag-bg)',
          border: '1px solid var(--ag-rule)',
          borderRadius: 'var(--ag-radius-base)',
          padding: '8px 12px',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          color: 'var(--ag-ink-primary)',
          outline: 'none',
        }}
      >
        {PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      {preset === 'weekly' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ISO_DAYS.map((d) => {
            const active = weeklyDays.includes(d.code);
            return (
              <button
                key={d.code}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDay(d.code)}
                style={{
                  appearance: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--ag-radius-pill)',
                  border: `1px solid ${active ? 'var(--ag-ink-primary)' : 'var(--ag-rule)'}`,
                  backgroundColor: active ? 'var(--ag-ink-primary)' : 'transparent',
                  color: active ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                  transition:
                    'background-color var(--ag-duration-base) var(--ag-ease), color var(--ag-duration-base) var(--ag-ease)',
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {preset === 'monthly' ? (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
          }}
        >
          <span>Día del mes</span>
          <input
            type="number"
            min={1}
            max={31}
            value={monthDay}
            onChange={(e) =>
              setMonthDay(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))
            }
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '6px 10px',
              width: 72,
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 14,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
            }}
          />
        </label>
      ) : null}

      {preset === 'yearly' ? (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
          }}
        >
          <span>Fecha</span>
          <input
            type="date"
            value={yearDate}
            onChange={(e) => setYearDate(e.target.value)}
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '6px 10px',
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 14,
              color: yearDate ? 'var(--ag-ink-primary)' : 'var(--ag-ink-hint)',
              fontStyle: yearDate ? 'normal' : 'italic',
              outline: 'none',
            }}
          />
        </label>
      ) : null}

      {preset === 'custom' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-soft)',
            }}
          >
            Cada
          </span>
          <input
            type="number"
            min={1}
            max={99}
            value={customN}
            onChange={(e) =>
              setCustomN(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))
            }
            aria-label="Cantidad"
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '6px 10px',
              width: 64,
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 14,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
            }}
          />
          <select
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value as CustomUnit)}
            aria-label="Unidad"
            style={{
              appearance: 'none',
              backgroundColor: 'var(--ag-bg)',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '6px 10px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
            }}
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          <span
            style={{
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
            }}
          >
            {customN === 1 ? '' : 's'}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function buildRule(
  preset: Preset,
  args: {
    weeklyDays: string[];
    monthDay: number;
    yearDate: string;
    customN: number;
    customUnit: CustomUnit;
  }
): RecurrenceRule {
  switch (preset) {
    case 'none':
      return null;
    case 'daily':
      return 'daily';
    case 'weekdays':
      // Map the "L-V" preset to the parser-accepted weekly form.
      return 'weekly:MO,TU,WE,TH,FR';
    case 'weekly': {
      const days = args.weeklyDays.length > 0 ? args.weeklyDays : ['MO'];
      // Preserve canonical ISO order.
      const ordered = ISO_DAYS.map((d) => d.code).filter((c) => days.includes(c));
      return `weekly:${ordered.join(',')}`;
    }
    case 'monthly':
      return `monthly:${args.monthDay}`;
    case 'biweekly':
    case 'yearly':
    case 'custom':
      // Not supported by the parser yet — keep the case here so the
      // exhaustive switch typechecks; the UI hides these presets.
      return null;
    default:
      return null;
  }
}

const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const DAY_LABELS_BY_CODE: Record<string, string> = {
  MO: 'L',
  TU: 'M',
  WE: 'X',
  TH: 'J',
  FR: 'V',
  SA: 'S',
  SU: 'D',
};

const UNIT_LABELS: Record<CustomUnit, { singular: string; plural: string }> = {
  day: { singular: 'día', plural: 'días' },
  week: { singular: 'semana', plural: 'semanas' },
  month: { singular: 'mes', plural: 'meses' },
  year: { singular: 'año', plural: 'años' },
};

/**
 * Render a recurrence rule as Spanish-neutral human text.
 * Returns "Una vez" for null. Falls back to the raw rule if unknown.
 */
export function formatRecurrence(rule: RecurrenceRule): string {
  if (!rule) return 'Una vez';
  if (rule === 'daily') return 'Todos los días';
  if (rule === 'weekly:MO,TU,WE,TH,FR') return 'Cada día de la semana (L-V)';
  if (rule.startsWith('weekly:')) {
    const codes = rule.slice('weekly:'.length).split(',').filter(Boolean);
    if (codes.length === 0) return 'Semanal';
    const labels = codes.map((c) => DAY_LABELS_BY_CODE[c] ?? c);
    return labels.join(', ');
  }
  if (rule.startsWith('monthly:')) {
    const day = rule.slice('monthly:'.length);
    return `Día ${day} de cada mes`;
  }
  if (rule.startsWith('yearly:')) {
    const iso = rule.slice('yearly:'.length);
    const [, m, d] = iso.split('-');
    const month = SPANISH_MONTHS[parseInt(m, 10) - 1];
    if (!month) return 'Anual';
    return `${parseInt(d, 10)} de ${month}, cada año`;
  }
  if (rule.startsWith('every:')) {
    const [, nStr, unit] = rule.split(':');
    const n = parseInt(nStr, 10) || 1;
    const u = (unit as CustomUnit) ?? 'day';
    const label = UNIT_LABELS[u] ?? UNIT_LABELS.day;
    return `Cada ${n} ${n === 1 ? label.singular : label.plural}`;
  }
  return rule;
}
