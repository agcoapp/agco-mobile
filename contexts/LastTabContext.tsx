import React, { createContext, useContext, useRef, useState } from 'react';

interface LastTabContextType {
  lastTabRef: React.MutableRefObject<string>;
  tabHistory: string[];
  addToHistory: (tabName: string) => void;
  getPreviousTab: () => string | null;
  cleanHistory: () => void;
}

const LastTabContext = createContext<LastTabContextType | undefined>(undefined);

export const LastTabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lastTabRef = useRef<string>('index');
  const [tabHistory, setTabHistory] = useState<string[]>(['index']);

  const addToHistory = (tabName: string) => {
    setTabHistory(prev => prev[prev.length - 1] !== tabName ? [...prev, tabName] : prev);
    lastTabRef.current = tabName;
  };

  const getPreviousTab = () => {
    const cleanedHistory = tabHistory.filter((item, index) => item !== tabHistory[index - 1]);
    for (let i = cleanedHistory.length - 2; i >= 0; i--) {
      if (cleanedHistory[i] !== lastTabRef.current) {
        return cleanedHistory[i];
      }
    }
    return null;
  };

  const cleanHistory = () => {
    setTabHistory(prev => prev.filter((item, index) => item !== prev[index - 1]));
  };

  return (
    <LastTabContext.Provider value={{ 
      lastTabRef, 
      tabHistory, 
      addToHistory, 
      getPreviousTab, 
      cleanHistory 
    }}>
      {children}
    </LastTabContext.Provider>
  );
};

export const useLastTab = () => {
  const context = useContext(LastTabContext);
  if (!context) {
    throw new Error('useLastTab must be used within a LastTabProvider');
  }
  return context;
};
