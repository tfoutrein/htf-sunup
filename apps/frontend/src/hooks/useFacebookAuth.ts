import { useEffect, useState } from 'react';

interface FacebookAuthResponse {
  accessToken: string;
  userID: string;
  email?: string;
  name?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export const useFacebookAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (typeof window !== 'undefined' && !window.FB) {
        window.fbAsyncInit = function () {
          window.FB.init({
            appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0',
          });
          setIsSDKLoaded(true);
        };

        // Load the SDK asynchronously
        (function (d, s, id) {
          var js,
            fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s) as HTMLScriptElement;
          js.id = id;
          js.src = 'https://connect.facebook.net/en_US/sdk.js';
          fjs.parentNode?.insertBefore(js, fjs);
        })(document, 'script', 'facebook-jssdk');
      } else if (window.FB) {
        setIsSDKLoaded(true);
      }
    };

    loadFacebookSDK();
  }, []);

  const loginWithFacebook = async (): Promise<FacebookAuthResponse | null> => {
    if (!isSDKLoaded || !window.FB) {
      throw new Error('Facebook SDK not loaded');
    }

    setIsLoading(true);

    try {
      // Facebook Login
      const response = await new Promise<fb.StatusResponse>(
        (resolve, reject) => {
          window.FB.login(
            (response: fb.StatusResponse) => {
              if (response.status === 'connected') {
                resolve(response);
              } else {
                reject(new Error('Facebook login failed'));
              }
            },
            { scope: 'email,public_profile' },
          );
        },
      );

      if (response.authResponse) {
        const { accessToken, userID } = response.authResponse;

        if (!accessToken || !userID) {
          throw new Error('Invalid Facebook response');
        }

        // Get user info
        const userInfo = await new Promise<any>((resolve, reject) => {
          window.FB.api(
            '/me',
            { fields: 'name,email,picture' },
            (response: any) => {
              if (response && !response.error) {
                resolve(response);
              } else {
                reject(new Error('Failed to get user info'));
              }
            },
          );
        });

        return {
          accessToken,
          userID,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        };
      }

      return null;
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (window.FB) {
      window.FB.logout();
    }
  };

  return {
    loginWithFacebook,
    logout,
    isLoading,
    isSDKLoaded,
  };
};

// Extend window object for Facebook SDK
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}
