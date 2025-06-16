import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDAZrGLivEUWzn_fdIiJQSxA4tDaAVylA0",
  authDomain: "ebarrio-21814.firebaseapp.com",
  projectId: "ebarrio-21814",
  storageBucket: "ebarrio-21814.firebasestorage.app",
  messagingSenderId: "844796857596",
  appId: "1:844796857596:web:257f1e3a0a71c58b381b79",
  measurementId: "G-8NRN5GY8WJ",
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

export { storage };
