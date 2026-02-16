// ──────────────────────────────────────────────────────────────
// Firebase Configuration
// ──────────────────────────────────────────────────────────────
// Replace the placeholder values below with YOUR Firebase project config.
// You can find these in: Firebase Console → Project Settings → General → Your apps → Web app
//
// SETUP STEPS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g. "f1-p10")
// 3. Add a Web app (click </> icon)
// 4. Copy the firebaseConfig values here
// 5. Enable Authentication → Email/Password in the Firebase Console
// 6. Create a Firestore Database (start in test mode for now)
// ──────────────────────────────────────────────────────────────

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYNreBD-TXvPAkJdeFw9KG19-GiX_pmP4",
  authDomain: "f1p10-2593d.firebaseapp.com",
  projectId: "f1p10-2593d",
  storageBucket: "f1p10-2593d.firebasestorage.app",
  messagingSenderId: "602783158076",
  appId: "1:602783158076:web:b5825d88b22be8cce41839"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
