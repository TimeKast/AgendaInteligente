'use client';

/**
 * Category detail page — `/categories/[id]`.
 *
 * Visual-only prototype. Hardcoded demo data per category id (with a generic
 * fallback for unknown ids). Shows the category's projects + a "+ Nuevo
 * proyecto" affordance that opens NewProjectModal pre-filled with this
 * category (lockCategory=true).
 *
 * Inbox variant: button disabled, italic caption explaining the rule.
 */

import { use, useEffect, useState } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { ProjectRow, type ProjectItem } from '@/components/agenda/ProjectRow';
import { NewProjectModal } from '@/components/agenda/NewProjectModal';
import { CATEGORY_COLORS, type CategoryColorId } from '@/components/agenda/ColorPicker';
import { CATEGORY_ICONS, type CategoryIconId } from '@/components/agenda/IconPicker';

interface CategoryDemo {
  id: string;
  name: string;
  color: CategoryColorId;
  icon: CategoryIconId;
  system?: boolean;
  projects: ProjectItem[];
}

const DEMO_CATEGORIES: Record<string, CategoryDemo> = {
  'cat-1': {
    id: 'cat-1',
    name: 'Personal',
    color: 'sage',
    icon: 'user',
    projects: [
      {
        id: 'prj-p1',
        name: 'Hábito de lectura nocturna',
        categoryName: 'Personal',
        status: 'active',
        deadlineLabel: '30 jun 2026',
        activityCount: 7,
        doneCount: 3,
      },
      {
        id: 'prj-p2',
        name: 'Mudanza al departamento nuevo',
        categoryName: 'Personal',
        status: 'active',
        deadlineLabel: '15 jul 2026',
        activityCount: 12,
        doneCount: 4,
      },
      {
        id: 'prj-p3',
        name: 'Rutina de gimnasio',
        categoryName: 'Personal',
        status: 'paused',
        deadlineLabel: null,
        activityCount: 5,
        doneCount: 1,
      },
      {
        id: 'prj-p4',
        name: 'Ahorro vacaciones diciembre',
        categoryName: 'Personal',
        status: 'active',
        deadlineLabel: '1 dic 2026',
        activityCount: 4,
        doneCount: 2,
      },
      {
        id: 'prj-p5',
        name: 'Cumpleaños mamá',
        categoryName: 'Personal',
        status: 'completed',
        deadlineLabel: '20 abr 2026',
        activityCount: 3,
        doneCount: 3,
      },
    ],
  },
  'cat-2': {
    id: 'cat-2',
    name: 'Empresa Genomma',
    color: 'steel-blue',
    icon: 'briefcase',
    projects: [
      {
        id: 'prj-g1',
        name: 'Q2 KPIs dashboard',
        categoryName: 'Empresa Genomma',
        status: 'active',
        deadlineLabel: '30 jun 2026',
        activityCount: 14,
        doneCount: 6,
      },
      {
        id: 'prj-g2',
        name: 'Onboarding team marketing',
        categoryName: 'Empresa Genomma',
        status: 'active',
        deadlineLabel: '12 jul 2026',
        activityCount: 9,
        doneCount: 2,
      },
      {
        id: 'prj-g3',
        name: 'Auditoría procesos finanzas',
        categoryName: 'Empresa Genomma',
        status: 'paused',
        deadlineLabel: null,
        activityCount: 6,
        doneCount: 1,
      },
      {
        id: 'prj-g4',
        name: 'Roadmap producto 2027',
        categoryName: 'Empresa Genomma',
        status: 'active',
        deadlineLabel: '1 sep 2026',
        activityCount: 11,
        doneCount: 3,
      },
    ],
  },
  'cat-3': {
    id: 'cat-3',
    name: 'Side project Web3',
    color: 'terracotta',
    icon: 'zap',
    projects: [
      {
        id: 'prj-w1',
        name: 'Smart contract escrow',
        categoryName: 'Side project Web3',
        status: 'active',
        deadlineLabel: '30 ago 2026',
        activityCount: 8,
        doneCount: 2,
      },
      {
        id: 'prj-w2',
        name: 'Landing page beta',
        categoryName: 'Side project Web3',
        status: 'active',
        deadlineLabel: '15 jun 2026',
        activityCount: 6,
        doneCount: 4,
      },
      {
        id: 'prj-w3',
        name: 'Investor deck v2',
        categoryName: 'Side project Web3',
        status: 'paused',
        deadlineLabel: null,
        activityCount: 4,
        doneCount: 1,
      },
      {
        id: 'prj-w4',
        name: 'Whitepaper traducción ES',
        categoryName: 'Side project Web3',
        status: 'completed',
        deadlineLabel: '5 may 2026',
        activityCount: 3,
        doneCount: 3,
      },
    ],
  },
  'cat-inbox': {
    id: 'cat-inbox',
    name: 'Inbox',
    color: 'taupe',
    icon: 'folder',
    system: true,
    projects: [
      {
        id: 'prj-inbox',
        name: 'Inbox',
        categoryName: 'Inbox',
        status: 'active',
        deadlineLabel: null,
        activityCount: 0,
        doneCount: 0,
        system: true,
      },
    ],
  },
};

