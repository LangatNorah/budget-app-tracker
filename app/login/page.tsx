"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";

// Friendly Firebase error messages
const AUTH_ERRORS: Record<string, string> = {
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/email-already-in-use": "Email already registered.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/network-request-failed": "Check your internet connection.",
};

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/");
    });

    return unsubscribe;
  }, [router]);

  // Login / Register
  const handleAuth = async () => {
    if (loading) return;

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isLogin && cleanPassword !== confirmPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword
        );
      } else {
        const { user } =
          await createUserWithEmailAndPassword(
            auth,
            cleanEmail,
            cleanPassword
          );

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: serverTimestamp(),
        });
      }

      router.push("/");
    } catch (err) {
      const firebaseError = err as FirebaseError;

      setError(
        AUTH_ERRORS[firebaseError.code] ??
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const resetPassword = async () => {
  const cleanEmail = email.trim().toLowerCase();

  setError("");
  setSuccess("");

  if (!cleanEmail) {
    setError("Enter your email first.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail, {
      url: window.location.origin + "/auth",
      handleCodeInApp: false,
    });

    setSuccess(
      "Password reset link sent to your inbox/spam folder."
    );
  } catch (err) {
    const firebaseError = err as FirebaseError;

    setError(
      AUTH_ERRORS[firebaseError.code] ??
      firebaseError.message
    );

    console.log(firebaseError);
  }
};

  // Enter key submit
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleAuth();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center -z-20"
        style={{
          backgroundImage: "url('/money-bg.jpg')",
        }}
      />

      <div className="fixed inset-0 bg-black/60 -z-10" />

      {/* Card */}
      <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">
          {isLogin ? "Welcome back" : "Create account"}
        </h1>

        <p className="text-sm text-center text-gray-500 mb-6">
          {isLogin
            ? "Sign in to your budget dashboard"
            : "Start tracking your money today"}
        </p>

        <div className="grid gap-3">

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete={
                  isLogin
                    ? "current-password"
                    : "new-password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {!isLogin && (
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>

              <input
                id="confirm-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Sign in"
              : "Create account"}
          </button>

          {/* Forgot password */}
          {isLogin && (
            <button
              type="button"
              onClick={resetPassword}
              className="text-sm text-blue-600 hover:underline text-center"
            >
              Forgot password?
            </button>
          )}
        </div>

        {/* Toggle login/register */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            {isLogin
              ? "Register"
              : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}