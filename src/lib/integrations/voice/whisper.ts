/**
 * Whisper transcribe wrapper — ISSUE-072.
 *
 * Thin wrapper around OpenAI's `audio.transcriptions.create`. Pure
 * function — accepts a `File`-like blob + returns the transcribed text.
 * No persistence, no audio storage (BR-13).
 *
 * Why not stream: Whisper API is sync. Audio durations capped at 30s
 * client-side keep the round-trip under ~3s for short utterances.
 *
 * Linked: BR-13, FT-072, OPS-9.
 */

import OpenAI from 'openai';
import { getOpenAIKey } from '@/lib/env';

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (cachedClient) return cachedClient;
  cachedClient = new OpenAI({ apiKey: getOpenAIKey() });
  return cachedClient;
}

export function _resetOpenAIForTests(): void {
  cachedClient = null;
}

export interface TranscribeResult {
  text: string;
  /** Server-side audio duration in seconds (rounded down). */
  durationSeconds: number;
}

/**
 * Transcribe an audio blob using Whisper. The OpenAI SDK accepts any
 * `Blob`/`File` whose `name` ends in a supported extension; we pass the
 * caller's MIME-typed File directly.
 */
export async function transcribeAudio(
  file: File,
  options: { language?: 'es' | 'en' } = {}
): Promise<TranscribeResult> {
  const client = getOpenAIClient();
  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    ...(options.language ? { language: options.language } : {}),
  });

  // verbose_json includes a `duration` (float seconds). Fall back to
  // 0 if the SDK shape changes (the meter handles 0 gracefully).
  const duration =
    typeof (response as { duration?: number }).duration === 'number'
      ? (response as { duration: number }).duration
      : 0;

  return {
    text: (response as { text: string }).text,
    durationSeconds: Math.max(0, Math.floor(duration)),
  };
}
