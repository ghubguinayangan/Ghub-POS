"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Real accounts backed by Supabase Auth + a `profiles` table (see
 * supabase-website-auth-migration.sql). Capped at MAX_ACCOUNTS, enforced
 * both here (fast feedback) and by a database RLS policy (the real gate —
 * see the migration file for why the client-side check alone isn't enough).
 */

export const MAX_ACCOUNTS = 2;

export type Role = 'Administrator' | 'Cashier' | 'Staff';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  hourlyRate: number;
  status: 'Active' | 'Inactive';
}

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface ActionResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  status: AuthStatus;
  user: Profile | null;
  users: Profile[];
  hasAdminAccount: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setupAdmin: (name: string, email: string, password: string) => Promise<ActionResult>;
  addUser: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    hourlyRate: number;
    avatarUrl?: string;
  }) => Promise<ActionResult>;
  updateCurrentUser: (
    updates: Partial<Pick<Profile, 'name' | 'avatarUrl'>> & { password?: string },
    currentPassword?: string
  ) => Promise<ActionResult & { message: string }>;
  resetCurrentUserPassword: (newPassword: string) => Promise<ActionResult & { message: string }>;
  updateUserStatus: (userId: string, status: 'Active' | 'Inactive') => Promise<ActionResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function rowToProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url || `https://picsum.photos/seed/${encodeURIComponent(row.name)}/100/100`,
    hourlyRate: Number(row.hourly_rate || 0),
    status: row.status,
  };
}

/** Friendlier text for the RLS rejection than raw Postgres error output. */
function describeProfileError(message: string): string {
  if (message.toLowerCase().includes('row-level security')) {
    return `Only ${MAX_ACCOUNTS} accounts are allowed.`;
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [hasAdminAccount, setHasAdminAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /** Works even when logged out — see has_any_account() in the migration. */
  const checkAnyAccountExists = useCallback(async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('has_any_account');
    if (error) {
      console.error('has_any_account check failed:', error.message);
      return false;
    }
    return !!data;
  }, []);

  const loadAllProfiles = useCallback(async (): Promise<Profile[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Failed to load profiles:', error.message);
      return [];
    }
    return (data || []).map(rowToProfile);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [{ data: { session } }, anyAccount] = await Promise.all([
      supabase.auth.getSession(),
      checkAnyAccountExists(),
    ]);
    setHasAdminAccount(anyAccount);

    if (session?.user) {
      const allProfiles = await loadAllProfiles();
      setUsers(allProfiles);
      const profile = allProfiles.find((p) => p.id === session.user.id);
      if (profile) {
        setUser(profile);
        setStatus('authenticated');
      } else {
        // Signed up (auth.users row exists) but has no profile — most likely
        // blocked by the account-cap policy after the cap was already hit.
        // Treat as not logged in; there's nothing they can do with this app.
        await supabase.auth.signOut();
        setUser(null);
        setUsers([]);
        setStatus('unauthenticated');
      }
    } else {
      setUser(null);
      setUsers([]);
      setStatus('unauthenticated');
    }
    setIsLoading(false);
  }, [checkAnyAccountExists, loadAllProfiles]);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    await refresh();
    return true;
  }, [refresh]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const setupAdmin = useCallback(
    async (name: string, email: string, password: string): Promise<ActionResult> => {
      if (await checkAnyAccountExists()) {
        return { success: false, message: 'An account already exists.' };
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error || !data.user) {
        return { success: false, message: error?.message || 'Could not create account.' };
      }
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        role: 'Administrator' as Role,
        hourly_rate: 0,
        status: 'Active',
      }, { onConflict: 'id' });
      if (profileError) {
        return { success: false, message: describeProfileError(profileError.message) };
      }
      await refresh();
      return { success: true };
    },
    [checkAnyAccountExists, refresh]
  );

  const addUser = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      role: Role;
      hourlyRate: number;
      avatarUrl?: string;
    }): Promise<ActionResult> => {
      const existing = await loadAllProfiles();
      if (existing.length >= MAX_ACCOUNTS) {
        return { success: false, message: `Only ${MAX_ACCOUNTS} accounts are allowed.` };
      }
      const { data, error } = await supabase.auth.signUp({ email: input.email, password: input.password });
      if (error || !data.user) {
        return { success: false, message: error?.message || 'Could not create account.' };
      }
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name: input.name,
        email: input.email,
        role: input.role,
        hourly_rate: input.hourlyRate,
        avatar_url: input.avatarUrl || null,
        status: 'Active',
      }, { onConflict: 'id' });
      if (profileError) {
        return { success: false, message: describeProfileError(profileError.message) };
      }
      await refresh();
      return { success: true };
    },
    [loadAllProfiles, refresh]
  );

  const updateCurrentUser = useCallback(
    async (
      updates: Partial<Pick<Profile, 'name' | 'avatarUrl'>> & { password?: string },
      currentPassword?: string
    ): Promise<ActionResult & { message: string }> => {
      if (!user) return { success: false, message: 'No user is logged in.' };

      if (updates.password) {
        if (!currentPassword) return { success: false, message: 'Current password is required.' };
        // Supabase has no standalone "verify password" call — re-authenticating
        // with the current password is the way to confirm they actually know it.
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (reauthError) return { success: false, message: 'Current password was incorrect.' };
        const { error } = await supabase.auth.updateUser({ password: updates.password });
        if (error) return { success: false, message: error.message };
      }

      const profileUpdates: Record<string, any> = {};
      if (updates.name !== undefined) profileUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) profileUpdates.avatar_url = updates.avatarUrl;

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
        if (error) return { success: false, message: error.message };
      }

      await refresh();
      return { success: true, message: 'User updated successfully.' };
    },
    [user, refresh]
  );

  const resetCurrentUserPassword = useCallback(
    async (newPassword: string): Promise<ActionResult & { message: string }> => {
      if (!user) return { success: false, message: 'No user is logged in.' };
      if (user.role !== 'Administrator') {
        return { success: false, message: 'Only administrators can reset passwords this way.' };
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Password reset successfully.' };
    },
    [user]
  );

  const updateUserStatus = useCallback(
    async (userId: string, newStatus: 'Active' | 'Inactive'): Promise<ActionResult> => {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) return { success: false, message: error.message };
      await refresh();
      return { success: true };
    },
    [refresh]
  );

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        users,
        hasAdminAccount,
        isLoading,
        login,
        logout,
        setupAdmin,
        addUser,
        updateCurrentUser,
        resetCurrentUserPassword,
        updateUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
