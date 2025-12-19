// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxX54j4GPJ2QJbNe8t4zFNJhCkSUgBhKA",
  authDomain: "subwise-1f592.firebaseapp.com",
  projectId: "subwise-1f592",
  storageBucket: "subwise-1f592.firebasestorage.app",
  messagingSenderId: "852270543948",
  appId: "1:852270543948:web:11c0fdfb7b19bfda7530e9",
  measurementId: "G-LH6CBMTVHZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
