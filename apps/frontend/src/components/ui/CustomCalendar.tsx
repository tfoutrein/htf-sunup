'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomCalendarProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  disabledDates?: string[];
  label?: string;
  required?: boolean;
  className?: string;
}

export function CustomCalendar({
  value,
  onChange,
  min,
  max,
  disabledDates = [],
  label,
  required,
  className = '',
}: CustomCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? new Date(value) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate popup position when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  // Fonction utilitaire pour formater les dates sans décalage de fuseau horaire
  const formatDateToString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = formatDateToString(date);

    // Check if date is in disabled list
    if (disabledDates.includes(dateStr)) {
      return true;
    }

    // Check min/max bounds
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;

    return false;
  };

  const isDateOccupied = (date: Date) => {
    const dateStr = formatDateToString(date);
    return disabledDates.includes(dateStr);
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    const dateStr = formatDateToString(date);
    onChange(dateStr);
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

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
    'cursor-pointer',
  ];

  const combinedClasses = [...baseClasses, className].filter(Boolean).join(' ');

  // Calendar popup component
  const CalendarPopup = () => (
    <div
      ref={containerRef}
      className="fixed bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl z-[99999]"
      style={{
        top: `${popupPosition.top}px`,
        left: `${popupPosition.left}px`,
        width: `${Math.max(popupPosition.width, 300)}px`,
        maxWidth: '90vw',
      }}
    >
      {/* Header with month navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <span className="text-lg font-semibold capitalize text-gray-900 dark:text-gray-100">
          {monthYear}
        </span>

        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 p-2 text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
          <div key={day} className="text-center py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 p-3 bg-white dark:bg-gray-900">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-3"></div>;
          }

          const isSelected = value === formatDateToString(date);
          const isDisabled = isDateDisabled(date);
          const isOccupied = isDateOccupied(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={`
                relative p-3 text-sm rounded-lg transition-colors font-medium min-h-[40px] flex items-center justify-center
                ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-md'
                    : isDisabled
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                      : isToday
                        ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {/* Coche pour les dates occupées - plus grande et plus visible */}
              {isOccupied ? (
                <div className="relative">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400">
                    {date.getDate()}
                  </span>
                </div>
              ) : (
                <span>{date.getDate()}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Légende */}
      {disabledDates.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Défi existant (non sélectionnable)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="relative">
        <div
          ref={inputRef}
          className={combinedClasses}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
              {value ? formatDisplayDate(value) : 'Sélectionner une date'}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Render calendar popup using portal */}
        {isOpen &&
          typeof window !== 'undefined' &&
          createPortal(<CalendarPopup />, document.body)}
      </div>

      {/* Info sur les dates occupées */}
      {disabledDates.length > 0 && (
        <p className="text-xs text-gray-500">
          {disabledDates.length} date{disabledDates.length > 1 ? 's' : ''}{' '}
          occupée{disabledDates.length > 1 ? 's' : ''} par des défis existants
        </p>
      )}
    </div>
  );
}
