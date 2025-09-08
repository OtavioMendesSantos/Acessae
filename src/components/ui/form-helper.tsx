import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface FormHelperProps {
  message?: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  className?: string;
}

export function FormHelper({ message, type = 'info', className }: FormHelperProps) {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm px-3 py-2 rounded-md border',
        {
          'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800': type === 'error',
          'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800': type === 'success',
          'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800': type === 'warning',
          'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800': type === 'info',
        },
        className
      )}
    >
      {getIcon()}
      <span>{message}</span>
    </div>
  );
}
