import { router as expoRouter } from 'expo-router';
import { useLastTab } from '../contexts/LastTabContext';

export const useRouterWithHistory = () => {
  const { addToHistory } = useLastTab();

  const extractTabName = (path: string): string => {
    const match = path.match(/\/\(tabs\)\/([^\/]+)/);
    return match ? match[1] : 'index';
  };

  return {
    push: (path: string, options?: any) => {
      const tabName = extractTabName(path);
      addToHistory(tabName);
      expoRouter.push(path, options);
    },
    replace: (path: string, options?: any) => {
      const tabName = extractTabName(path);
      addToHistory(tabName);
      expoRouter.replace(path, options);
    },
    back: expoRouter.back,
    canGoBack: expoRouter.canGoBack,
  };
};