function getCategory(id: string): CategoryDemo {
  return (
    DEMO_CATEGORIES[id] ?? {
      id,
      name: 'Categoría',
      color: 'sage',
      icon: 'folder',
      projects: [
        {
          id: 'prj-demo-1',
          name: 'Proyecto demo 1',
          categoryName: 'Categoría',
          status: 'active',
          deadlineLabel: '30 jun 2026',
          activityCount: 5,
          doneCount: 2,
        },
        {
          id: 'prj-demo-2',
          name: 'Proyecto demo 2',
          categoryName: 'Categoría',
          status: 'paused',
          deadlineLabel: null,
          activityCount: 3,
          doneCount: 0,
        },
        {
          id: 'prj-demo-3',
          name: 'Proyecto demo 3',
          categoryName: 'Categoría',
          status: 'active',
          deadlineLabel: '12 ago 2026',
          activityCount: 7,
          doneCount: 4,
        },
        {
          id: 'prj-demo-4',
          name: 'Proyecto demo 4',
          categoryName: 'Categoría',
          status: 'completed',
          deadlineLabel: '1 abr 2026',
          activityCount: 4,
          doneCount: 4,
        },
      ],
    }
  );
}

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const initial = getCategory(id);

  const [projects, setProjects] = useState<ProjectItem[]>(initial.projects);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const colorMeta =
    CATEGORY_COLORS.find((c) => c.id === initial.color) ?? CATEGORY_COLORS[0];
  const iconMeta =
    CATEGORY_ICONS.find((i) => i.id === initial.icon) ?? CATEGORY_ICONS[0];
  const IconComponent = iconMeta.Icon;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const isInbox = !!initial.system;
  const projectCount = projects.length;

  return (
    <>
      <AgendaHeader
        dateLabel={initial.name}
        backHref="/categories"
        rightSlot={
          <button
            type="button"
            onClick={() => {
              if (isInbox) return;
              setCreateKey((k) => k + 1);
              setCreateOpen(true);
            }}
            disabled={isInbox}
            title={
              isInbox
                ? 'Inbox no admite proyectos manuales'
                : 'Crear proyecto en esta categoría'
            }
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: isInbox ? 'var(--ag-ink-hint)' : 'var(--ag-ink-soft)',
              cursor: isInbox ? 'not-allowed' : 'pointer',
              padding: 'var(--ag-space-2)',
              opacity: isInbox ? 0.5 : 1,
            }}
          >
            + Nuevo proyecto
          </button>
        }
      />

      <main
        className="ag-page-wide"
        style={{
          paddingInline: 'var(--ag-space-4)',
          paddingBottom:
            'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Header section: color swatch + icon + name large + project count */}
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ag-space-4)',
            paddingTop: 'var(--ag-space-5)',
            paddingBottom: 'var(--ag-space-4)',
            borderBottom: '1px solid var(--ag-rule)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--ag-radius-base)',
              backgroundColor: colorMeta.hex,
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent size={28} strokeWidth={1.5} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontSize: 26,
                fontWeight: 500,
                lineHeight: 1.2,
                color: 'var(--ag-ink-primary)',
                letterSpacing: '-0.005em',
              }}
            >
              {initial.name}
            </h2>
            <span
              style={{
                marginTop: 2,
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                color: 'var(--ag-ink-hint)',
              }}
            >
              {projectCount}{' '}
              {projectCount === 1 ? 'proyecto' : 'proyectos'}
            </span>
          </div>
        </section>

        {/* Inbox caption */}
        {isInbox ? (
          <p
            style={{
              margin: 'var(--ag-space-3) 0 0 0',
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--ag-ink-hint)',
            }}
          >
            Inbox no acepta proyectos manuales — es el destino default.
          </p>
        ) : null}

        {/* PROYECTOS section */}
        <section style={{ marginTop: 'var(--ag-space-5)' }}>
          <h3
            style={{
              margin: '0 0 var(--ag-space-2) 0',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: 'var(--ag-ink-hint)',
              textTransform: 'uppercase',
            }}
          >
            Proyectos
          </h3>

          {projects.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: 'var(--ag-space-5) 0',
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ag-ink-hint)',
                textAlign: 'center',
              }}
            >
              Sin proyectos todavía.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {projects.map((prj) => (
                <ProjectRow key={prj.id} project={prj} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <NewProjectModal
        key={createKey}
        open={createOpen}
        categories={[{ id: initial.id, name: initial.name }]}
        defaultCategoryName={initial.name}
        lockCategory
        onCancel={() => setCreateOpen(false)}
        onCreate={(payload) => {
          setCreateOpen(false);
          setProjects((items) => [
            ...items,
            {
              id: `prj-${Date.now()}`,
              name: payload.name,
              categoryName: initial.name,
              status: payload.status,
              deadlineLabel: payload.deadline || null,
              activityCount: 0,
              doneCount: 0,
            },
          ]);
          setToast(`Proyecto creado en ${initial.name}.`);
        }}
      />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(64px + 24px + env(safe-area-inset-bottom, 0px))',
            zIndex: 80,
            backgroundColor: 'var(--ag-ink-primary)',
            color: 'var(--ag-accent-on)',
            padding: '10px 16px',
            borderRadius: 'var(--ag-radius-pill)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            boxShadow:
              '0 1px 2px rgba(42, 40, 38, 0.12), 0 2px 6px rgba(42, 40, 38, 0.08)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
