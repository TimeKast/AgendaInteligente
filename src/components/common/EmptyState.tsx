import { cn } from '@/lib/utils/cn';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Custom icon */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component for tables, lists, and sections with no data
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'neo-inset-sm flex flex-col items-center justify-center rounded-xl p-12 text-center',
        className
      )}
    >
      <div className="bg-muted mb-4 rounded-full p-4">
        <Icon className="text-muted-foreground h-8 w-8" />
      </div>

      <h3 className="text-foreground mb-1 text-lg font-semibold">{title}</h3>

      {description && <p className="text-muted-foreground mb-4 max-w-sm text-sm">{description}</p>}

      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
