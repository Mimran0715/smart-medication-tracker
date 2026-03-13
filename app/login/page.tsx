"use client";
import { useState } from "react";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "signup">("login");

  return (
    <div className="min-h-screen flex">
      <div className="w-1/2 bg-[#1AA1E3] text-white flex flex-col justify-center items-start p-12">
        <h1 className="text-4xl font-bold mb-4">
          Smart Medication Tracker
        </h1>
        <p className="text-lg text-left font-bold mb-4">Track your meds with ease.</p>
      </div>

      <div className="w-1/2 flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-80 flex flex-col gap-4">

          <h2 className="text-xl font-semibold text-center">
            {view === "login" ? "Login" : "Create Account"}
          </h2>

          <input
            type="email"
            placeholder="Email"
            className="border rounded p-2"
          />

          <input
            type="password"
            placeholder="Password"
            className="border rounded p-2"
          />

          <button className="bg-[#1AA1E3] text-white py-2 rounded hover:bg-blue-600">
            {view === "login" ? "Login" : "Sign Up"}
          </button>

          <div className="text-sm text-center">
            {view === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setView("signup")}
                  className="text-blue-600 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setView("login")}
                  className="text-blue-600 hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}