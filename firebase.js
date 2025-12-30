// firebase.js — Rikcat Online 2D (Base Estável)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  remove,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// ⚠️ CONFIGURAÇÃO DO SEU PROJETO
const firebaseConfig = {
  apiKey: "AIzaSyCN1HKOsaar-iCWuMM9XVmOJDBkK8Dmklk",
  authDomain: "rikcatonline2d.firebaseapp.com",
  projectId: "rikcatonline2d",
  storageBucket: "rikcatonline2d.firebasestorage.app",
  messagingSenderId: "773130395662",
  appId: "1:773130395662:web:b8d3e3974cddc0f4785c5f"
};

// 🔥 Inicializa Firebase
const app = initializeApp(firebaseConfig);

// 🔥 Realtime Database
const db = getDatabase(app);

// 🔁 EXPORTS (usados no game.js / admin.js)
export {
  db,
  ref,
  set,
  push,
  onValue,
  remove,
  onDisconnect
};
