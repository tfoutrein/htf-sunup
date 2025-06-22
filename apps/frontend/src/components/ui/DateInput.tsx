import { forwardRef, useId } from 'react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  errorMessage?: string;
  min?: string;
  max?: string;
  disabledDates?: string[]; // Array of dates in YYYY-MM-DD format
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      description,
      errorMessage,
      className = '',
      min,
      max,
      disabledDates = [],
      ...props
    },
    ref,
  ) => {
    const componentId = useId();
    // Styles cohérents avec les autres inputs
    const baseClasses = [
      'w-full',
      'px-3',
      'py-2.5',
      'text-gray-900',
      'bg-white',
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
    ];

    const combinedClasses = [...baseClasses, className]
      .filter(Boolean)
      .join(' ');

    // Function to check if date is disabled
    const isDateDisabled = (date: string) => {
      return disabledDates.includes(date);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = e.target.value;

      // Check if the date is disabled
      if (isDateDisabled(selectedDate)) {
        // Reset the input value to prevent the selection
        e.target.value = (props.value as string) || '';

        // Show a user-friendly alert
        alert(
          `Cette date (${new Date(selectedDate).toLocaleDateString('fr-FR')}) a déjà un défi. Veuillez choisir une autre date.`,
        );
        return;
      }

      // Call the original onChange if provided
      if (props.onChange) {
        props.onChange(e);
      }
    };

    // Prevent typing dates that are disabled
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow navigation keys
      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
      ];

      if (allowedKeys.includes(e.key)) {
        return;
      }

      // For other keys, we let the default behavior happen and validate on change
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="date"
            className={`${combinedClasses} ${disabledDates.length > 0 ? 'has-disabled-dates' : ''}`}
            min={min}
            max={max}
            onChange={handleDateChange}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {disabledDates.length > 0 && (
            <>
              <style jsx global>{`
                /* Styles pour marquer visuellement les dates occupées */
                input[type='date']::-webkit-calendar-picker-indicator {
                  cursor: pointer;
                }

                /* Style pour les dates désactivées dans le calendrier */
                input[type='date']::-webkit-inner-spin-button {
                  display: none;
                }

                /* Cibler le calendrier WebKit et marquer les dates occupées */
                input[type='date'].has-disabled-dates::-webkit-calendar-picker-indicator {
                  position: relative;
                }

                input[type='date'].has-disabled-dates::-webkit-calendar-picker-indicator::after {
                  content: '🔴';
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  font-size: 8px;
                  z-index: 10;
                }
              `}</style>

              {/* Indicateur visuel des dates occupées */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 font-medium">
                    {disabledDates.length}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Description des dates non disponibles */}
        {disabledDates.length > 0 && !errorMessage && (
          <div className="text-xs text-gray-500 space-y-1">
            <p className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              {disabledDates.length === 1
                ? `Date occupée : ${new Date(disabledDates[0]).toLocaleDateString('fr-FR')}`
                : `${disabledDates.length} dates déjà occupées par des défis`}
            </p>
            {disabledDates.length > 1 && disabledDates.length <= 3 && (
              <p className="text-gray-400 ml-3">
                {disabledDates
                  .map((date) => new Date(date).toLocaleDateString('fr-FR'))
                  .join(', ')}
              </p>
            )}
          </div>
        )}

        {description && !errorMessage && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      </div>
    );
  },
);

DateInput.displayName = 'DateInput';
