// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG17oEvXw-B0MBkZPLaCBYncuIOwgrsOo",
  authDomain: "test-f9621.firebaseapp.com",
  projectId: "test-f9621",
  storageBucket: "test-f9621.firebasestorage.app",
  messagingSenderId: "293849144617",
  appId: "1:293849144617:web:80fd77e8f8da3a98ca2b38",
  measurementId: "G-DM7VPHRHQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
