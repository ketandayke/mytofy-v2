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
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('mytofy_user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('mytofy_user');
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
