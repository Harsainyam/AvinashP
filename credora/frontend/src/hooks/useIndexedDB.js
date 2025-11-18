import { useState, useEffect } from 'react';
import { transactionDB } from '../services/storage';

const useIndexedDB = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await transactionDB.init();
        setInitialized(true);
      } catch (error) {
        console.error('IndexedDB initialization error:', error);
      }
    };

    init();
  }, []);

  const saveTransactions = async (transactions) => {
    if (!initialized) return false;
    return await transactionDB.saveTransactions(transactions);
  };

  const getTransactions = async (limit) => {
    if (!initialized) return [];
    return await transactionDB.getTransactions(limit);
  };

  const clearTransactions = async () => {
    if (!initialized) return false;
    return await transactionDB.clearTransactions();
  };

  return {
    initialized,
    saveTransactions,
    getTransactions,
    clearTransactions
  };
};

export default useIndexedDB;