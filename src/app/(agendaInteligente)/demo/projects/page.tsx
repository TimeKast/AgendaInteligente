import { Briefcase, ChevronDown } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';

type DemoProject = {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'paused' | 'waiting' | 'done';
  activeTasks: number;
  nextAction: string;
  owner: string;
  moneySignal?: string;
};

const projects: DemoProject[] = [
  {
    id: 'balanz',
    name: 'Balanz',
    category: 'Clientes recurrentes',
    status: 'active',
    activeTasks: 3,
    nextAction: 'Mandar update corto y cerrar pendientes visibles.',
    owner: 'Teddy',
    moneySignal: '$500 MXN/mes',
  },
  {
    id: 'cashflowsss',
    name: 'CashflowSSS',
    category: 'Clientes activos',
    status: 'waiting',
    activeTasks: 5,
    nextAction: 'Revisar facturas / bloqueos antes de meter features nuevas.',
    owner: 'Teddy',
  },
  {
    id: 'ner-latalmud',
    name: 'Ner La Talmud',
    category: 'Clientes activos',
    status: 'active',
    activeTasks: 4,
    nextAction: 'Confirmar siguiente entregable de plataforma educativa.',
    owner: 'Teddy',
  },
  {
    id: 'materialidad',
    name: 'Materialidad Abogados',
    category: 'Clientes activos',
    status: 'active',
    activeTasks: 2,
    nextAction: 'Definir qué falta para publicar / cobrar / cerrar fase.',
    owner: 'Teddy',
  },
  {
    id: 'agenda-inteligente',
    name: 'AgendaInteligente / Sr Bu OS',
    category: 'TimeKast',
    status: 'active',
    activeTasks: 8,
    nextAction:
      'Convertir proyectos en tablero operativo: estado, owner, riesgo, siguiente acción.',
    owner: 'Teddy + Fede',
  },
  {
    id: 'tk-remake',
    name: 'tk-remake',
    category: 'TimeKast',
    status: 'paused',
    activeTasks: 1,
    nextAction: 'No tocar hasta que clientes rojos estén cubiertos.',
    owner: 'Teddy',
  },
  {
    id: 'feedback-hq',
    name: 'Feedback-HQ',
    category: 'Productos propios',
    status: 'paused',
    activeTasks: 2,
    nextAction: 'Mantener en parking; no compite contra cobranza/entregables.',
    owner: 'Teddy',
  },
  {
    id: 'golazo',
    name: 'Golazo',
    category: 'Productos propios',
    status: 'paused',
    activeTasks: 0,
    nextAction: 'Reactivar solo con siguiente experimento comercial claro.',
    owner: 'Teddy',
  },
];

const categories = Array.from(new Set(projects.map((project) => project.category))).sort((a, b) =>
  a.localeCompare(b, 'es')
);

const statusLabel: Record<DemoProject['status'], string> = {
  active: 'Activo',
  paused: 'Pausado',
  waiting: 'Esperando',
  done: 'Cerrado',
};

const statusColor: Record<DemoProject['status'], string> = {
  active: 'var(--ag-ink-soft)',
  paused: 'var(--ag-ink-hint)',
  waiting: '#9a6a18',
  done: '#367a4b',
};

export default function DemoProjectsPage() {
  const totalTasks = projects.reduce((sum, project) => sum + project.activeTasks, 0);
  const activeProjects = projects.filter((project) => project.status === 'active').length;

  return (
    <>
      <AgendaHeader dateLabel="Proyectos" initials="TB" />
      <main
        style={{
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-4)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-5)',
          maxWidth: 1180,
          marginInline: 'auto',
          width: '100%',
        }}
      >
        <section
          style={{
            border: '1px solid var(--ag-rule)',
            borderRadius: 'calc(var(--ag-radius-base) + 6px)',
            background: 'var(--ag-bg-elevated)',
            padding: 'var(--ag-space-4)',
            display: 'grid',
            gap: 'var(--ag-space-3)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 24,
              lineHeight: 1.2,
              color: 'var(--ag-ink-primary)',
            }}
          >
            Vista demo para organizarte por proyecto: qué está activo, qué espera y cuál es la
            siguiente acción.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Metric label="proyectos activos" value={activeProjects} />
            <Metric label="tareas abiertas" value={totalTasks} />
            <Metric label="categorías" value={categories.length} />
          </div>
        </section>

        {categories.map((category) => {
          const items = projects.filter((project) => project.category === category);
          return (
            <section key={category}>
              <div
                style={{
                  paddingBlock: 'var(--ag-space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ag-slate)',
                }}
              >
                <ChevronDown size={12} strokeWidth={1.5} />
                {category}
                <span
                  style={{
                    fontFamily: 'var(--ag-font-display)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    textTransform: 'none',
                    color: 'var(--ag-ink-hint)',
                    marginLeft: 4,
                  }}
                >
                  · {items.length}
                </span>
              </div>

              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 'var(--ag-space-2)',
                }}
              >
                {items.map((project) => (
                  <li
                    key={project.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      padding: 'var(--ag-space-3)',
                      border: '1px solid var(--ag-rule)',
                      borderRadius: 'var(--ag-radius-base)',
                      backgroundColor: 'var(--ag-bg-elevated)',
                      minHeight: 154,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Briefcase size={14} strokeWidth={1.5} color="var(--ag-ink-soft)" />
                      <strong
                        style={{
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'var(--ag-font-body)',
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ag-ink-primary)',
                        }}
                      >
                        {project.name}
                      </strong>
                      <span
                        title={`${project.activeTasks} tareas abiertas`}
                        style={{
                          fontFamily: 'var(--ag-font-mono)',
                          fontSize: 11,
                          color:
                            project.activeTasks === 0 ? 'var(--ag-ink-hint)' : 'var(--ag-ink-soft)',
                          padding: '2px 8px',
                          borderRadius: 'var(--ag-radius-pill)',
                          backgroundColor:
                            project.activeTasks === 0
                              ? 'transparent'
                              : 'var(--ag-bg-sunken, var(--ag-bg))',
                          border: '1px solid var(--ag-rule)',
                          flexShrink: 0,
                        }}
                      >
                        {project.activeTasks}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Pill color={statusColor[project.status]}>{statusLabel[project.status]}</Pill>
                      <Pill>Owner: {project.owner}</Pill>
                      {project.moneySignal ? <Pill>{project.moneySignal}</Pill> : null}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        color: 'var(--ag-ink-soft)',
                        fontFamily: 'var(--ag-font-body)',
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      <span style={{ color: 'var(--ag-ink-hint)' }}>Siguiente acción: </span>
                      {project.nextAction}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        padding: '8px 12px',
        background: 'var(--ag-bg)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--ag-font-display)',
          fontSize: 22,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {value}
      </span>{' '}
      <span
        style={{ fontFamily: 'var(--ag-font-body)', fontSize: 12, color: 'var(--ag-ink-hint)' }}
      >
        {label}
      </span>
    </div>
  );
}

function Pill({
  children,
  color = 'var(--ag-ink-hint)',
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        fontFamily: 'var(--ag-font-mono)',
        fontSize: 10,
        color,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        padding: '2px 6px',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-pill)',
      }}
    >
      {children}
    </span>
  );
}
