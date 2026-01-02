// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN1HKOsaar-iCWuMM9XVmOJDBkK8Dmklk",
  authDomain: "rikcatonline2d.firebaseapp.com",
  projectId: "rikcatonline2d",
  storageBucket: "rikcatonline2d.firebasestorage.app",
  messagingSenderId: "773130395662",
  appId: "1:773130395662:web:b8d3e3974cddc0f4785c5f",
  databaseURL: "https://rikcatonline2d-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, onValue, onDisconnect, push, remove };
