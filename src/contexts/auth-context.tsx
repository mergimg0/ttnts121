"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  sendVerificationEmail as authSendVerification,
  getAuthErrorMessage,
} from "@/lib/auth";
import { User, RegisterFormData } from "@/types/user";

interface AuthContextType {
  // State
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: RegisterFormData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from Firestore
  const fetchUserProfile = useCallback(
    async (firebaseUser: FirebaseUser): Promise<User | null> => {
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          return { id: userDoc.id, ...userDoc.data() } as User;
        }
        return null;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return null;
      }
    },
    []
  );

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        const userProfile = await fetchUserProfile(firebaseUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await authSignIn(email, password);
    } catch (err) {
      const errorCode = (err as { code?: string }).code || "";
      setError(getAuthErrorMessage(errorCode));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up a new user
  const signUp = useCallback(
    async (data: RegisterFormData) => {
      try {
        setError(null);
        setLoading(true);

        // Create Firebase Auth user
        const firebaseUser = await authSignUp(
          data.email,
          data.password,
          `${data.firstName} ${data.lastName}`
        );

        // Create Firestore user document
        const userDoc: Omit<User, "id"> = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined,
          role: "customer",
          children: [],
          marketingConsent: data.marketingConsent,
          emailVerified: false,
          createdAt: serverTimestamp() as unknown as Date,
          updatedAt: serverTimestamp() as unknown as Date,
        };

        await setDoc(doc(db, "users", firebaseUser.uid), userDoc);

        // Send verification email
        await authSendVerification(firebaseUser);

        // Fetch the created user profile
        const userProfile = await fetchUserProfile(firebaseUser);
        setUser(userProfile);
      } catch (err) {
        const errorCode = (err as { code?: string }).code || "";
        setError(getAuthErrorMessage(errorCode));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchUserProfile]
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setError(null);
      await authSignOut();
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      const errorCode = (err as { code?: string }).code || "";
      setError(getAuthErrorMessage(errorCode));
      throw err;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      await authResetPassword(email);
    } catch (err) {
      const errorCode = (err as { code?: string }).code || "";
      setError(getAuthErrorMessage(errorCode));
      throw err;
    }
  }, []);

  // Send verification email
  const sendVerificationEmail = useCallback(async () => {
    if (!firebaseUser) {
      setError("No user is signed in");
      return;
    }
    try {
      setError(null);
      await authSendVerification(firebaseUser);
    } catch (err) {
      const errorCode = (err as { code?: string }).code || "";
      setError(getAuthErrorMessage(errorCode));
      throw err;
    }
  }, [firebaseUser]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      const userProfile = await fetchUserProfile(firebaseUser);
      setUser(userProfile);
    }
  }, [firebaseUser, fetchUserProfile]);

  // Get ID token for API calls
  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    try {
      return await firebaseUser.getIdToken();
    } catch (err) {
      console.error("Error getting ID token:", err);
      return null;
    }
  }, [firebaseUser]);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendVerificationEmail,
    clearError,
    refreshUser,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
