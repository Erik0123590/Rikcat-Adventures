import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCGDk08XGGYOTYnXchuDDrBS0emCm87P0",
  authDomain: "rikcatonline.firebaseapp.com",
  databaseURL: "https://rikcatonline-default-rtdb.firebaseio.com",
  projectId: "rikcatonline",
  storageBucket: "rikcatonline.firebasestorage.app",
  messagingSenderId: "504285237002",
  appId: "1:504285237002:web:9841ceb83ea0fe919674f3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Adicionado o push aqui para o chat funcionar
export { db, ref, set, onValue, onDisconnect, push };
