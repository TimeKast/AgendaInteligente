'use client';

/**
 * NotificationsClient — schedule + channels editor.
 *
 * Scope: daily check-in times, weekly kickoff/review, weekend skip,
 * push/email toggles, contact channels. All persist via
 * updateNotificationPrefs (single transaction-ish call that splits
 * across notification_prefs + users.contact_channels).
 *
 * Discord webhook lives on /settings/integrations (separate form).
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateNotificationPrefs } from '@/lib/actions/notification-prefs';
import { defaultCopy, type DailySlot } from '@/lib/notifications/check-in-defaults';

const DOW_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const CHANNEL_OPTIONS = [
  { value: 'email' as const, label: 'Email' },
  { value: 'discord' as const, label: 'Discord' },
  { value: 'whatsapp' as const, label: 'WhatsApp', disabled: true },
];

interface Props {
  initial: {
    morningTime: string;
    middayTime: string;
    eveningTime: string;
    weeklyKickoffDow: number;
    weeklyKickoffTime: string;
    weeklyReviewDow: number;
    weeklyReviewTime: string;
    weekendSkip: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    contactChannels: string[];
    morningTitle: string | null;
    morningBody: string | null;
    middayTitle: string | null;
    middayBody: string | null;
    eveningTitle: string | null;
    eveningBody: string | null;
    nagIntervalMinutes: number;
  };
}

// Allowed nag intervals (minutes) + their human labels. 0 = disabled.
// Must stay in sync with NAG_INTERVAL_VALUES in
// `lib/validations/notification-prefs.ts`.
const NAG_INTERVAL_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Desactivado (solo mañana + noche)' },
  { value: 15, label: 'Cada 15 minutos' },
  { value: 30, label: 'Cada 30 minutos' },
  { value: 60, label: 'Cada 1 hora' },
  { value: 120, label: 'Cada 2 horas' },
  { value: 240, label: 'Cada 4 horas' },
];

function trimSeconds(t: string): string {
  return t.slice(0, 5);
}

export function NotificationsClient({ initial }: Props) {
  const router = useRouter();
  const [morning, setMorning] = useState(trimSeconds(initial.morningTime));
  // `midday_time` is legacy: the midday slot no longer fires on a fixed
  // time of day — it nags after morning. We still round-trip the column
  // (no UI surface) so existing data isn't lost.
  const [midday] = useState(trimSeconds(initial.middayTime));
  const [evening, setEvening] = useState(trimSeconds(initial.eveningTime));
  const [kickoffDow, setKickoffDow] = useState(initial.weeklyKickoffDow);
  const [kickoffTime, setKickoffTime] = useState(trimSeconds(initial.weeklyKickoffTime));
  const [reviewDow, setReviewDow] = useState(initial.weeklyReviewDow);
  const [reviewTime, setReviewTime] = useState(trimSeconds(initial.weeklyReviewTime));
  const [weekendSkip, setWeekendSkip] = useState(initial.weekendSkip);
  const [pushEnabled, setPushEnabled] = useState(initial.pushEnabled);
  const [emailEnabled, setEmailEnabled] = useState(initial.emailEnabled);
  const [channels, setChannels] = useState<string[]>(initial.contactChannels);
  const [morningTitle, setMorningTitle] = useState(initial.morningTitle ?? '');
  const [morningBody, setMorningBody] = useState(initial.morningBody ?? '');
  const [middayTitle, setMiddayTitle] = useState(initial.middayTitle ?? '');
  const [middayBody, setMiddayBody] = useState(initial.middayBody ?? '');
  const [eveningTitle, setEveningTitle] = useState(initial.eveningTitle ?? '');
  const [eveningBody, setEveningBody] = useState(initial.eveningBody ?? '');
  const [nagInterval, setNagInterval] = useState<number>(initial.nagIntervalMinutes);
  const [isPending, startTransition] = useTransition();

  function toggleChannel(c: string, on: boolean) {
    setChannels((prev) => (on ? [...new Set([...prev, c])] : prev.filter((x) => x !== c)));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateNotificationPrefs({
        morningTime: morning,
        middayTime: midday,
        eveningTime: evening,
        weeklyKickoffDow: kickoffDow,
        weeklyKickoffTime: kickoffTime,
        weeklyReviewDow: reviewDow,
        weeklyReviewTime: reviewTime,
        weekendSkip,
        pushEnabled,
        emailEnabled,
        contactChannels: channels.filter(
          (c) => c === 'email' || c === 'discord' || c === 'whatsapp'
        ),
        // Empty string → action persists null and the handler falls
        // back to the default copy from check-in-defaults.
        morningTitle,
        morningBody,
        middayTitle,
        middayBody,
        eveningTitle,
        eveningBody,
        nagIntervalMinutes: nagInterval,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }
      toast.success('Preferencias guardadas.');
      router.refresh();
    });
  }

  return (
    <main
      style={{
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'var(--ag-space-4)',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-5)',
      }}
    >
      <Section title="Check-ins diarios">
        <TimeRow label="Mañana" value={morning} onChange={setMorning} disabled={isPending} />
        <TimeRow label="Noche" value={evening} onChange={setEvening} disabled={isPending} />
        <ToggleRow
          label="Saltar fines de semana"
          value={weekendSkip}
          onChange={setWeekendSkip}
          disabled={isPending}
        />
      </Section>

      <Section title="Insistencia">
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-soft)',
            lineHeight: 1.4,
          }}
        >
          Después del check-in de la mañana, si no entrás a la app te volvemos a avisar cada cierto
          tiempo. La cadena se detiene en cuanto abrís cualquier pantalla. La noche siempre se
          manda, sin importar si ya entraste.
        </p>
        <SelectRow
          label="Recordar cada"
          value={nagInterval}
          options={NAG_INTERVAL_OPTIONS}
          onChange={setNagInterval}
          disabled={isPending}
        />
      </Section>

      <Section title="Mensajes personalizados">
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-soft)',
            lineHeight: 1.4,
          }}
        >
          Dejá los campos vacíos para usar el mensaje por defecto. En el de insistencia podés
          escribir{' '}
          <code
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 12,
              padding: '0 4px',
              backgroundColor: 'var(--ag-bg-sunken, var(--ag-bg))',
              borderRadius: 'var(--ag-radius-xs)',
            }}
          >
            {'{win}'}
          </code>{' '}
          y se reemplaza por tu win planeado del día.
        </p>
        <CopyRow
          slot="morning"
          label="Mañana"
          title={morningTitle}
          body={morningBody}
          onTitle={setMorningTitle}
          onBody={setMorningBody}
          disabled={isPending}
        />
        <CopyRow
          slot="midday"
          label="Insistencia"
          title={middayTitle}
          body={middayBody}
          onTitle={setMiddayTitle}
          onBody={setMiddayBody}
          disabled={isPending}
        />
        <CopyRow
          slot="evening"
          label="Noche"
          title={eveningTitle}
          body={eveningBody}
          onTitle={setEveningTitle}
          onBody={setEveningBody}
          disabled={isPending}
        />
      </Section>

      <Section title="Semanal">
        <DowTimeRow
          label="Kickoff"
          dow={kickoffDow}
          time={kickoffTime}
          onDow={setKickoffDow}
          onTime={setKickoffTime}
          disabled={isPending}
        />
        <DowTimeRow
          label="Review"
          dow={reviewDow}
          time={reviewTime}
          onDow={setReviewDow}
          onTime={setReviewTime}
          disabled={isPending}
        />
      </Section>

      <Section title="Canales">
        {CHANNEL_OPTIONS.map((c) => (
          <ToggleRow
            key={c.value}
            label={c.label + (c.disabled ? ' · Próximamente' : '')}
            value={channels.includes(c.value)}
            onChange={(v) => toggleChannel(c.value, v)}
            disabled={isPending || c.disabled === true}
          />
        ))}
      </Section>

      <Section title="Transporte">
        <ToggleRow
          label="Notificaciones push (navegador)"
          value={pushEnabled}
          onChange={setPushEnabled}
          disabled={isPending}
        />
        <ToggleRow
          label="Email fallback (cuando no abres la app)"
          value={emailEnabled}
          onChange={setEmailEnabled}
          disabled={isPending}
        />
      </Section>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          paddingBlock: 'var(--ag-space-3)',
          paddingBottom: 'calc(var(--ag-space-3) + env(safe-area-inset-bottom, 0px))',
          backgroundColor: 'var(--ag-bg)',
          borderTop: '1px solid var(--ag-rule)',
          marginInline: 'calc(var(--ag-space-4) * -1)',
          paddingInline: 'var(--ag-space-4)',
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          style={{
            appearance: 'none',
            width: '100%',
            padding: '14px 20px',
            border: 'none',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: 'var(--ag-accent-primary)',
            color: 'var(--ag-accent-on)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            fontWeight: 500,
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Guardando…' : 'Guardar preferencias'}
        </button>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
        {children}
      </div>
    </section>
  );
}

function TimeRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
      }}
    >
      <span
        style={{ fontFamily: 'var(--ag-font-body)', fontSize: 14, color: 'var(--ag-ink-primary)' }}
      >
        {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          appearance: 'none',
          padding: '6px 8px',
          border: '1px solid var(--ag-rule)',
          borderRadius: 'var(--ag-radius-base)',
          backgroundColor: 'var(--ag-bg)',
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 14,
        }}
      />
    </label>
  );
}

function DowTimeRow({
  label,
  dow,
  time,
  onDow,
  onTime,
  disabled,
}: {
  label: string;
  dow: number;
  time: string;
  onDow: (v: number) => void;
  onTime: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 'var(--ag-space-3)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
      }}
    >
      <span
        style={{ fontFamily: 'var(--ag-font-body)', fontSize: 14, color: 'var(--ag-ink-primary)' }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={dow}
          onChange={(e) => onDow(Number(e.target.value))}
          disabled={disabled}
          style={{
            padding: '6px 8px',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: 'var(--ag-bg)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
          }}
        >
          {DOW_LABELS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={time}
          onChange={(e) => onTime(e.target.value)}
          disabled={disabled}
          style={{
            padding: '6px 8px',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: 'var(--ag-bg)',
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 13,
          }}
        />
      </div>
    </div>
  );
}

function SelectRow<T extends number | string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--ag-space-3)',
        padding: '10px 12px',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
      }}
    >
      <span
        style={{ fontFamily: 'var(--ag-font-body)', fontSize: 14, color: 'var(--ag-ink-primary)' }}
      >
        {label}
      </span>
      <select
        value={String(value)}
        onChange={(e) => {
          const next = e.target.value;
          const match = options.find((o) => String(o.value) === next);
          if (match) onChange(match.value);
        }}
        disabled={disabled}
        style={{
          appearance: 'none',
          padding: '6px 28px 6px 10px',
          border: '1px solid var(--ag-rule)',
          borderRadius: 'var(--ag-radius-base)',
          backgroundColor: 'var(--ag-bg)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          color: 'var(--ag-ink-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CopyRow({
  slot,
  label,
  title,
  body,
  onTitle,
  onBody,
  disabled,
}: {
  slot: DailySlot;
  label: string;
  title: string;
  body: string;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  disabled: boolean;
}) {
  const defaults = defaultCopy(slot, 'es');
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 'var(--ag-space-3)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
      }}
    >
      <span
        style={{ fontFamily: 'var(--ag-font-body)', fontSize: 14, color: 'var(--ag-ink-primary)' }}
      >
        {label}
      </span>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder={defaults.title}
        maxLength={80}
        disabled={disabled}
        style={{
          padding: '6px 8px',
          border: '1px solid var(--ag-rule)',
          borderRadius: 'var(--ag-radius-base)',
          backgroundColor: 'var(--ag-bg)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          outline: 'none',
        }}
      />
      <textarea
        value={body}
        onChange={(e) => onBody(e.target.value)}
        placeholder={defaults.body}
        rows={2}
        maxLength={280}
        disabled={disabled}
        style={{
          padding: '6px 8px',
          border: '1px solid var(--ag-rule)',
          borderRadius: 'var(--ag-radius-base)',
          backgroundColor: 'var(--ag-bg)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          resize: 'vertical',
          outline: 'none',
        }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        style={{ fontFamily: 'var(--ag-font-body)', fontSize: 14, color: 'var(--ag-ink-primary)' }}
      >
        {label}
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ width: 18, height: 18, accentColor: 'var(--ag-ink-primary)' }}
      />
    </label>
  );
}
