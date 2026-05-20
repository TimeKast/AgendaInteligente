/**
 * SCR-058 — Crisis exit screen demo.
 *
 * Standalone route so the user can preview the AI-8 takeover panel without
 * needing the conversational backend to trigger it.
 */

import { CrisisExitPanel } from '@/components/agenda/CrisisExitPanel';

export default function CrisisDemoPage() {
  return <CrisisExitPanel />;
}
