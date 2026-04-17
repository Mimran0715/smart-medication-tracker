"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-1/2 bg-[#1AA1E3] text-white flex flex-col justify-center items-start p-12">
        <h1 className="text-4xl font-bold mb-4">
          Smart Medication Tracker
        </h1>
        <p className="text-lg text-left font-bold mb-4">Track your meds with ease.</p>
      </div>

      <div className="w-1/2 flex items-center justify-center bg-gray-100">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-80 flex flex-col gap-4">

          <h2 className="text-xl font-semibold text-center">
            {view === "login" ? "Login" : "Create Account"}
          </h2>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded p-2"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded p-2"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#1AA1E3] text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : view === "login" ? "Login" : "Sign Up"}
          </button>

          <div className="text-sm text-center">
            {view === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setView("signup"); setError(""); }}
                  className="text-blue-600 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setView("login"); setError(""); }}
                  className="text-blue-600 hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </div>

        </form>
      </div>

    </div>
  );
}
