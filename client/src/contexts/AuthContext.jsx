import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mytofy_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Add a global request interceptor to inject the token if it exists
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('mytofy_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add a global interceptor to handle 401 Unauthorized errors
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // If we get a 401 from the server, our cookie/token is invalid/missing.
          // Clear local state to force the user back to the login screen.
          setUser(null);
          localStorage.removeItem('mytofy_user');
          localStorage.removeItem('mytofy_token');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('mytofy_user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('mytofy_token', token);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('mytofy_user');
    localStorage.removeItem('mytofy_token');
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
        console.error("Logout error", error);
    }
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('mytofy_user', JSON.stringify(updatedData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
