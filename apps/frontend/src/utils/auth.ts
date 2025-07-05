// Utility functions for authentication

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('user-logout'));
};

export const login = (token: string, user: any) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));

  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('user-login'));
};

// Individual token management functions
export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

// Individual user management functions
export const setUser = (user: any) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem('user');
};

export const getUser = () => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      logout();
      return null;
    }
  }
  return null;
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  return !!getToken() && !!getUser();
};
