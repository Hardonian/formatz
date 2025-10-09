/**
 * Authentication Service
 *
 * Handles user authentication, session management, and profile creation.
 * Integrates with Supabase Auth for secure authentication.
 */

import { BaseService } from '../base.service';
import { supabase } from '../../lib/supabase';
import type { ServiceResponse } from '../../types/dtos';
import type { User, Session } from '@supabase/supabase-js';

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export class AuthService extends BaseService {
  constructor() {
    super('AuthService');
  }

  /**
   * Sign up a new user
   */
  async signUp(credentials: SignUpCredentials): Promise<ServiceResponse<AuthResponse>> {
    return this.executeOperation(async () => {
      this.validateRequired(credentials, ['email', 'password']);

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName || null,
            username: credentials.username || null,
          },
        },
      });

      if (error) throw error;
      if (!data.user || !data.session) {
        throw new Error('Sign up succeeded but user or session is missing');
      }

      return {
        user: data.user,
        session: data.session,
      };
    }, 'Sign up failed');
  }

  /**
   * Sign in an existing user
   */
  async signIn(credentials: SignInCredentials): Promise<ServiceResponse<AuthResponse>> {
    return this.executeOperation(async () => {
      this.validateRequired(credentials, ['email', 'password']);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user || !data.session) {
        throw new Error('Sign in succeeded but user or session is missing');
      }

      return {
        user: data.user,
        session: data.session,
      };
    }, 'Sign in failed');
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }, 'Sign out failed');
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<ServiceResponse<Session | null>> {
    return this.executeOperation(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    }, 'Failed to get session');
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<ServiceResponse<User | null>> {
    return this.executeOperation(async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    }, 'Failed to get current user');
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    }, 'Password update failed');
  }

  /**
   * Update user email
   */
  async updateEmail(newEmail: string): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      if (!newEmail || !newEmail.includes('@')) {
        throw new Error('Invalid email address');
      }

      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;
    }, 'Email update failed');
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      if (!email) {
        throw new Error('Email is required');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    }, 'Password reset request failed');
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const response = await this.getSession();
    return response.success && !!response.data;
  }
}

// Export singleton instance
export const authService = new AuthService();
