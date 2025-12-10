import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Database } from '@/lib/supabase';

type Student = Database['public']['Tables']['students']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  student: Student | null;
  loading: boolean;
  signIn: (regNumber: string, password: string) => Promise<void>;
  signUp: (regNumber: string, password: string, name: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  student: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshStudent: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStudentProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchStudentProfile(session.user.id);
        } else {
          setStudent(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStudentProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching student profile:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('Student profile not found for user:', userId);
      }
      
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (regNumber: string, password: string) => {
    // Look up student by registration number to get their email
    const { data: studentData, error: lookupError } = await supabase
      .from('students')
      .select('email')
      .eq('reg_number', regNumber)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!studentData) {
      throw new Error('Invalid registration number');
    }

    // Authenticate with Supabase Auth using the email
    const { error } = await supabase.auth.signInWithPassword({
      email: studentData.email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (regNumber: string, password: string, name: string, email: string) => {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    // Create student record in students table
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        id: authData.user.id,
        email,
        name,
        reg_number: regNumber,
        roll_number: regNumber, // Using reg_number as roll_number for now
      });

    if (studentError) {
      // If student creation fails, try to clean up auth user
      await supabase.auth.signOut();
      throw studentError;
    }

    // Refresh student profile after signup
    await fetchStudentProfile(authData.user.id);
  };

  const refreshStudent = async () => {
    if (user?.id) {
      await fetchStudentProfile(user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        student,
        loading,
        signIn,
        signUp,
        signOut,
        refreshStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
