'use client';

import { cn } from '@/lib/utils';
import { Check, X, Circle } from 'lucide-react';

interface PasswordRequirement {
  text: string;
  isValid: boolean;
  hasInteracted: boolean;
}

interface PasswordRequirementsProps {
  password: string;
  hasInteracted?: boolean;
}

export function PasswordRequirements({ password, hasInteracted = false }: PasswordRequirementsProps) {
  const requirements: PasswordRequirement[] = [
    {
      text: "Pelo menos 6 caracteres",
      isValid: password.length >= 6,
      hasInteracted: hasInteracted && password.length > 0,
    },
    {
      text: "Uma letra maiúscula",
      isValid: /[A-Z]/.test(password),
      hasInteracted: hasInteracted && password.length > 0,
    },
    {
      text: "Uma letra minúscula",
      isValid: /[a-z]/.test(password),
      hasInteracted: hasInteracted && password.length > 0,
    },
    {
      text: "Um número",
      isValid: /[0-9]/.test(password),
      hasInteracted: hasInteracted && password.length > 0,
    },
    {
      text: "Um caractere especial (!@#$%^&*)",
      isValid: /[!@#$%^&*]/.test(password),
      hasInteracted: hasInteracted && password.length > 0,
    },
  ];

  const getRequirementStatus = (requirement: PasswordRequirement) => {
    if (!requirement.hasInteracted) {
      return 'warning'; // Amarelo - estado inicial
    }
    return requirement.isValid ? 'success' : 'error'; // Verde ou vermelho
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-3 w-3" />;
      case 'error':
        return <X className="h-3 w-3" />;
      case 'warning':
        return <Circle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Requisitos da senha:
      </p>
      {requirements.map((requirement, index) => {
        const status = getRequirementStatus(requirement);
        return (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors duration-200",
              {
                "text-green-600": status === 'success',
                "text-red-600": status === 'error',
                "text-yellow-600": status === 'warning',
              }
            )}
          >
            {getStatusIcon(status)}
            <span>{requirement.text}</span>
          </div>
        );
      })}
    </div>
  );
}
