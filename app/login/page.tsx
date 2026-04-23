"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const router = useRouter();
  console.log(auth);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        // LOGIN
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // REGISTER
        await createUserWithEmailAndPassword(auth, email, password);
      }

      router.push("/");
    } catch (err) {
      alert("Authentication failed");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">

      <h1 className="text-xl font-bold mb-4">
        {isLogin ? "Login" : "Create Account"}
      </h1>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleAuth}
        className="bg-black text-white w-full p-2 rounded"
      >
        {isLogin ? "Login" : "Register"}
      </button>

      {/* TOGGLE */}
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
  );
}