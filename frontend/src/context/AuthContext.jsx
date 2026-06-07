import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import React from 'react';
import { App } from 'antd';
import api from '../api/axiosInstance.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clinicUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('clinicToken')));
  const { message } = App.useApp();

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
      localStorage.setItem('clinicUser', JSON.stringify(data.data));
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('clinicToken')) fetchMe();
    else setLoading(false);
  }, []);

  const login = async (values) => {
    const { data } = await api.post('/auth/login', values);
    localStorage.setItem('clinicToken', data.data.token);
    localStorage.setItem('clinicUser', JSON.stringify(data.data.user));
    setUser(data.data.user);
    message.success(data.message);
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem('clinicToken');
    localStorage.removeItem('clinicUser');
    setUser(null);
  };

  const value = useMemo(() => ({ user, setUser, loading, login, logout, fetchMe }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
