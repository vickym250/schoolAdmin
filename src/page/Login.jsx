import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // 🔒 Already logged-in user → dashboard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && localStorage.getItem("loginTime")) {
        navigate("/dash", { replace: true });
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔐 Persistent login
      await setPersistence(auth, browserLocalPersistence);

      await signInWithEmailAndPassword(auth, email, password);

      // ⏱ Save login time (IMPORTANT)
      localStorage.setItem("loginTime", Date.now());

      navigate("/dash", { replace: true });
    } catch (err) {
      if (err.code === "auth/user-not-found")
        setError("Admin account not found!");
      else if (err.code === "auth/wrong-password")
        setError("Incorrect password!");
      else if (err.code === "auth/invalid-email")
        setError("Invalid email format!");
      else setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl">

        <div className="p-10 text-center">
          <h2 className="text-3xl font-extrabold">Admin Portal</h2>
          <p className="text-gray-500 mt-2">School Management System</p>
        </div>

        <form onSubmit={handleLogin} className="px-10 pb-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <input
            type="email"
            required
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border bg-gray-50"
          />

          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border bg-gray-50"
          />

          <button
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-bold ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 pb-6">
          Official Admin Access Only
        </p>
      </div>
    </div>
  );
}
