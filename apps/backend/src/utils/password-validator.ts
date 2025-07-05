import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string, args: ValidationArguments) {
    // Vérifier la longueur minimale (8 caractères)
    if (password.length < 8) {
      return false;
    }

    // Vérifier la présence d'au moins un chiffre
    if (!/\d/.test(password)) {
      return false;
    }

    // Vérifier la présence d'au moins un caractère spécial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Le mot de passe doit contenir :\n• Au moins 8 caractères\n• Au moins 1 chiffre\n• Au moins 1 caractère spécial';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Fonction utilitaire pour valider les mots de passe
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Vérifier la longueur minimale (8 caractères)
  if (password.length < 8) {
    errors.push('au moins 8 caractères');
  }

  // Vérifier la présence d'au moins un chiffre
  if (!/\d/.test(password)) {
    errors.push('au moins 1 chiffre');
  }

  // Vérifier la présence d'au moins un caractère spécial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('au moins 1 caractère spécial');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
