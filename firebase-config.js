// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAzLYn1Ct-dN7Z6KeTuyklbZLTuOzx6Ii8",
    authDomain: "dt2026-7c72e.firebaseapp.com",
    projectId: "dt2026-7c72e",
    storageBucket: "dt2026-7c72e.firebasestorage.app",
    messagingSenderId: "41614721790",
    appId: "1:41614721790:web:7b502f301566a2da401baf",
    measurementId: "G-8J914KEKL7",
    databaseURL: "https://dt2026-7c72e-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db };
