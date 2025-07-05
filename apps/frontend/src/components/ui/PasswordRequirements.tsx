import React from 'react';
import { validatePassword } from '@/utils/password';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  className = '',
}) => {
  const validation = validatePassword(password);

  const requirements = [
    { text: 'Au moins 8 caractères', isValid: password.length >= 8 },
    { text: 'Au moins 1 chiffre', isValid: /\d/.test(password) },
    {
      text: 'Au moins 1 caractère spécial (!@#$%^&*...)',
      isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
  ];

  if (!password) return null;

  return (
    <div className={`text-sm ${className}`}>
      <p className="font-medium text-gray-700 mb-2">
        Le mot de passe doit contenir :
      </p>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className={`text-xs ${req.isValid ? 'text-green-600' : 'text-red-600'}`}
            >
              {req.isValid ? '✓' : '✗'}
            </span>
            <span
              className={`${req.isValid ? 'text-green-600' : 'text-red-600'}`}
            >
              {req.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirements;
