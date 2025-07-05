export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Vérifier la longueur minimale (8 caractères)
  if (password.length < 8) {
    errors.push('Au moins 8 caractères');
  }

  // Vérifier la présence d'au moins un chiffre
  if (!/\d/.test(password)) {
    errors.push('Au moins 1 chiffre');
  }

  // Vérifier la présence d'au moins un caractère spécial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Au moins 1 caractère spécial (!@#$%^&*...)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrengthMessage(): string {
  return 'Minimum 8 caractères, 1 chiffre et 1 caractère spécial';
}

export function getPasswordRequirements(): string[] {
  return [
    'Au moins 8 caractères',
    'Au moins 1 chiffre',
    'Au moins 1 caractère spécial (!@#$%^&*...)',
  ];
}

export function getPasswordRequirementsText(): string {
  return `Le mot de passe doit contenir :
• Au moins 8 caractères
• Au moins 1 chiffre
• Au moins 1 caractère spécial (!@#$%^&*...)`;
}
