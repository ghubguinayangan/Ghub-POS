
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Sale } from '@/lib/placeholder-data';

export interface DebtTransaction {
    id: string;
    date: Date;
    debtorName: string;
    debtorPhone: string;
    debtorEmail?: string;
    items: { productId: string; quantity: number; price: number }[];
    total: number;
    amountPaid: number;
    status: 'Unpaid' | 'Partially Paid' | 'Paid';
    saleId: string;
}

interface UtangContextType {
  debts: DebtTransaction[];
  setDebts: React.Dispatch<React.SetStateAction<DebtTransaction[]>>;
  addDebt: (debtData: Omit<DebtTransaction, 'id' | 'date' | 'status' | 'amountPaid' >) => void;
}

const UtangContext = createContext<UtangContextType | undefined>(undefined);

export function UtangProvider({ children }: { children: ReactNode }) {
  const [debts, setDebts] = useState<DebtTransaction[]>([]);
  
  const addDebt = (debtData: Omit<DebtTransaction, 'id' | 'date' | 'status' | 'amountPaid'>) => {
    const newDebt: DebtTransaction = {
      ...debtData,
      id: `debt_${new Date().getTime()}`,
      date: new Date(),
      status: 'Unpaid',
      amountPaid: 0,
    };
    setDebts(prev => [newDebt, ...prev]);
  }
  
  const value = { debts, setDebts, addDebt };

  return (
    <UtangContext.Provider value={value}>
      {children}
    </UtangContext.Provider>
  );
}

export function useUtang() {
  const context = useContext(UtangContext);
  if (context === undefined) {
    throw new Error('useUtang must be used within a UtangProvider');
  }
  return context;
}
