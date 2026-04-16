"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  patientId: string | null;
  patientName: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  patientId: null,
  patientName: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const token = await user.getIdToken();
        document.cookie = `__session=${token}; path=/;`;

        // Fetch or assign patient mapping
        try {
          let res = await fetch("/api/auth/patient");
          if (res.status === 404) {
            res = await fetch("/api/auth/patient", { method: "POST" });
          }
          if (res.ok) {
            const data = await res.json();
            setPatientId(data.patientId);
            setPatientName(data.patientName);
          }
        } catch {
          // Patient mapping will be retried on next load
        }
      } else {
        document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setPatientId(null);
        setPatientName(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, patientId, patientName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
