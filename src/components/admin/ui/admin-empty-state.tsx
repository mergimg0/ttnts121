import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-50 mb-4">
        <Icon className="h-7 w-7 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">
        {title}
      </h3>
      {description && (
        <p className="text-neutral-500 text-sm mb-6 text-center max-w-md">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
