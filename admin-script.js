// admin-script.js
import { getDatabase, ref, onValue, set, push, remove, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase-config.js";

const db = getDatabase(app);

// טיפול בכפתורי התחברות והתנתקות
const passInput = document.getElementById("pass");
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const adminArea = document.getElementById('adminArea');
const loginArea = document.getElementById('loginArea');
const password = "025429";

loginButton.addEventListener('click', () => {
    if (passInput.value === password) {
        loginArea.style.display = 'none';
        adminArea.style.display = 'block';
        alert("ברוך הבא למערכת הניהול! ✅");
        displayAdminHeaderInfo();
    } else {
        alert("סיסמה שגויה, נסה שוב. ❌");
    }
});

logoutButton.addEventListener('click', () => {
    loginArea.style.display = 'block';
    adminArea.style.display = 'none';
    passInput.value = "";
    alert("התנתקת בהצלחה. להתראות! 👋");
});

// פונקציית תצוגת כותרת למנהל
function displayAdminHeaderInfo() {
    const infoDiv = document.getElementById('adminHeaderInfo');
    const now = new Date();
    const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const dayOfWeek = daysOfWeek[now.getDay()];
    const date = now.toLocaleDateString('he-IL');
    const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    infoDiv.innerHTML = `<p><strong>${dayOfWeek}, ${date}</strong> | <strong>${time}</strong></p><p><strong>הנהגה עליונה ארגון החירות והצדק</strong></p>`;
}

// טיפול בהוספת שיעור ייחודי חדש
const addUniqueLessonButton = document.getElementById('addUniqueLessonButton');
const uniqueLessonNameInput = document.getElementById('uniqueLessonName');
const uniqueLessonDateInput = document.getElementById('uniqueLessonDate');
const uniqueLessonTimeInput = document.getElementById('uniqueLessonTime');
const uniqueLessonZoomLinkInput = document.getElementById('uniqueLessonZoomLink');
const uniqueLessonMaxParticipantsInput = document.getElementById('uniqueLessonMaxParticipants');

addUniqueLessonButton.addEventListener('click', async () => {
    const name = uniqueLessonNameInput.value;
    const date = uniqueLessonDateInput.value;
    const time = uniqueLessonTimeInput.value;
    const zoomLink = uniqueLessonZoomLinkInput.value;
    const maxParticipants = parseInt(uniqueLessonMaxParticipantsInput.value, 10);

    if (name && date && time && zoomLink && maxParticipants) {
        const newLessonRef = push(ref(db, 'lessons/active'));
        await set(newLessonRef, {
            name,
            date,
            time,
            zoomLink,
            maxParticipants,
            currentParticipants: 0,
            type: 'unique'
        });
        alert('השיעור הייחודי נוסף בהצלחה!');
        uniqueLessonNameInput.value = '';
        uniqueLessonDateInput.value = '';
        uniqueLessonTimeInput.value = '';
        uniqueLessonZoomLinkInput.value = '';
        uniqueLessonMaxParticipantsInput.value = '';
    } else {
        alert('נא למלא את כל השדות!');
    }
});

// הצגת רשימת השיעורים הקיימים והפעלתם
const existingLessonsList = document.getElementById('existingLessonsList');
onValue(ref(db, 'lessons/base'), (snapshot) => {
    existingLessonsList.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
        const lesson = childSnapshot.val();
        const lessonId = childSnapshot.key;
        const div = document.createElement('div');
        div.innerHTML = `
            <h4>${lesson.name}</h4>
            <input type="date" id="date-${lessonId}">
            <input type="time" id="time-${lessonId}">
            <input type="url" id="zoom-${lessonId}" placeholder="קישור לזום">
            <input type="number" id="max-${lessonId}" placeholder="מספר נרשמים מקסימלי">
            <button id="activate-${lessonId}">הפעל שיעור זה</button>
        `;
        existingLessonsList.appendChild(div);
        
        document.getElementById(`activate-${lessonId}`).addEventListener('click', async () => {
            const date = document.getElementById(`date-${lessonId}`).value;
            const time = document.getElementById(`time-${lessonId}`).value;
            const zoomLink = document.getElementById(`zoom-${lessonId}`).value;
            const maxParticipants = parseInt(document.getElementById(`max-${lessonId}`).value, 10);

            if (date && time && zoomLink && maxParticipants) {
                const newActiveLessonRef = push(ref(db, 'lessons/active'));
                await set(newActiveLessonRef, {
                    baseLessonId: lessonId,
                    name: lesson.name,
                    date,
                    time,
                    zoomLink,
                    maxParticipants,
                    currentParticipants: 0,
                    type: 'base'
                });
                alert(`השיעור ${lesson.name} הופעל בהצלחה!`);
            } else {
                alert('נא למלא את כל השדות להפעלת השיעור.');
            }
        });
    });
});

// הצגת שיעורים פעילים לניהול
const activeLessonsList = document.getElementById('activeLessonsList');
onValue(ref(db, 'lessons/active'), (snapshot) => {
    activeLessonsList.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
        const lesson = childSnapshot.val();
        const activeLessonId = childSnapshot.key;
        const div = document.createElement('div');
        div.innerHTML = `
            <h4>${lesson.name} (תאריך: ${lesson.date}, שעה: ${lesson.time})</h4>
            <p>נרשמים: ${lesson.currentParticipants} / ${lesson.maxParticipants}</p>
            <button id="cancel-${activeLessonId}">בטל שיעור</button>
        `;
        activeLessonsList.appendChild(div);

        document.getElementById(`cancel-${activeLessonId}`).addEventListener('click', async () => {
            await remove(ref(db, `lessons/active/${activeLessonId}`));
            alert('השיעור בוטל בהצלחה!');
        });
    });
});

// הצגת רשימת נרשמים
const regTable = document.getElementById('regTable');
onValue(ref(db, 'registrations'), (snapshot) => {
    while (regTable.rows.length > 1) {
        regTable.deleteRow(1);
    }
    snapshot.forEach((childSnapshot) => {
        const reg = childSnapshot.val();
        const regId = childSnapshot.key;
        const row = regTable.insertRow(-1);
        row.insertCell(0).textContent = reg.name;
        row.insertCell(1).textContent = reg.lessonName;
        row.insertCell(2).textContent = reg.date;
        row.insertCell(3).textContent = reg.time;
        const statusCell = row.insertCell(4);
        const actionsCell = row.insertCell(5);
        statusCell.textContent = reg.status || "ממתין";
        actionsCell.innerHTML = `<button class="delete-reg-btn">מחק</button>`;
        actionsCell.querySelector('.delete-reg-btn').addEventListener('click', async () => {
            await remove(ref(db, `registrations/${regId}`));
            alert('הנרשם נמחק בהצלחה!');
        });
    });
});

// יצוא ל-CSV
const exportCsvButton = document.getElementById('exportCsvButton');
exportCsvButton.addEventListener('click', async () => {
    const snapshot = await get(ref(db, 'registrations'));
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    const headers = ["שם", "שיעור", "תאריך", "שעה", "סטטוס"];
    csvContent += headers.join(",") + "\n";
    snapshot.forEach((childSnapshot) => {
        const reg = childSnapshot.val();
        const row = [reg.name, reg.lessonName, reg.date, reg.time, reg.status];
        csvContent += row.map(item => `"${item}"`).join(",") + "\n";
    });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "registrations.csv";
    link.click();
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
