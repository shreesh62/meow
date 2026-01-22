import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGetUser, apiGetSpaceByCode } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const storedUserId = localStorage.getItem('meow_user_id');
      const storedSpaceCode = localStorage.getItem('meow_space_code');

      if (storedUserId && storedSpaceCode) {
        try {
          const spaceData = await apiGetSpaceByCode(storedSpaceCode);
          const userData = await apiGetUser(storedUserId);
          
          if (spaceData && userData) {
            setSpace(spaceData);
            setUser(userData);
          }
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.clear();
        }
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  const login = (userData, spaceData) => {
    setUser(userData);
    setSpace(spaceData);
    localStorage.setItem('meow_user_id', userData.id);
    localStorage.setItem('meow_space_code', spaceData.code);
  };

  const logout = () => {
    setUser(null);
    setSpace(null);
    localStorage.clear();
  };

  return (
    <AppContext.Provider value={{ user, space, login, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
