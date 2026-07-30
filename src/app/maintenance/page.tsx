/**
 * Public maintenance page. When `MAINTENANCE_MODE` is on, the root
 * layout gate short-circuits every route to `<MaintenanceScreen />`
 * BEFORE this page ever renders — so in practice this file is only
 * hit when the flag is off AND someone links to `/maintenance`
 * directly (e.g. from documentation).
 */

import { MaintenanceScreen } from '@/components/MaintenanceScreen';

export const dynamic = 'force-static';

export const metadata = {
  title: 'En pausa · AgendaInteligente',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return <MaintenanceScreen />;
}
