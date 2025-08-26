// register-script.js
import { getDatabase, ref, onValue, set, push, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase-config.js";

const db = getDatabase(app);

const regForm = document.getElementById("registerForm");
const lessonSelect = document.getElementById("lesson");
const lessonDateDisplay = document.getElementById("lessonDateDisplay");
const lessonTimeDisplay = document.getElementById("lessonTimeDisplay");

// טעינת שיעורים פעילים מ-Firebase ושמירתם בזיכרון המקומי
let activeLessons = {};
onValue(ref(db, 'lessons/active'), (snapshot) => {
    lessonSelect.innerHTML = '<option value="">-- בחר שיעור --</option>';
    activeLessons = {};
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const lesson = childSnapshot.val();
            activeLessons[childSnapshot.key] = lesson;
            if (lesson.currentParticipants < lesson.maxParticipants) {
                const option = document.createElement("option");
                option.value = childSnapshot.key;
                option.textContent = `${lesson.name} (${lesson.maxParticipants - lesson.currentParticipants} מקומות פנויים)`;
                lessonSelect.appendChild(option);
            }
        });
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

// טיפול בשליחת הטופס
regForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const lessonId = lessonSelect.value;
    const name = document.getElementById("name").value;

    if (!lessonId || !name) {
        alert("אנא מלא את כל השדות.");
        return;
    }

    const lessonRef = ref(db, `lessons/active/${lessonId}`);
    const lessonSnapshot = await get(lessonRef);
    if (lessonSnapshot.exists()) {
        const lesson = lessonSnapshot.val();
        if (lesson.currentParticipants < lesson.maxParticipants) {
            // הוספת נרשם
            await push(ref(db, 'registrations'), {
                lessonId: lessonId,
                lessonName: lesson.name,
                name: name,
                date: lesson.date,
                time: lesson.time,
                status: 'ממתין'
            });

            // עדכון מספר הנרשמים בשיעור
            await set(ref(db, `lessons/active/${lessonId}/currentParticipants`), lesson.currentParticipants + 1);

            // הצגת הודעת אישור עם קישור לזום
            alert(`נרשמת בהצלחה! ✅ \nשיעור: ${lesson.name}\nתאריך: ${lesson.date}\nשעה: ${lesson.time}\n\nהקישור לזום הוא: ${lesson.zoomLink}`);
            regForm.reset();
        } else {
            alert("השיעור מלא, לא ניתן להירשם.");
        }
    } else {
        alert("השיעור שבחרת אינו זמין.");
    }
});
// ==================== תפריט המבורגר (לכל העמודים) ====================
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
