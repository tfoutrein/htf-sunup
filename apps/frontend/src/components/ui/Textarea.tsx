import { forwardRef } from 'react';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  errorMessage?: string;
  variant?: 'bordered' | 'flat';
  color?: 'default' | 'primary';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      description,
      errorMessage,
      variant = 'bordered',
      color = 'default',
      className = '',
      ...props
    },
    ref,
  ) => {
    // Styles simples et lisibles avec bon contraste
    const baseClasses = [
      'w-full',
      'px-3',
      'py-2.5',
      'text-gray-900', // Texte noir foncé
      'bg-white', // Fond blanc
      'border-2',
      'border-gray-300',
      'rounded-lg',
      'outline-none',
      'transition-colors',
      'duration-200',
      'resize-vertical',
      'placeholder:text-gray-500',
      'hover:border-gray-400',
      'focus:border-amber-500',
      'focus:ring-2',
      'focus:ring-amber-500/20',
    ];

    const combinedClasses = [...baseClasses, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <textarea ref={ref} className={combinedClasses} {...props} />
        {description && !errorMessage && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
