import { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  errorMessage?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, description, errorMessage, options, className = '', ...props },
    ref,
  ) => {
    // Styles cohérents avec Textarea pour la lisibilité
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
      'hover:border-gray-400',
      'focus:border-amber-500',
      'focus:ring-2',
      'focus:ring-amber-500/20',
      'cursor-pointer',
    ];

    const combinedClasses = [...baseClasses, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <select ref={ref} className={combinedClasses} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {description && !errorMessage && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
