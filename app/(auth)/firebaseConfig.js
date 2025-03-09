import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCDDjycYGBMNsN9fKKCHrPwyDwwPJI37KE",
    authDomain: "cs-ia-2025.firebaseapp.com",
    projectId: "cs-ia-2025",
    storageBucket: "cs-ia-2025.firebasestorage.app",
    messagingSenderId: "826089848814",
    appId: "1:826089848814:web:d10b721c196f38c941d8ff",
    measurementId: "G-M7YXEDBEJ9"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, app };
