import { getDatabase, ref, onValue, set, push, remove, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase-config.js";

const db = getDatabase(app);

const loginArea = document.getElementById("loginArea");
const adminArea = document.getElementById("adminArea");
const passInput = document.getElementById("pass");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");

const addUniqueLessonButton = document.getElementById("addUniqueLessonButton");
const uniqueLessonName = document.getElementById("uniqueLessonName");
const uniqueLessonDate = document.getElementById("uniqueLessonDate");
const uniqueLessonTime = document.getElementById("uniqueLessonTime");
const uniqueLessonZoomLink = document.getElementById("uniqueLessonZoomLink");
const uniqueLessonMaxParticipants = document.getElementById("uniqueLessonMaxParticipants");

const activeLessonsList = document.getElementById("activeLessonsList");

// ===== התחברות והתנתקות =====
const adminPassword = "1234"; // שנה את הסיסמה לפי הצורך

loginButton.addEventListener("click", () => {
    if(passInput.value === adminPassword) {
        loginArea.style.display = "none";
        adminArea.style.display = "block";
        loadActiveLessons();
    } else {
        alert("סיסמה שגויה!");
    }
});

logoutButton.addEventListener("click", () => {
    adminArea.style.display = "none";
    loginArea.style.display = "block";
    passInput.value = "";
});

// ===== הוספת שיעור ייחודי =====
addUniqueLessonButton.addEventListener("click", async () => {
    const name = uniqueLessonName.value.trim();
    const date = uniqueLessonDate.value;
    const time = uniqueLessonTime.value;
    const zoomLink = uniqueLessonZoomLink.value.trim();
    const max = parseInt(uniqueLessonMaxParticipants.value);

    if (!name || !date || !time || !zoomLink || !max) {
        alert("אנא מלא את כל השדות.");
        return;
    }

    const lessonData = {
        name,
        date,
        time,
        zoomLink,
        maxParticipants: max,
        currentParticipants: 0,
        type: "unique"
    };

    const newLessonRef = push(ref(db, "lessons/active"));
    await set(newLessonRef, lessonData);

    uniqueLessonName.value = "";
    uniqueLessonDate.value = "";
    uniqueLessonTime.value = "";
    uniqueLessonZoomLink.value = "";
    uniqueLessonMaxParticipants.value = "";

    loadActiveLessons();
});

// ===== טעינת שיעורים פעילים =====
function loadActiveLessons() {
    activeLessonsList.innerHTML = "";
    onValue(ref(db, "lessons/active"), (snapshot) => {
        activeLessonsList.innerHTML = "";
        const now = new Date();

        snapshot.forEach(child => {
            const lesson = child.val();
            const key = child.key;

            // מחיקה אוטומטית אם השיעור חלף
            const lessonDateTime = new Date(`${lesson.date}T${lesson.time}`);
            if (lessonDateTime < now) {
                remove(ref(db, `lessons/active/${key}`));
                return;
            }

            // יצירת אלמנט לכל שיעור פעיל
            const div = document.createElement("div");
            div.className = "active-lesson-item";
            div.style.marginBottom = "10px";
            div.innerHTML = `
                <strong>${lesson.name}</strong> - תאריך: ${lesson.date} שעה: ${lesson.time} - מקסימלי: ${lesson.maxParticipants}<br>
                <button data-key="${key}" class="deleteLessonBtn">מחק שיעור</button>
            `;
            activeLessonsList.appendChild(div);
        });

        // הוספת מאזין למחיקה
        document.querySelectorAll(".deleteLessonBtn").forEach(btn => {
            btn.addEventListener("click", () => {
                const key = btn.getAttribute("data-key");
                remove(ref(db, `lessons/active/${key}`));
            });
        });
    });
}

// ===== המבורגר =====
document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".navMenu");
    if (hamburger) {
        hamburger.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            hamburger.classList.toggle("active");
        });
    }
});
