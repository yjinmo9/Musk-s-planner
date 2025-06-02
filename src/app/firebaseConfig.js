import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHtpcR7u0OYgxhj5JRYEhbidpWsVc7FzU",
  authDomain: "planner-c4c6c.firebaseapp.com",
  projectId: "planner-c4c6c",
  storageBucket: "planner-c4c6c.firebasestorage.app",
  messagingSenderId: "330958451898",
  appId: "1:330958451898:web:4f7182838485c964393e83",
  measurementId: "G-FSLFDJY9Y6"
};


// Firebase가 여러 번 초기화되는 것을 방지
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };