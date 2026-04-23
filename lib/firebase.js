import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2N9hQi_F_nA5NhKvgG5i7uaWyMCgKXrQ",
  authDomain: "budget-app-28509.firebaseapp.com",
  projectId: "budget-app-28509",
  storageBucket: "budget-app-28509.firebasestorage.app",
  messagingSenderId: "149988088663",
  appId: "1:149988088663:web:45f2947371a62326617c12",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);