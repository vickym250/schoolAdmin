// firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC9W3ABpuVgmQP3WJtV00At7g3Qud0iQOU",
  authDomain: "schooltest-b8ce2.firebaseapp.com",
  projectId: "schooltest-b8ce2",
  storageBucket: "schooltest-b8ce2.firebasestorage.app", // ✔ CORRECT
  messagingSenderId: "436336891260",
  appId: "1:436336891260:web:dc98f8ea6e51897f4300f9",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
