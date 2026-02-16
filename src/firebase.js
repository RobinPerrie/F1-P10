import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYNreBD-TXvPAkJdeFw9KG19-GiX_pmP4",
  authDomain: "f1p10-2593d.firebaseapp.com",
  projectId: "f1p10-2593d",
  storageBucket: "f1p10-2593d.firebasestorage.app",
  messagingSenderId: "602783158076",
  appId: "1:602783158076:web:b5825d88b22be8cce41839",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
