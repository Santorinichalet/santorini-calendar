// استيراد Firebase من ES modules مباشرة
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAs1Qz1_8Bge6LvIZ61CsjQV4P8RSa8t4A",
  authDomain: "santorini-chalet.firebaseapp.com",
  projectId: "santorini-chalet",
  storageBucket: "santorini-chalet.firebasestorage.app",
  messagingSenderId: "280049242908",
  appId: "1:280049242908:web:2e6e7d9d88506c764760d9",
  measurementId: "G-D8THYXGFSN"
};

// تهيئة التطبيق والـ Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
