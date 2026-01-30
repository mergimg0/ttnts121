"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { User, CoachPermissions, FULL_COACH_PERMISSIONS } from "@/types/user";

interface CoachAuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasCoachPermission: (permission: keyof CoachPermissions) => boolean;
}

const CoachAuthContext = createContext<CoachAuthContextType | null>(null);

export function useCoachAuth() {
  const context = useContext(CoachAuthContext);
  if (!context) {
    throw new Error("useCoachAuth must be used within a CoachAuthProvider");
  }
  return context;
}

export function CoachAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Fetch user profile from Firestore to check role
        try {
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            // Only allow coach or admin role
            if (userData.role === "coach" || userData.role === "admin") {
              setUser(userData);
            } else {
              // Not authorized as coach
              setUser(null);
              if (pathname?.startsWith("/coach") && pathname !== "/coach/login") {
                router.push("/coach/login");
              }
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        // Redirect to login if not authenticated and trying to access coach area
        if (pathname?.startsWith("/coach") && pathname !== "/coach/login") {
          router.push("/coach/login");
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      // Verify user has coach role
      const userDoc = await getDoc(doc(db, "users", credential.user.uid));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        if (userData.role !== "coach" && userData.role !== "admin") {
          await signOut(auth);
          throw new Error("You do not have coach access");
        }
      } else {
        await signOut(auth);
        throw new Error("User profile not found");
      }

      router.push("/coach");
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/coach/login");
    } catch (error) {
      throw error;
    }
  };

  // Check if user has a specific coach permission
  const hasCoachPermission = (permission: keyof CoachPermissions): boolean => {
    if (!user) return false;
    // Admins always have full permissions
    if (user.role === "admin") return true;
    // If coach has no permissions set, grant full access (backward compatibility)
    const permissions = user.coachPermissions || FULL_COACH_PERMISSIONS;
    return permissions[permission] ?? false;
  };

  return (
    <CoachAuthContext.Provider value={{ firebaseUser, user, loading, login, logout, hasCoachPermission }}>
      {children}
    </CoachAuthContext.Provider>
  );
}
