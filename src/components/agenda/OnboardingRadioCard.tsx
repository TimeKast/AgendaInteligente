'use client';

/**
 * OnboardingRadioCard — visual radio used by language / calendar steps.
 *
 * Implementation note:
 *   Sibling sync happens via a module-level Map of subscribers, registered
 *   inside `useEffect` (lint-compliant — no module mutation during render).
 *   Each card reflects the currently selected value of its `name` group.
 *
 * Pure client state — never persisted. Selection signal: 1.5px inset
 * ink-primary stroke. No filled background to keep it editorial-light.
 */

import { useEffect, useState } from 'react';

interface OnboardingRadioCardProps {
  name: string;
  value: string;
  title: string;
  description?: string;
  defaultChecked?: boolean;
}

// Subscriber map: group name → set of `(nextValue) => void` callbacks.
const groupSubscribers = new Map<string, Set<(v: string) => void>>();
// Last selected value per group, used as initial state for late-mounted cards.
const groupLastValue = new Map<string, string>();

function broadcast(name: string, next: string) {
  groupLastValue.set(name, next);
  const subs = groupSubscribers.get(name);
  if (!subs) return;
  subs.forEach((cb) => cb(next));
}

export function OnboardingRadioCard({
  name,
  value,
  title,
  description,
  defaultChecked,
}: OnboardingRadioCardProps) {
  const [selected, setSelected] = useState<string>(() => {
    // Late-mount: pick up the group's last value if any; otherwise this card's
    // own default. This stays a pure initialiser — no module mutation.
    return groupLastValue.get(name) ?? (defaultChecked ? value : '');
  });

  // Register / unregister sibling subscriber.
  useEffect(() => {
    let subs = groupSubscribers.get(name);
    if (!subs) {
      subs = new Set();
      groupSubscribers.set(name, subs);
    }
    subs.add(setSelected);

    // Seed group's last value if not set yet (so siblings mounting later
    // pick up the initial default).
    if (defaultChecked && !groupLastValue.has(name)) {
      groupLastValue.set(name, value);
    }

    return () => {
      subs?.delete(setSelected);
    };
  }, [name, value, defaultChecked]);

  const checked = selected === value;

  return (
    <label
      style={{
        display: 'block',
        padding: 'var(--ag-space-4)',
        marginBlock: 'var(--ag-space-2)',
        borderRadius: 'var(--ag-radius-card)',
        backgroundColor: 'var(--ag-bg-elevated)',
        boxShadow: checked
          ? 'inset 0 0 0 1.5px var(--ag-ink-primary)'
          : 'inset 0 0 0 1px var(--ag-rule)',
        cursor: 'pointer',
        transition: `box-shadow var(--ag-duration-base) var(--ag-ease)`,
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => broadcast(name, value)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontSize: 17,
          fontWeight: 500,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {title}
      </h3>
      {description ? (
        <p
          style={{
            margin: '4px 0 0',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      ) : null}
    </label>
  );
}
