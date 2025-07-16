// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjzA-bhrlHnehCFvQcXxaVKj7rWbSIcro",
  authDomain: "new-208d4.firebaseapp.com",
  projectId: "new-208d4",
  storageBucket: "new-208d4.firebasestorage.app",
  messagingSenderId: "676303519814",
  appId: "1:676303519814:web:a4853168acbc148b294a47",
  measurementId: "G-Z18YCH44V4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
