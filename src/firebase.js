import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDLjqSXxxIdQNepoHmM4HNjRBEpSR53p2c",
  authDomain: "investor-bec23.firebaseapp.com",
  projectId: "investor-bec23",
  storageBucket: "investor-bec23.firebasestorage.app",
  messagingSenderId: "661350409211",
  appId: "1:661350409211:web:688dd34ac7db21cb94a15e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();