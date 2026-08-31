

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of your settings
interface AppSettings {
  showStockOnPOS: boolean;
  lowStockThreshold: number;
  primaryColor: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeTIN: string;
  storeLogo: string | null;
  receiptFooter: string;
  gcashName: string;
  gcashNumber: string;
  gcashQRCode: string | null;
  paymayaName: string;
  paymayaNumber: string;
  paymayaQRCode: string | null;
  bankName: string;
  accountName: string;
  accountNumber: string;
  enableUtangManagement: boolean;
  showPriceOnPOS: boolean;
  showImageOnPOS: boolean;
  enableStockTracking: boolean;
  autoPrintReceipt: boolean;
  autoOpenDrawer: boolean;
}

// Define the shape of the context value
interface SettingsContextType {
  settings: AppSettings;
  setSettings: (settings: Partial<AppSettings>) => void;
  isLoading: boolean;
}

// Helper function to convert HEX to HSL values
function hexToHsl(hex: string): { h: number, s: number, l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
      return null;
  }
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
          default: h = 0;
      }
      h /= 6;
  }
  return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
  };
}


// Default settings
const defaultSettings: AppSettings = {
  showStockOnPOS: false,
  lowStockThreshold: 10,
  primaryColor: '#008080', // Default from settings page
  storeName: 'My Awesome Store',
  storeAddress: '',
  storePhone: '',
  storeTIN: '',
  storeLogo: null,
  receiptFooter: 'Thank you for shopping! Please come again.',
  gcashName: '',
  gcashNumber: '',
  gcashQRCode: null,
  paymayaName: '',
  paymayaNumber: '',
  paymayaQRCode: null,
  bankName: '',
  accountName: '',
  accountNumber: '',
  enableUtangManagement: false,
  showPriceOnPOS: true,
  showImageOnPOS: true,
  enableStockTracking: true,
  autoPrintReceipt: true,
  autoOpenDrawer: true,
};

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Create the provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('eyir_pos_settings');
      if (savedSettings) {
        // Merge saved settings with defaults to prevent uncontrolled input errors
        // if the saved object is missing properties from a newer version.
        const loadedSettings = JSON.parse(savedSettings);
        setSettingsState({ ...defaultSettings, ...loadedSettings });
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  // Apply primary color to the root element whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const hsl = hexToHsl(settings.primaryColor);
        if (hsl) {
            document.documentElement.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
            document.documentElement.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        }
    }
  }, [settings.primaryColor]);

  // Function to update and save settings
  const setSettings = (newSettings: Partial<AppSettings>) => {
    setSettingsState(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      try {
        localStorage.setItem('eyir_pos_settings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error("Failed to save settings to localStorage", error);
      }
      return updatedSettings;
    });
  };

  const value = { settings, setSettings, isLoading };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Create a custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export type { AppSettings as Settings };
