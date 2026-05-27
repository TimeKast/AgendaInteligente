/**
 * Tests for POST /api/voice/transcribe — ISSUE-072.
 *
 * Verifies the gate stack (auth → rate-limit → multipart → size →
 * MIME → upstream) + meter increment on success. NEVER persists audio.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth/auth', () => ({ auth: authMock }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const rateLimitMock = vi.fn();
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: rateLimitMock,
  rateLimitExceededResponse: () =>
    new Response(JSON.stringify({ error: 'Too Many Requests' }), { status: 429 }),
}));

const transcribeMock = vi.fn();
vi.mock('@/lib/integrations/voice/whisper', () => ({
  transcribeAudio: transcribeMock,
}));

const recordVoiceMock = vi.fn();
vi.mock('@/lib/integrations/voice/meter', () => ({
  recordVoiceUsage: recordVoiceMock,
}));

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function audioFile(bytes: number, mime = 'audio/webm'): File {
  return new File([new Uint8Array(bytes)], 'rec.webm', { type: mime });
}

function makeReq(form: FormData): Request {
  return new Request('http://test.local/api/voice/transcribe', {
    method: 'POST',
    body: form,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: USER, email: 'a@example.com', role: 'user' } });
  rateLimitMock.mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: 0 });
  transcribeMock.mockResolvedValue({ text: 'hola mundo', durationSeconds: 3 });
  recordVoiceMock.mockResolvedValue(undefined);
});

describe('POST /api/voice/transcribe — gates', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100));
    const res = await POST(makeReq(form));
    expect(res.status).toBe(401);
    expect(transcribeMock).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit exceeded', async () => {
    rateLimitMock.mockResolvedValueOnce({ success: false, limit: 60, remaining: 0, reset: 0 });
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100));
    const res = await POST(makeReq(form));
    expect(res.status).toBe(429);
    expect(transcribeMock).not.toHaveBeenCalled();
  });

  it('returns 400 when audio field missing', async () => {
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const res = await POST(makeReq(new FormData()));
    expect(res.status).toBe(400);
  });

  it('returns 413 when payload exceeds 5MB', async () => {
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(6 * 1024 * 1024)); // 6MB
    const res = await POST(makeReq(form));
    expect(res.status).toBe(413);
    expect(transcribeMock).not.toHaveBeenCalled();
  });

  it('returns 415 on unsupported MIME', async () => {
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100, 'application/pdf'));
    const res = await POST(makeReq(form));
    expect(res.status).toBe(415);
    expect(transcribeMock).not.toHaveBeenCalled();
  });

  it('accepts audio/webm + audio/mp4 + audio/ogg', async () => {
    const { POST } = await import('@/app/api/voice/transcribe/route');
    for (const mime of ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']) {
      const form = new FormData();
      form.append('audio', audioFile(100, mime));
      const res = await POST(makeReq(form));
      expect(res.status, `mime=${mime}`).toBe(200);
    }
  });

  it('accepts MIME with codecs= suffix (e.g. audio/webm;codecs=opus)', async () => {
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100, 'audio/webm;codecs=opus'));
    const res = await POST(makeReq(form));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/voice/transcribe — happy path + meters', () => {
  it('returns the transcribed text', async () => {
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100));
    const res = await POST(makeReq(form));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { text: string };
    expect(body.text).toBe('hola mundo');
  });

  it('forwards optional language hint to whisper', async () => {
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100));
    form.append('language', 'en');
    await POST(makeReq(form));

    expect(transcribeMock).toHaveBeenCalledWith(expect.any(File), { language: 'en' });
  });

  it('ignores garbage language values', async () => {
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100));
    form.append('language', 'klingon');
    await POST(makeReq(form));

    expect(transcribeMock).toHaveBeenCalledWith(expect.any(File), { language: undefined });
  });

  it('increments the voice usage meter with the reported duration', async () => {
    transcribeMock.mockResolvedValueOnce({ text: 'foo', durationSeconds: 12 });
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100));
    await POST(makeReq(form));

    expect(recordVoiceMock).toHaveBeenCalledWith(USER, 12);
  });

  it('returns 502 + does NOT meter when Whisper API throws', async () => {
    transcribeMock.mockRejectedValueOnce(new Error('upstream 500'));
    const { POST } = await import('@/app/api/voice/transcribe/route');
    const form = new FormData();
    form.append('audio', audioFile(100));
    const res = await POST(makeReq(form));

    expect(res.status).toBe(502);
    expect(recordVoiceMock).not.toHaveBeenCalled();
  });
});
