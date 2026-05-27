/**
 * Tests for `LiveChat` — ISSUE-052b wiring.
 *
 * Verifies that the hook + presentational components compose correctly
 * via mocked `useChatStream`. The hook itself is tested separately;
 * here we only check the rendering contract.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const sendMock = vi.fn();
const setInitialMessagesMock = vi.fn();
const resetMock = vi.fn();

const hookState = {
  messages: [] as Array<{
    id: string;
    role: 'user' | 'agent';
    content: string;
    streaming?: boolean;
    createdAt: Date;
  }>,
  toolResults: [],
  crisisExit: null as unknown,
  lastError: null as unknown,
  isStreaming: false,
  hitRoundLimit: false,
};

vi.mock('@/lib/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/lib/hooks')>('@/lib/hooks');
  return {
    ...actual,
    useChatStream: () => ({
      ...hookState,
      send: sendMock,
      setInitialMessages: setInitialMessagesMock,
      reset: resetMock,
    }),
  };
});

import { LiveChat } from '@/components/chat/LiveChat';

beforeEach(() => {
  vi.clearAllMocks();
  hookState.messages = [];
  hookState.crisisExit = null;
  hookState.lastError = null;
  hookState.isStreaming = false;
});

describe('LiveChat — rendering', () => {
  it('renders agent and user messages with appropriate roles', () => {
    hookState.messages = [
      { id: 'u1', role: 'user', content: '¿qué hago hoy?', createdAt: new Date() },
      { id: 'a1', role: 'agent', content: 'enfocate en una cosa.', createdAt: new Date() },
    ];
    render(<LiveChat />);
    expect(screen.getByText('¿qué hago hoy?')).toBeInTheDocument();
    expect(screen.getByText('enfocate en una cosa.')).toBeInTheDocument();
  });

  it('shows an ellipsis while an empty agent placeholder is streaming', () => {
    hookState.messages = [
      { id: 'a1', role: 'agent', content: '', streaming: true, createdAt: new Date() },
    ];
    render(<LiveChat />);
    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('renders the CrisisExitPanel when crisisExit is set', () => {
    hookState.crisisExit = {
      conversationId: 'c1',
      line: {
        name: 'SAPTEL',
        phone_display: '800 911 2000',
        phone_tel: '+528009112000',
        hours: '24h',
        language: 'es',
      },
    };
    render(<LiveChat />);
    expect(screen.getByText('No soy la herramienta para esto ahora.')).toBeInTheDocument();
    expect(screen.getByText('800 911 2000')).toBeInTheDocument();
  });

  it('surfaces an error message + retry hint when lastError is set', () => {
    hookState.lastError = { code: 'stream', message: 'upstream 500' };
    render(<LiveChat />);
    expect(screen.getByRole('alert')).toHaveTextContent('Algo se rompió');
  });
});

describe('LiveChat — input wiring', () => {
  it('calls send() when the user submits a message', async () => {
    render(<LiveChat />);
    const textarea = screen.getByLabelText('Mensaje');
    await userEvent.type(textarea, 'hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(sendMock).toHaveBeenCalledWith({ message: 'hola' });
  });

  it('disables the send button while streaming', () => {
    hookState.isStreaming = true;
    render(<LiveChat />);
    const sendBtn = screen.getByRole('button', { name: 'Enviar' });
    expect(sendBtn).toBeDisabled();
  });
});
