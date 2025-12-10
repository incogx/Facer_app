import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * NOTE:
 * - In Expo managed apps it is best to provide these via app.config.js / app.json `extra`
 *   and access them through `Constants.expoConfig.extra`.
 * - For web builds you can still use `process.env.EXPO_PUBLIC_...` if you configured your bundler,
 *   but the safest cross-platform approach is to prefer `Constants.expoConfig.extra` first.
 *
 * Example app.config.js extra:
 *  export default {
 *    extra: {
 *      supabaseUrl: "https://<project>.supabase.co",
 *      supabaseAnonKey: "public-anon-key",
 *    }
 *  }
 */

/* Resolve URL and anon key cross-platform (expo constants -> env fallback) */
const supabaseUrl =
  (Constants.expoConfig && (Constants.expoConfig.extra as any)?.supabaseUrl) ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (global as any).__SUPABASE_URL__; // optional manual injection

const supabaseAnonKey =
  (Constants.expoConfig && (Constants.expoConfig.extra as any)?.supabaseAnonKey) ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (global as any).__SUPABASE_ANON_KEY__; // optional manual injection

if (!supabaseUrl || !supabaseAnonKey) {
  // Throw early so you see a clear message instead of "Invalid API key" from Supabase
  throw new Error(
    'Missing Supabase configuration. Make sure supabaseUrl and supabaseAnonKey are provided via app.config.js (Constants.expoConfig.extra) or environment variables EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

/**
 * Secure storage adapter shape:
 * Supabase expects an object with async getItem / setItem / removeItem methods that return Promises.
 * The adapter below uses Expo SecureStore on native and localStorage on web (wrapped in Promises).
 */
const ExpoSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        const v = localStorage.getItem(key);
        return v;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

/* Database typing (keep as you had, adjust if your Postgres types differ) */
export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          email: string;
          name: string;
          roll_number: string;
          reg_number: string;
          face_encoding: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          roll_number: string;
          reg_number: string;
          face_encoding?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          roll_number?: string;
          reg_number?: string;
          face_encoding?: string | null;
          created_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          code: string;
          instructor_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          instructor_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          instructor_name?: string;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          class_id: string;
          qr_payload: string;
          session_date: string;
          start_time: string;
          end_time: string | null;
          expires_at: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          qr_payload: string;
          session_date: string;
          start_time: string;
          end_time?: string | null;
          expires_at?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          qr_payload?: string;
          session_date?: string;
          start_time?: string;
          end_time?: string | null;
          expires_at?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          session_id: string;
          marked_at: string;
          method: string;
          verification_confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          session_id: string;
          marked_at?: string;
          method?: string;
          verification_confidence?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string;
          session_id?: string;
          marked_at?: string;
          method?: string;
          verification_confidence?: number | null;
          created_at?: string;
        };
      };
    };
  };
};

/* Create the supabase client with the adapter */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
