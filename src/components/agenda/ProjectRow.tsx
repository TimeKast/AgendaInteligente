'use client';

/**
 * ProjectRow — row representing a Project in the project list (SCR-040).
 *
 * Layout (left → right):
 *   [title + category caption + activity count] [status badge] [⋯ menu] [chevron]
 *
 * Tap on the row → navigates to `/projects/[id]`.
 *
 * Variants:
 *   - Default: navigable, ⋯ menu offers Rename / Change category / Change
 *     status / Delete. All actions are visual — wiring lives in the parent
 *     page (this component just emits intents).
 *   - System (Inbox): no ⋯ menu, no actions. Still navigable.
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  MoreHorizontal,
  Pencil,
  FolderInput,
  CircleDot,
  Trash2,
} from 'lucide-react';
import { StatusBadge, type ProjectStatus } from './StatusBadge';

export interface ProjectItem {
  id: string;
  name: string;
  categoryName: string;
  status: ProjectStatus;
  /** Human-friendly deadline label, e.g. "30 jun 2026". `null` → "sin deadline". */
  deadlineLabel: string | null;
  activityCount: number;
  doneCount: number;
  /** Inbox (read-only system project). No actions; no chevron menu. */
  system?: boolean;
}

interface ProjectRowProps {
  project: ProjectItem;
  onRename?: (id: string) => void;
  onChangeCategory?: (id: string) => void;
  onChangeStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProjectRow({
  project,
  onRename,
  onChangeCategory,
  onChangeStatus,
  onDelete,
}: ProjectRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const activitySummary = project.system
    ? `${project.activityCount} ${project.activityCount === 1 ? 'actividad pendiente' : 'actividades pendientes'}`
    : `${project.activityCount} ${project.activityCount === 1 ? 'actividad' : 'actividades'} · ${project.doneCount} done`;

  return (
    <li style={{ listStyle: 'none' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
          padding: 'var(--ag-space-3) 0',
          minHeight: 64,
          borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
          position: 'relative',
        }}
      >
        {/* Title + meta — wraps in <Link> for navigation */}
        <Link
          href={`/projects/${project.id}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            gap: 2,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 15,
              color: 'var(--ag-ink-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.name}
            {project.system ? (
              <span
                style={{
                  marginLeft: 6,
                  fontFamily: 'var(--ag-font-display)',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: 'var(--ag-ink-hint)',
                }}
              >
                (default)
              </span>
            ) : null}
          </span>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.categoryName}
            {project.deadlineLabel ? ` · ${project.deadlineLabel}` : ''}
          </span>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
            }}
          >
            {activitySummary}
          </span>
        </Link>

        {/* Status badge */}
        {project.system ? (
          <span aria-hidden style={{ width: 0 }} />
        ) : (
          <StatusBadge status={project.status} />
        )}

        {/* ⋯ menu (hidden for system Inbox) */}
        {project.system ? (
          <span aria-hidden style={{ width: 30 }} />
        ) : (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              aria-label={`Acciones para ${project.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--ag-ink-soft)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 'var(--ag-radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  backgroundColor: 'var(--ag-bg)',
                  border: '1px solid var(--ag-rule)',
                  borderRadius: 'var(--ag-radius-base)',
                  boxShadow: '0 4px 16px rgba(42, 40, 38, 0.12)',
                  minWidth: 200,
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 20,
                }}
              >
                <MenuItem
                  icon={<Pencil size={14} strokeWidth={1.75} />}
                  label="Renombrar"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename?.(project.id);
                  }}
                />
                <MenuItem
                  icon={<FolderInput size={14} strokeWidth={1.75} />}
                  label="Cambiar categoría"
                  onClick={() => {
                    setMenuOpen(false);
                    onChangeCategory?.(project.id);
                  }}
                />
                <MenuItem
                  icon={<CircleDot size={14} strokeWidth={1.75} />}
                  label="Cambiar status"
                  onClick={() => {
                    setMenuOpen(false);
                    onChangeStatus?.(project.id);
                  }}
                />
                <MenuItem
                  icon={<Trash2 size={14} strokeWidth={1.75} />}
                  label="Borrar"
                  destructive
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(project.id);
                  }}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Chevron — also navigates */}
        <Link
          href={`/projects/${project.id}`}
          aria-label={`Abrir ${project.name}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ag-ink-hint)',
            padding: 4,
            textDecoration: 'none',
          }}
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </Link>
      </div>
    </li>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--ag-space-2)',
        padding: '8px 10px',
        borderRadius: 'var(--ag-radius-sm)',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 14,
        color: destructive ? 'var(--ag-danger)' : 'var(--ag-ink-primary)',
        cursor: 'pointer',
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex' }}>
        {icon}
      </span>
      {label}
    </button>
  );
}
