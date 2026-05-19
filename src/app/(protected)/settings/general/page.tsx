/**
 * Settings General Page
 *
 * Placeholder for general settings.
 * Replace with your own implementation.
 */

import type { Metadata } from 'next';
import { ShowcasePlaceholder } from '@/components/common/ShowcasePlaceholder';

export const metadata: Metadata = {
  title: 'Configuración General',
  description: 'Ajustes generales del sistema',
};

export default function SettingsGeneralPage() {
  return (
    <ShowcasePlaceholder
      title="Configuración General"
      description="Aquí irán los ajustes generales del sistema: nombre de la app, zona horaria, idioma, etc."
      featureName="Settings General"
    />
  );
}
