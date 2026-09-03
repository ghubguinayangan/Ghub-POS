"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDeviceIds } from '@/lib/ghub-data';

const DEVICE_STORAGE_KEY = 'eyir_pos_selected_device';

interface DeviceContextType {
  deviceIds: string[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const ids = await getDeviceIds();
      setDeviceIds(ids);

      const saved = typeof window !== 'undefined' ? localStorage.getItem(DEVICE_STORAGE_KEY) : null;
      if (saved && ids.includes(saved)) {
        setSelectedDeviceIdState(saved);
      } else if (ids.length > 0) {
        setSelectedDeviceIdState(ids[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setSelectedDeviceId = (id: string) => {
    setSelectedDeviceIdState(id);
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, id);
    } catch {
      // ignore storage failures
    }
  };

  return (
    <DeviceContext.Provider
      value={{ deviceIds, selectedDeviceId, setSelectedDeviceId, isLoading, refresh: load }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}
