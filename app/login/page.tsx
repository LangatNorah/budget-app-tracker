"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleAuth = async () => {
    setError("");

    if (!email || !password) {
      setError("Fill all fields");
      return;
    }

    try {
      setLoading(true);

      let userCredential;

      // 🔐 LOGIN
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      // 🆕 REGISTER
      else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCredential.user;

        // 🔥 IMPORTANT: create Firestore user doc
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: serverTimestamp(),
        });
      }

      // 🚀 redirect
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">

      <div
        className="fixed inset-0 bg-cover bg-center -z-20"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />

      <div className="fixed inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 p-4 max-w-md mx-auto flex flex-col justify-center min-h-screen text-black">

        <div className="bg-white p-6 rounded-lg shadow">

          <h1 className="text-xl font-bold mb-4 text-center">
            {isLogin ? "Login" : "Create Account"}
          </h1>

          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-2 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-500 text-sm mb-2">{error}</p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="bg-black text-white w-full p-2 rounded"
          >
            {loading
              ? "Processing..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>

          <p className="text-center mt-4 text-sm">
            {isLogin ? "No account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}