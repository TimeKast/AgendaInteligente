/**
 * POST /api/voice/transcribe — ISSUE-072 (BR-13).
 *
 * Whisper fallback for browsers without Web Speech API (Firefox, older
 * Safari). Accepts multipart/form-data with an `audio` field, hits
 * OpenAI Whisper, returns `{ text }`. Audio is NEVER persisted (BR-13).
 *
 * Gates (in order):
 *   1. Auth required — 401 if no session.
 *   2. Rate limit — 60/hour per user (Upstash → Postgres → memory).
 *   3. Multipart `audio` field present + audio MIME type.
 *   4. Size cap 5MB (matches the client-side recorder cap).
 *
 * Errors map cleanly to HTTP: 401 / 413 / 415 / 429 / 502.
 *
 * Linked: BR-13, FT-072, OPS-9, R-T-004, R-T-007.
 */

import { auth } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { transcribeAudio } from '@/lib/integrations/voice/whisper';
import { recordVoiceUsage } from '@/lib/integrations/voice/meter';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIMES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
]);

function isAudioMime(mime: string): boolean {
  if (ALLOWED_MIMES.has(mime)) return true;
  // Some browsers append codecs= parameters; check the base type.
  const base = mime.split(';')[0].trim();
  return ALLOWED_MIMES.has(base);
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate limit keyed on the user id (cross-device / cross-IP friendly).
  const rl = await checkRateLimit(userId, 'voiceTranscribe');
  if (!rl.success) {
    return rateLimitExceededResponse(rl);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: 'invalid_form' }, { status: 400 });
  }

  const audio = form.get('audio');
  if (!(audio instanceof File)) {
    return Response.json({ error: 'missing_audio' }, { status: 400 });
  }

  if (audio.size > MAX_BYTES) {
    return Response.json({ error: 'payload_too_large' }, { status: 413 });
  }
  if (!isAudioMime(audio.type)) {
    return Response.json({ error: 'unsupported_media_type' }, { status: 415 });
  }

  const language = form.get('language');
  const lang: 'es' | 'en' | undefined =
    language === 'es' || language === 'en' ? language : undefined;

  let result: Awaited<ReturnType<typeof transcribeAudio>>;
  try {
    result = await transcribeAudio(audio, { language: lang });
  } catch (err) {
    logger.error('[api/voice/transcribe] whisper failed', err);
    return Response.json({ error: 'upstream_failed' }, { status: 502 });
  }

  // Telemetry (fire-and-forget — never block the response on a meter blip).
  try {
    await recordVoiceUsage(userId, result.durationSeconds);
  } catch (err) {
    logger.error('[api/voice/transcribe] recordVoiceUsage failed', err);
  }

  return Response.json({ text: result.text });
}
