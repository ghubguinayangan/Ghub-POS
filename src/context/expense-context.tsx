
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ExpenseCategory {
    id: string;
    name: string;
}

export interface Expense {
    id: string;
    date: Date;
    category: string;
    amount: number;
    paymentMethod: 'Cash' | 'GCash' | 'PayMaya' | 'Bank';
    notes?: string;
    createdBy: string;
    receiptImageUrl?: string;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [];


interface ExpenseContextType {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(EXPENSE_CATEGORIES);
  
  const value = { expenses, setExpenses, expenseCategories, setExpenseCategories };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
