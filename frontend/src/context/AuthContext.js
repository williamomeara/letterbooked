import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/token/`, { username, password });
      const { access, refresh } = response.data;
      setToken(access);
      setRefreshToken(refresh);
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      // Fetch user profile to get role - use api instance now that token is set
      const userResponse = await api.get(`/api/authors/`); // Placeholder, adjust to user endpoint
      setUser({ username, role: 'user' }); // Adjust based on actual user data
      localStorage.setItem('user', JSON.stringify({ username, role: 'user' }));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};