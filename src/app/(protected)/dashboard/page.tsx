/**
 * Dashboard Page
 *
 * Protected page - requires authentication.
 * Clean welcome page — connect your own data here.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { Rocket, Settings, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { ClientDate } from '@/components/dashboard/ClientDate';
import { TestNotificationCard } from '@/components/dashboard/TestNotificationCard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Tu panel de control',
};

const quickLinks = [
  {
    name: 'Configuración',
    href: '/settings/users',
    icon: Settings,
    description: 'Gestión de usuarios',
  },
  {
    name: 'Documentación',
    href: 'https://github.com/timekast',
    icon: BookOpen,
    description: 'Guías y tutoriales',
    external: true,
  },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 rounded-xl p-3">
          <Rocket className="text-primary h-6 w-6" />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-semibold">
            Bienvenido, {session.user.name || 'Usuario'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Este es tu panel de control. Conecta tus datos y personaliza esta página.
          </p>
          <ClientDate />
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-foreground mb-3 text-sm font-medium">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              {...('external' in link && link.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="neo-outset-sm bg-background group rounded-xl p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="bg-secondary group-hover:bg-primary/10 rounded-lg p-2 transition-colors">
                  <link.icon className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">{link.name}</p>
                  <p className="text-muted-foreground text-xs">{link.description}</p>
                </div>
              </div>
            </Link>
          ))}
          <TestNotificationCard />
        </div>
      </div>

      {/* Empty State — placeholder for real data */}
      <div className="neo-inset-sm bg-background rounded-xl p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Tu contenido va aquí. Conecta tus datos y componentes para construir tu dashboard.
        </p>
      </div>
    </div>
  );
}
