// ============================================================
// FIREBASE CONFIG - Leeman Data Sub
// ============================================================
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHVpdK_Dngwumu6M80_zRvndSYZ9H98r8",
  authDomain: "leeman-data-sub.firebaseapp.com",
  projectId: "leeman-data-sub",
  storageBucket: "leeman-data-sub.firebasestorage.app",
  messagingSenderId: "494880778883",
  appId: "1:494880778883:web:f746f62dd9eafb6f6909b6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
