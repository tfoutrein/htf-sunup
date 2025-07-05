import { Button } from './Button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FacebookLoginButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const FacebookLoginButton = ({
  onSuccess,
  onError,
  className = '',
}: FacebookLoginButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);

      // Redirection directe vers l'OAuth Facebook via le backend
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      window.location.href = `${backendUrl}/auth/facebook`;
    } catch (error) {
      console.error('Facebook authentication error:', error);
      if (onError) {
        onError(error as Error);
      }
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFacebookLogin}
      disabled={isLoading}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Redirection...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
              clipRule="evenodd"
            />
          </svg>
          <span>Continuer avec Facebook</span>
        </>
      )}
    </Button>
  );
};
