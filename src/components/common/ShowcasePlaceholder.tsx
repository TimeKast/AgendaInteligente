/**
 * Showcase Placeholder
 *
 * Placeholder for routes that exist in navigation but don't have
 * an implemented page yet. Used to demonstrate sidebar navigation
 * without confusing developers into thinking a feature is broken.
 *
 * @see UI-002
 */

import { Construction } from 'lucide-react';

interface ShowcasePlaceholderProps {
  /** Page title shown in the placeholder */
  title: string;
  /** Additional context about what this page would contain */
  description?: string;
  /** Feature name for the navigation showcase context */
  featureName?: string;
}

export function ShowcasePlaceholder({ title, description, featureName }: ShowcasePlaceholderProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <Construction className="text-muted-foreground h-6 w-6" />
        </div>

        <h1 className="text-foreground text-lg font-semibold">{title}</h1>

        {description && <p className="text-muted-foreground mt-2 text-sm">{description}</p>}

        <div className="border-muted-foreground/10 mt-4 rounded-lg border border-dashed px-4 py-3">
          <p className="text-muted-foreground text-xs">
            <span className="font-medium">Showcase</span> —{' '}
            {featureName
              ? `La ruta "${featureName}" demuestra la funcionalidad de navegación del starter kit.`
              : 'Esta ruta demuestra la funcionalidad de navegación del starter kit.'}{' '}
            Reemplaza este placeholder con tu implementación.
          </p>
        </div>
      </div>
    </div>
  );
}
