// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type Student = {
  id: string;
  name: string;
  reg_number: string;
  email?: string;
  phone?: string;
  department?: string;
  class_no?: string;
  section?: string;
  face_encoding?: string | null;
};

interface AuthContextType {
  student: Student | null;
  session: Session | null;
  loading: boolean;
  authLoading: boolean;
  signIn: (reg: string, password: string) => Promise<void>;
  signUp: (
    regNumber: string,
    password: string,
    name: string,
    email: string,
    phone: string,
    department: string,
    classNumber: string,
    section: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  student: null,
  session: null,
  loading: false,
  authLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshStudent: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Helper to get/set from SecureStore (native) or localStorage (web)
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize: Check for existing session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchStudentProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await fetchStudentProfile(session.user.id);
      } else {
        setStudent(null);
        await storage.removeItem("student");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch student profile from database
  const fetchStudentProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching student profile:", error);
        return;
      }

      if (data) {
        setStudent(data);
        await storage.setItem("student", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error in fetchStudentProfile:", error);
    }
  };

  // Refresh student profile manually
  const refreshStudent = async () => {
    if (session?.user) {
      await fetchStudentProfile(session.user.id);
    }
  };

  // Sign in with registration number
  const signIn = async (reg: string, password: string) => {
    setLoading(true);
    try {
      // First, find student by registration number to get email
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("email, id")
        .eq("reg_number", reg.trim())
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData || !studentData.email) {
        throw new Error("Registration number not found");
      }

      // Sign in with Supabase Auth using email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: studentData.email,
        password: password,
      });

      if (authError) {
        // Normalize error messages
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Incorrect password");
        }
        throw authError;
      }

      // Session will be set by onAuthStateChange listener
      // Student profile will be fetched automatically
    } finally {
      setLoading(false);
    }
  };

  // Sign up new user
  const signUp = async (
    regNumber: string,
    password: string,
    name: string,
    email: string,
    phone: string,
    department: string,
    classNumber: string,
    section: string
  ) => {
    setLoading(true);
    try {
      // First, create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error("Email already registered. Please sign in instead.");
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Then, create student profile linked to auth user
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .insert({
          id: authData.user.id,
          reg_number: regNumber.trim(),
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          department: department,
          class_no: classNumber.trim(),
          section: section.trim(),
        })
        .select()
        .single();

      if (studentError) {
        // If student creation fails, try to clean up auth user
        await supabase.auth.signOut();
        throw studentError;
      }

      // Set student immediately (session will be set by listener)
      setStudent(studentData);
      await storage.setItem("student", JSON.stringify(studentData));
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setStudent(null);
      setSession(null);
      await storage.removeItem("student");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        session,
        loading,
        authLoading,
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
