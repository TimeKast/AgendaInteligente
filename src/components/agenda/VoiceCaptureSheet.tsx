'use client';

/**
 * VoiceCaptureSheet — SCR-050 modal, real end-to-end voice capture.
 *
 * Pipeline:
 *   1. open → request mic permission, start MediaRecorder.
 *   2. user taps "Listo" → stop recorder, POST blob to /api/voice/transcribe.
 *   3. transcribed text → POST to /api/ai/parse-task → structured preview.
 *   4. user edits preview if needed → "Guardar" calls createActivity.
 *
 * Errors at any stage drop the user back to recording with a hint. Audio
 * is never persisted (BR-13 — Whisper route discards after transcription).
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { WaveformAnim } from './WaveformAnim';
import { PriorityDots } from './PriorityDots';
import { createActivity } from '@/lib/actions/activity';

interface VoiceCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage =
  | 'requesting_permission'
  | 'recording'
  | 'transcribing'
  | 'parsing'
  | 'preview'
  | 'saving';

interface Preview {
  title: string;
  project_id_suggestion: string | null;
  project_name_match: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  priority: number;
  deadline: string | null;
}

/** Pick the first MediaRecorder MIME the browser supports — Whisper accepts all. */
function pickMime(): string | undefined {
  if (typeof window === 'undefined' || !('MediaRecorder' in window)) return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/mpeg',
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

export function VoiceCaptureSheet({ open, onOpenChange }: VoiceCaptureSheetProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('requesting_permission');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string | undefined>(undefined);
  const timerRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  // Track open-state via ref so the async pipeline can detect a mid-flight
  // close and bail without setting state on an unmounted sheet.
  const openRef = useRef(open);

  function cleanup() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
  }

  function close() {
    cleanup();
    onOpenChange(false);
  }

  // Mount/unmount lifecycle — when `open` flips true, start mic. When it flips
  // false, release everything.
  useEffect(() => {
    openRef.current = open;
    if (!open) {
      cleanup();
      return;
    }
    // Reset stage + state on each fresh open.
    setError(null);
    setElapsed(0);
    setTranscript('');
    setPreview(null);
    setStage('requesting_permission');

    let cancelled = false;
    (async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          setError('Tu navegador no soporta captura de audio. Probá Chrome o Safari mobile.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const mime = pickMime();
        mimeRef.current = mime;
        const recorder = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorderRef.current = recorder;
        recorder.start();
        startTsRef.current = Date.now();
        timerRef.current = window.setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTsRef.current) / 1000));
        }, 250);
        setStage('recording');
      } catch (err) {
        const name = (err as { name?: string })?.name ?? '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('Permiso de micrófono denegado. Concedelo en la configuración del navegador.');
        } else {
          setError('No se pudo iniciar la grabación.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleStop() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Wait for the final data chunk before assembling the blob.
    const stopped = new Promise<void>((resolve) => {
      recorder.addEventListener('stop', () => resolve(), { once: true });
    });
    recorder.stop();
    await stopped;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (chunksRef.current.length === 0) {
      setError('No se capturó audio. Probá de nuevo.');
      setStage('recording');
      return;
    }

    setStage('transcribing');
    const mime = mimeRef.current ?? 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mime });
    const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    const form = new FormData();
    form.append('audio', new File([blob], `voice.${ext}`, { type: mime }));
    form.append('language', 'es');

    let text = '';
    try {
      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { text: string };
      text = (data.text ?? '').trim();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Transcripción falló: ${msg}`);
      setStage('recording');
      return;
    }
    if (!openRef.current) return;
    if (!text) {
      setError('No se entendió nada. Intentalo de nuevo.');
      setStage('recording');
      return;
    }
    setTranscript(text);

    setStage('parsing');
    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { preview: Record<string, unknown> };
      const p = data.preview;
      const next: Preview = {
        title: typeof p.title === 'string' ? p.title : text,
        project_id_suggestion:
          typeof p.project_id_suggestion === 'string' ? p.project_id_suggestion : null,
        project_name_match: typeof p.project_name_match === 'string' ? p.project_name_match : null,
        scheduled_date: typeof p.scheduled_date === 'string' ? p.scheduled_date : null,
        scheduled_time: typeof p.scheduled_time === 'string' ? p.scheduled_time : null,
        priority: typeof p.priority === 'number' ? p.priority : 3,
        deadline: typeof p.deadline === 'string' ? p.deadline : null,
      };
      if (!openRef.current) return;
      setPreview(next);
      setStage('preview');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`No se pudo interpretar: ${msg}`);
      setStage('recording');
    }
  }

  async function handleSave() {
    if (!preview) return;
    setStage('saving');
    const result = await createActivity({
      title: preview.title,
      projectId: preview.project_id_suggestion ?? undefined,
      priority: preview.priority,
      scheduledTime: preview.scheduled_time ? `${preview.scheduled_time}:00` : null,
      scheduledDates: preview.scheduled_date ? [preview.scheduled_date] : [],
      deadline: preview.deadline ? new Date(`${preview.deadline}T23:59:59`).toISOString() : null,
    });
    if (result.error) {
      toast.error(`No se pudo guardar: ${result.error}`);
      setStage('preview');
      return;
    }
    toast.success('Actividad guardada.');
    router.refresh();
    close();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Capturar con voz"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={close}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(42, 40, 38, 0.32)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          animation: 'ag-fade-in 200ms var(--ag-ease)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--ag-bg)',
          borderTopLeftRadius: 'var(--ag-radius-card)',
          borderTopRightRadius: 'var(--ag-radius-card)',
          padding: 'var(--ag-space-5) var(--ag-space-5) var(--ag-space-6)',
          paddingBottom: 'calc(var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -2px 10px rgba(42, 40, 38, 0.08)',
          animation: 'ag-slide-up 220ms var(--ag-ease)',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'block',
            width: 40,
            height: 4,
            borderRadius: 'var(--ag-radius-pill)',
            backgroundColor: 'var(--ag-rule)',
            margin: '0 auto var(--ag-space-4)',
          }}
        />

        {stage === 'preview' && preview ? (
          <PreviewView
            preview={preview}
            transcript={transcript}
            onChange={setPreview}
            onSave={handleSave}
            onRetry={() => {
              // Re-open: trigger the open-effect by toggling.
              cleanup();
              setPreview(null);
              setTranscript('');
              setStage('requesting_permission');
              // Defer to next tick so the effect picks up.
              window.setTimeout(() => {
                if (!openRef.current) return;
                // Manually re-run the open effect by closing+reopening logic:
                // simplest path is to just call the start sequence inline.
                (async () => {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    streamRef.current = stream;
                    const mime = pickMime();
                    mimeRef.current = mime;
                    const recorder = mime
                      ? new MediaRecorder(stream, { mimeType: mime })
                      : new MediaRecorder(stream);
                    recorder.ondataavailable = (e) => {
                      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
                    };
                    recorderRef.current = recorder;
                    recorder.start();
                    startTsRef.current = Date.now();
                    setElapsed(0);
                    timerRef.current = window.setInterval(() => {
                      setElapsed(Math.floor((Date.now() - startTsRef.current) / 1000));
                    }, 250);
                    setStage('recording');
                  } catch {
                    setError('No se pudo reiniciar la grabación.');
                  }
                })();
              }, 0);
            }}
            onCancel={close}
            saving={false}
          />
        ) : stage === 'saving' && preview ? (
          <PreviewView
            preview={preview}
            transcript={transcript}
            onChange={setPreview}
            onSave={handleSave}
            onRetry={() => {
              /* disabled while saving */
            }}
            onCancel={close}
            saving
          />
        ) : (
          <RecordingView
            stage={stage}
            elapsed={elapsed}
            error={error}
            transcript={transcript}
            onStop={handleStop}
            onCancel={close}
          />
        )}
      </div>

      <style>{keyframes}</style>
    </div>
  );
}

function RecordingView({
  stage,
  elapsed,
  error,
  transcript,
  onStop,
  onCancel,
}: {
  stage: Stage;
  elapsed: number;
  error: string | null;
  transcript: string;
  onStop: () => void;
  onCancel: () => void;
}) {
  const mins = Math.floor(elapsed / 60);
  const secs = (elapsed % 60).toString().padStart(2, '0');
  const stageLabel: Record<Stage, string> = {
    requesting_permission: 'Pidiendo permiso de micrófono…',
    recording: 'Escuchando…',
    transcribing: 'Transcribiendo…',
    parsing: 'Interpretando…',
    preview: '',
    saving: '',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-5)' }}>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
          textAlign: 'center',
        }}
      >
        {stageLabel[stage]}
      </span>

      <WaveformAnim />

      {stage === 'recording' ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 18,
            color: 'var(--ag-ink-soft)',
            textAlign: 'center',
          }}
        >
          {mins}:{secs}
        </p>
      ) : null}

      {transcript && (stage === 'parsing' || stage === 'transcribing') ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.5,
            color: 'var(--ag-ink-soft)',
            textAlign: 'center',
          }}
        >
          {transcript}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
            textAlign: 'center',
            padding: '8px 12px',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
          }}
        >
          {error}
        </p>
      ) : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--ag-space-3)',
          marginTop: 'var(--ag-space-2)',
        }}
      >
        <button type="button" onClick={onCancel} style={ghostBtn}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={stage !== 'recording'}
          style={{
            ...primaryBtn,
            opacity: stage === 'recording' ? 1 : 0.6,
            cursor: stage === 'recording' ? 'pointer' : 'not-allowed',
          }}
        >
          Listo →
        </button>
      </div>
    </div>
  );
}

function PreviewView({
  preview,
  transcript,
  onChange,
  onSave,
  onRetry,
  onCancel,
  saving,
}: {
  preview: Preview;
  transcript: string;
  onChange: (p: Preview) => void;
  onSave: () => void;
  onRetry: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-4)' }}>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontSize: 22,
          fontWeight: 500,
          color: 'var(--ag-ink-primary)',
        }}
      >
        Confirmar captura
      </h2>

      {transcript ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--ag-ink-hint)',
          }}
        >
          “{transcript}”
        </p>
      ) : null}

      <Field label="Título">
        <input
          value={preview.title}
          onChange={(e) => onChange({ ...preview, title: e.target.value })}
          disabled={saving}
          style={textInput}
        />
      </Field>

      <Field label="Proyecto">
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            color: preview.project_name_match ? 'var(--ag-ink-primary)' : 'var(--ag-ink-hint)',
            paddingBlock: 6,
            borderBottom: '1px solid var(--ag-rule)',
            fontStyle: preview.project_name_match ? 'normal' : 'italic',
          }}
        >
          {preview.project_name_match ?? 'Inbox (sin match)'}
        </span>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ag-space-3)' }}>
        <Field label="Fecha">
          <input
            type="date"
            value={preview.scheduled_date ?? ''}
            onChange={(e) => onChange({ ...preview, scheduled_date: e.target.value || null })}
            disabled={saving}
            style={textInput}
          />
        </Field>
        <Field label="Hora">
          <input
            type="time"
            value={preview.scheduled_time ?? ''}
            onChange={(e) => onChange({ ...preview, scheduled_time: e.target.value || null })}
            disabled={saving}
            style={textInput}
          />
        </Field>
      </div>

      <Field label="Prioridad">
        <button
          type="button"
          onClick={() =>
            onChange({
              ...preview,
              priority: preview.priority === 5 ? 1 : preview.priority + 1,
            })
          }
          disabled={saving}
          aria-label={`Prioridad ${preview.priority} de 5`}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
            padding: '6px 12px',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
          }}
        >
          <span
            style={{ fontFamily: 'var(--ag-font-body)', fontSize: 13, color: 'var(--ag-ink-hint)' }}
          >
            P{preview.priority}
          </span>
          <PriorityDots priority={preview.priority} />
        </button>
      </Field>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--ag-space-2)',
          flexWrap: 'wrap',
          marginTop: 'var(--ag-space-2)',
        }}
      >
        <button type="button" onClick={onCancel} disabled={saving} style={ghostBtn}>
          Cancelar
        </button>
        <button type="button" onClick={onRetry} disabled={saving} style={ghostBtn}>
          Regrabar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !preview.title.trim()}
          style={{
            ...primaryBtn,
            opacity: saving || !preview.title.trim() ? 0.6 : 1,
            cursor: saving || !preview.title.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Guardando…' : 'Guardar →'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-1)' }}>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

const textInput: React.CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--ag-rule)',
  padding: '6px 0',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  color: 'var(--ag-ink-primary)',
  outline: 'none',
  width: '100%',
};

const ghostBtn: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--ag-rule)',
  background: 'transparent',
  color: 'var(--ag-ink-soft)',
  padding: '10px 16px',
  borderRadius: 'var(--ag-radius-base)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  cursor: 'pointer',
  flex: 1,
  minWidth: 90,
};

const primaryBtn: React.CSSProperties = {
  appearance: 'none',
  border: 'none',
  background: 'var(--ag-accent-primary)',
  color: 'var(--ag-accent-on)',
  padding: '10px 16px',
  borderRadius: 'var(--ag-radius-base)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
  flex: 1,
  minWidth: 90,
};

const keyframes = `
  @keyframes ag-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes ag-slide-up {
    from { transform: translateY(16px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
`;
