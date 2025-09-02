import React, { createContext, useContext, useRef } from 'react';

interface LastTabContextType {
  lastTabRef: React.MutableRefObject<string>;
}

const LastTabContext = createContext<LastTabContextType | undefined>(undefined);

export const LastTabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lastTabRef = useRef<string>('index');

  return (
    <LastTabContext.Provider value={{ lastTabRef }}>
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
