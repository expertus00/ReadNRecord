// =====================================================
// Firebase 설정 파일 — readnrecord-54606
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRqPglyfSOj7a8uIpNIq5bTl-Ysd4TVPI",
  authDomain: "readnrecord-54606.firebaseapp.com",
  projectId: "readnrecord-54606",
  storageBucket: "readnrecord-54606.firebasestorage.app",
  messagingSenderId: "508329373084",
  appId: "1:508329373084:web:8454df8fb3b8e773d46c59"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
