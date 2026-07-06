import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('donezo_token');
    const storedUser = localStorage.getItem('donezo_user');
    
    if (token && storedUser) {
      const decodedToken = parseJwt(token);
      if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch (e) {
          localStorage.removeItem('donezo_token');
          localStorage.removeItem('donezo_user');
        }
      } else {
        localStorage.removeItem('donezo_token');
        localStorage.removeItem('donezo_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    const token = data.token;
    const userData = data.user;
    
    userData.avatar = userData.name ? userData.name.substring(0, 2).toUpperCase() : 'U';
    
    localStorage.setItem('donezo_token', token);
    localStorage.setItem('donezo_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const register = async (name, email, password) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    const token = data.token;
    const userData = data.user;
    
    userData.avatar = userData.name ? userData.name.substring(0, 2).toUpperCase() : 'U';
    
    localStorage.setItem('donezo_token', token);
    localStorage.setItem('donezo_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('donezo_token');
    localStorage.removeItem('donezo_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await apiRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    updatedUser.avatar = updatedUser.name ? updatedUser.name.substring(0, 2).toUpperCase() : 'U';
    
    localStorage.setItem('donezo_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const updatePassword = async (passwordData) => {
    await apiRequest('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });

    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, updatePassword, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
