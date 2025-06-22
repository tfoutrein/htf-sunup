import React from 'react';

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  showValue?: boolean;
}

export function Slider({
  label,
  value,
  onChange,
  min = 5,
  max = 100,
  step = 5,
  className = '',
  showValue = true,
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  // Calculer le pourcentage pour la barre de progression (basé sur 0-100 pour l'affichage)
  const percentage = (value / max) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {showValue && (
            <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
              {value} pts
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {/* Barre de fond */}
        <div className="w-full h-2 bg-gray-200 rounded-full relative overflow-hidden">
          {/* Barre de progression */}
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input range */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
        />

        {/* Curseur personnalisé */}
        <div
          className="absolute top-1/2 w-5 h-5 bg-white border-2 border-amber-500 rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-all duration-200 hover:scale-110 hover:border-amber-600"
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Indicateurs de valeurs */}
      <div className="relative flex text-xs text-gray-400 mt-1">
        <span className="absolute left-0 transform -translate-x-1/2">0</span>
        <span className="absolute left-1/4 transform -translate-x-1/2">25</span>
        <span className="absolute left-1/2 transform -translate-x-1/2 text-gray-600 font-medium">
          50
        </span>
        <span className="absolute left-3/4 transform -translate-x-1/2">75</span>
        <span className="absolute right-0 transform translate-x-1/2">
          {max}
        </span>
      </div>
    </div>
  );
}
