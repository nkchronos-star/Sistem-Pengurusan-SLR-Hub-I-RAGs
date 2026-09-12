import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDklf7yPokvHbavcD6SFZojkvotK8P0EUA",
  authDomain: "slr-hub-i-rags.firebaseapp.com",
  projectId: "slr-hub-i-rags",
  storageBucket: "slr-hub-i-rags.firebasestorage.app",
  messagingSenderId: "522155510831",
  appId: "1:522155510831:web:25922cc3f3b35ad75b8ada",
  measurementId: "G-N5WJT59R5C"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});

