import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';



const firebaseConfig = {
  apiKey: "AIzaSyAB3W_ZpnqyaFI18jvUbI7_WU4sB194rgg",
  authDomain: "wanderlist-59fb6.firebaseapp.com",
  projectId: "wanderlist-59fb6",
  storageBucket: "wanderlist-59fb6.appspot.com",
  messagingSenderId: "461050892029",
  appId: "1:461050892029:web:6c85effe6f49150780b894",
  measurementId: "G-PG63HNYQTX"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);
const db = getFirestore(app);  // Initialize Firestore
const storage = getStorage(app);
const functions = getFunctions(app);

export { auth,db,storage,functions }; // Export the auth object for use in other components
