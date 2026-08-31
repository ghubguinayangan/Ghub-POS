
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { type User } from '@/lib/placeholder-data';

// For mock purposes, we'll extend the User type to include a password
export type StoredUser = User & { password?: string };
type AuthStatus = "authenticated" | "unauthenticated" | "loading";

interface AuthState {
  status: AuthStatus;
  currentUser: User | null;
  users: StoredUser[];
  hasAdminAccount: boolean;
  isLoading: boolean;
}

// --- Global Store Setup ---

let memoryState: AuthState = {
  status: 'loading',
  currentUser: null,
  users: [],
  hasAdminAccount: false,
  isLoading: true,
};

const listeners: Array<(state: AuthState) => void> = [];

function dispatch(update: Partial<AuthState>) {
  memoryState = { ...memoryState, ...update };
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// --- Core Logic ---

const USERS_STORAGE_KEY = 'eyir_pos_users';
const SESSION_STORAGE_KEY = 'eyir_pos_session';

function saveUsersToStorage(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
  }
}

function initializeState() {
  let storedUsers: StoredUser[] = [];
  let sessionUser: User | null = null;
  let adminExists = false;

  try {
    const usersFromStorage = localStorage.getItem(USERS_STORAGE_KEY);
    if (usersFromStorage) {
      storedUsers = JSON.parse(usersFromStorage);
    } else {
      // First time load: start with an empty user list
      storedUsers = [];
      saveUsersToStorage(storedUsers);
    }

    adminExists = storedUsers.some(u => u.role === 'Administrator');

    const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionJson) {
      const parsedSessionUser = JSON.parse(sessionJson);
      // Verify session user still exists and is active
      if (storedUsers.some(u => u.id === parsedSessionUser.id && u.status === 'Active')) {
        sessionUser = parsedSessionUser;
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY); // Clean up invalid session
      }
    }
  } catch (error) {
    console.error("Failed to initialize auth state from localStorage", error);
  }

  dispatch({
    users: storedUsers,
    currentUser: sessionUser,
    status: sessionUser ? 'authenticated' : 'unauthenticated',
    hasAdminAccount: adminExists,
    isLoading: false,
  });
}

// --- Public API ---

export const login = async (email: string, pass: string): Promise<boolean> => {
  const userToLogin = memoryState.users.find(u => u.email === email && u.status === 'Active');

  if (userToLogin && userToLogin.password === pass) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userInfo } = userToLogin;
    try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userInfo));
    } catch (error) {
        console.error("Failed to save session to localStorage", error);
    }
    dispatch({ currentUser: userInfo, status: 'authenticated' });
    return true;
  }
  
  return false;
};

export const logout = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
      console.error("Failed to remove session from localStorage", error);
  }
  dispatch({ currentUser: null, status: 'unauthenticated' });
};

export const setupAdmin = async (name: string, email: string, pass: string): Promise<boolean> => {
    const newAdmin: StoredUser = { 
        id: `user_${new Date().getTime()}`,
        name, 
        email, 
        role: 'Administrator', 
        avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
        hourlyRate: 250,
        status: 'Active',
        password: pass
    };
    
    // Ensure no other admin accounts exist
    const otherUsers = memoryState.users.filter(u => u.role !== 'Administrator');
    const updatedUsers = [newAdmin, ...otherUsers];
    
    saveUsersToStorage(updatedUsers);
    dispatch({ users: updatedUsers, hasAdminAccount: true });

    // Automatically log in the new admin
    await login(email, pass);
    return true;
};

export const setUsers = (users: StoredUser[]) => {
  saveUsersToStorage(users);
  dispatch({ users });
};

export const updateCurrentUser = (updatedInfo: Partial<StoredUser>, currentPassword?: string): { success: boolean; message: string } => {
    if (!memoryState.currentUser) {
        return { success: false, message: "No user is logged in." };
    }

    const userIndex = memoryState.users.findIndex(u => u.id === memoryState.currentUser!.id);
    if (userIndex === -1) {
        return { success: false, message: "Could not find current user in user list." };
    }

    const currentUserWithPassword = memoryState.users[userIndex];

    // If they are trying to update the password, we must verify the current one.
    if (updatedInfo.password) {
        if (!currentPassword || currentUserWithPassword.password !== currentPassword) {
            return { success: false, message: "Current password was incorrect." };
        }
    }

    // Update user in the main array
    const updatedUser = { ...currentUserWithPassword, ...updatedInfo };
    const updatedUsers = [...memoryState.users];
    updatedUsers[userIndex] = updatedUser;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...publicUserInfo } = updatedUser;

    saveUsersToStorage(updatedUsers);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(publicUserInfo));
    dispatch({ users: updatedUsers, currentUser: publicUserInfo });

    return { success: true, message: "User updated successfully." };
};

export const resetCurrentUserPassword = (newPassword: string): { success: boolean; message: string } => {
    if (!memoryState.currentUser) {
        return { success: false, message: "No user is logged in." };
    }
    
    if (memoryState.currentUser.role !== 'Administrator') {
        return { success: false, message: "Only administrators can reset passwords this way." };
    }

    const userIndex = memoryState.users.findIndex(u => u.id === memoryState.currentUser!.id);
    if (userIndex === -1) {
        return { success: false, message: "Could not find current user in user list." };
    }

    const updatedUser = { ...memoryState.users[userIndex], password: newPassword };
    const updatedUsers = [...memoryState.users];
    updatedUsers[userIndex] = updatedUser;

    saveUsersToStorage(updatedUsers);
    // No need to update session or current user as password is not stored there.
    dispatch({ users: updatedUsers });

    return { success: true, message: "Password reset successfully." };
};


// --- React Hook ---

const useMockAuth = () => {
  const [state, setState] = useState<AuthState>(memoryState);

  useEffect(() => {
    if (memoryState.status === 'loading') {
      initializeState();
    }
  }, []);

  useEffect(() => {
    const listener = (newState: AuthState) => setState(newState);
    listeners.push(listener);
    
    // Ensure the component has the latest state upon mounting
    setState(memoryState);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    user: state.currentUser,
    login,
    logout,
    setupAdmin,
    setUsers,
    updateCurrentUser,
    resetCurrentUserPassword,
  };
};

export default useMockAuth;
