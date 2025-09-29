// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyAH-8PLXrfecZRG8bRMR5aG5IqgNKGHwJI",
    authDomain: "prepwise-f0d94.firebaseapp.com",
    projectId: "prepwise-f0d94",
    storageBucket: "prepwise-f0d94.firebasestorage.app",
    messagingSenderId: "74415698345",
    appId: "1:74415698345:web:0b7e206cd382780f1794b8",
    measurementId: "G-4LX79TM530"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(app);
export const db = getFirestore(app);

