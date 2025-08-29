// register-script.js
import { getDatabase, ref, onValue, set, push, get, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase-config.js";

const db = getDatabase(app);

const regForm = document.getElementById("registerForm");
const lessonSelect = document.getElementById("lesson");
const lessonDateDisplay = document.getElementById("lessonDateDisplay");
const lessonTimeDisplay = document.getElementById("lessonTimeDisplay");
const nameInput = document.getElementById("name");
const registerContainer = document.querySelector('.hero.register');

// שמירת שיעורים פעילים בזיכרון המקומי
let activeLessons = {};
let initialLoad = true;

// טעינת שיעורים פעילים מ-Firebase
onValue(ref(db, 'lessons/active'), (snapshot) => {
    lessonSelect.innerHTML = '<option value="">-- בחר שיעור --</option>';
    activeLessons = {};
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const lesson = childSnapshot.val();
            const lessonId = childSnapshot.key;
            activeLessons[lessonId] = lesson;
            if (lesson.currentParticipants < lesson.maxParticipants) {
                const option = document.createElement("option");
                option.value = lessonId;
                option.textContent = `${lesson.name} (${lesson.maxParticipants - lesson.currentParticipants} מקומות פנויים)`;
                lessonSelect.appendChild(option);
            }
        });
    }

    // מילוי אוטומטי של הטופס אם יש מזהה שיעור ב-URL
    if (initialLoad) {
        const urlParams = new URLSearchParams(window.location.search);
        const lessonIdFromUrl = urlParams.get('lessonId');
        if (lessonIdFromUrl && activeLessons[lessonIdFromUrl]) {
            lessonSelect.value = lessonIdFromUrl;
            lessonSelect.dispatchEvent(new Event('change'));
        }
        initialLoad = false;
    }
});

// עדכון תאריך ושעה כשבוחרים שיעור
lessonSelect.addEventListener('change', () => {
    const lessonId = lessonSelect.value;
    if (lessonId && activeLessons[lessonId]) {
        const lesson = activeLessons[lessonId];
        lessonDateDisplay.textContent = `תאריך: ${lesson.date}`;
        lessonTimeDisplay.textContent = ` | שעה: ${lesson.time}`;
    } else {
        lessonDateDisplay.textContent = '';
        lessonTimeDisplay.textContent = '';
    }
});

// פונקציה שמציגה דף סיכום
function showSummaryPage(lesson, name) {
    registerContainer.innerHTML = `
        <div class="header">
            <img src="t.jpg" class="logo left">
            <img src="logo.jpg" class="logo center">
            <img src="t.jpg" class="logo right">
            <h1>✅ הרשמתך נקלטה בהצלחה</h1>
        </div>
        <div class="summary-card">
            <h2>סיכום הרשמה</h2>
            <p><strong>שם מלא:</strong> ${name}</p>
            <p><strong>שיעור:</strong> ${lesson.name}</p>
            <p><strong>תאריך:</strong> ${lesson.date}</p>
            <p><strong>שעה:</strong> ${lesson.time}</p>
            <p class="zoom-link-p"><strong>קישור לזום:</strong> <a href="${lesson.zoomLink}" target="_blank">לחץ כאן כדי להתחבר לשיעור</a></p>
            <button onclick="window.location.href='index.html'">חזור לדף הבית</button>
        </div>
    `;

    // הוספת CSS עבור מסך הסיכום
    const style = document.createElement('style');
    style.innerHTML = `
        .summary-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            padding: 30px;
            border-radius: 15px;
            display: inline-block;
            margin-top: 50px;
            color: #fff;
            text-align: center;
            border: 2px solid #fff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
        .summary-card h2 {
            margin-top: 0;
        }
        .summary-card button {
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #00c9ff;
            color: #111;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1rem;
        }
        .summary-card a {
            color: #fff;
            font-weight: bold;
            text-decoration: underline;
        }
        .zoom-link-p {
            font-size: 1.1em;
            margin-top: 20px;
        }
        #hero.register h1 {
            color: #fff;
        }
    `;
    document.head.appendChild(style);
}

// טיפול בשליחת הטופס
regForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const lessonId = lessonSelect.value;
    const name = nameInput.value;

    if (!lessonId || !name) {
        alert("אנא מלא את כל השדות.");
        return;
    }

    const lessonRef = ref(db, `lessons/active/${lessonId}`);

    // שימוש ב-runTransaction למניעת מרוץ נתונים
    try {
        const result = await runTransaction(lessonRef, (currentData) => {
            if (currentData) {
                if (currentData.currentParticipants < currentData.maxParticipants) {
                    currentData.currentParticipants++;
                    return currentData;
                } else {
                    return; // abort the transaction
                }
            } else {
                return; // abort the transaction
            }
        });

        if (result.committed) {
            // הוספת נרשם
            await push(ref(db, 'registrations'), {
                lessonId: lessonId,
                lessonName: result.snapshot.val().name,
                name: name,
                date: result.snapshot.val().date,
                time: result.snapshot.val().time,
                status: 'ממתין'
            });
            showSummaryPage(result.snapshot.val(), name);
        } else {
            alert("השיעור מלא, לא ניתן להירשם. נסה שיעור אחר.");
        }
    } catch (error) {
        console.error("שגיאה בתהליך הרישום:", error);
        alert("אירעה שגיאה בתהליך הרישום. נסה שוב מאוחר יותר.");
    }
});

// אתחול תפריט ההמבורגר
function initHamburgerMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".navMenu");
    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            hamburger.classList.toggle("active");
        });
    }
}
initHamburgerMenu();
