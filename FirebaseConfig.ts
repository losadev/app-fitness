// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCydfwrxueLwJQzaUB417f_nwuqyUHqjRQ",
  authDomain: "app-fitness-f4e0b.firebaseapp.com",
  projectId: "app-fitness-f4e0b",
  storageBucket: "app-fitness-f4e0b.firebasestorage.app",
  messagingSenderId: "811419628510",
  appId: "1:811419628510:web:7cd14a5144474577bae34f",
  measurementId: "G-YFK3JWWCT5",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = initializeAuth(app);
