// admin-script.js
import { getDatabase, ref, onValue, set, push, remove, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase-config.js";

const db = getDatabase(app);

// Get a reference to the admin elements
const passInput = document.getElementById("pass");
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const adminArea = document.getElementById('adminArea');
const loginArea = document.getElementById('loginArea');
const password = "025429"; // Simplified password for demo purposes

// Handle login functionality
loginButton.addEventListener('click', () => {
    if (passInput.value === password) {
        loginArea.style.display = 'none';
        adminArea.style.display = 'block';
        alert("ברוך הבא למערכת הניהול! ✅");
        deletePastLessons();
    } else {
        alert("סיסמה שגויה, נסה שוב. ❌");
    }
});

passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

// Handle logout functionality
logoutButton.addEventListener('click', () => {
    loginArea.style.display = 'block';
    adminArea.style.display = 'none';
    passInput.value = "";
    alert("התנתקת בהצלחה. להתראות! 👋");
});

// Delete past lessons automatically
async function deletePastLessons() {
    const activeLessonsRef = ref(db, 'lessons/active');
    const snapshot = await get(activeLessonsRef);
    if (snapshot.exists()) {
        const now = new Date();
        snapshot.forEach(childSnapshot => {
            const lesson = childSnapshot.val();
            const lessonDateTime = new Date(`${lesson.date}T${lesson.time}`);
            if (lessonDateTime < now) {
                remove(ref(db, `lessons/active/${childSnapshot.key}`));
                console.log(`שיעור ${lesson.name} בוטל אוטומטית כי מועדו חלף.`);
            }
        });
    }
}

// Add a unique lesson - this is the corrected part
const addUniqueLessonButton = document.getElementById('addUniqueLessonButton');
if (addUniqueLessonButton) {
    addUniqueLessonButton.addEventListener('click', async () => {
        const name = document.getElementById('uniqueLessonName').value;
        const date = document.getElementById('uniqueLessonDate').value;
        const time = document.getElementById('uniqueLessonTime').value;
        const zoomLink = document.getElementById('uniqueLessonZoomLink').value;
        const maxParticipants = parseInt(document.getElementById('uniqueLessonMaxParticipants').value, 10);
        const now = new Date();
        const lessonDateTime = new Date(`${date}T${time}`);

        if (!name || !date || !time || !zoomLink || isNaN(maxParticipants)) {
            alert('נא למלא את כל השדות!');
            return;
        }

        if (lessonDateTime < now) {
            alert('לא ניתן להוסיף שיעור במועד שחלף.');
            return;
        }

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
        alert('השיעור הייחודי נוסף בהצלחה! 👏');
        // Clear form fields after successful submission
        document.getElementById('uniqueLessonName').value = '';
        document.getElementById('uniqueLessonDate').value = '';
        document.getElementById('uniqueLessonTime').value = '';
        document.getElementById('uniqueLessonZoomLink').value = '';
        document.getElementById('uniqueLessonMaxParticipants').value = '';
    });
}

// Display existing lessons for activation
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
            <button class="activate-btn" data-lesson-id="${lessonId}">הפעל שיעור זה</button>
        `;
        existingLessonsList.appendChild(div);
    });
    document.querySelectorAll('.activate-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const lessonId = event.target.dataset.lessonId;
            const date = document.getElementById(`date-${lessonId}`).value;
            const time = document.getElementById(`time-${lessonId}`).value;
            const zoomLink = document.getElementById(`zoom-${lessonId}`).value;
            const maxParticipants = parseInt(document.getElementById(`max-${lessonId}`).value, 10);
            const now = new Date();
            const lessonDateTime = new Date(`${date}T${time}`);
            const lessonRef = ref(db, `lessons/base/${lessonId}`);
            const lessonSnapshot = await get(lessonRef);
            const lesson = lessonSnapshot.val();

            if (!date || !time || !zoomLink || isNaN(maxParticipants)) {
                alert('נא למלא את כל השדות להפעלת השיעור.');
                return;
            }
            if (lessonDateTime < now) {
                alert('לא ניתן להפעיל שיעור במועד שחלף.');
                return;
            }
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
            alert(`השיעור ${lesson.name} הופעל בהצלחה! 🎉`);
        });
    });
});

// Display active lessons for management
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
            <button class="cancel-btn" data-active-id="${activeLessonId}">בטל שיעור</button>
        `;
        activeLessonsList.appendChild(div);
    });
    document.querySelectorAll('.cancel-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const activeLessonId = event.target.dataset.activeId;
            if (confirm('האם אתה בטוח שברצונך לבטל שיעור זה?')) {
                await remove(ref(db, `lessons/active/${activeLessonId}`));
                alert('השיעור בוטל בהצלחה!');
            }
        });
    });
});

// Display registration list
const regTable = document.getElementById('regTable');
onValue(ref(db, 'registrations'), (snapshot) => {
    const tbody = regTable.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const reg = childSnapshot.val();
            const regId = childSnapshot.key;
            const row = tbody.insertRow(-1);
            row.insertCell(0).textContent = reg.name;
            row.insertCell(1).textContent = reg.lessonName;
            row.insertCell(2).textContent = reg.date;
            row.insertCell(3).textContent = reg.time;
            const statusCell = row.insertCell(4);
            const actionsCell = row.insertCell(5);
            statusCell.textContent = reg.status || "ממתין";
            actionsCell.innerHTML = `<button class="delete-reg-btn" data-reg-id="${regId}">מחק</button>`;
            actionsCell.querySelector('.delete-reg-btn').addEventListener('click', async () => {
                if (confirm('האם אתה בטוח שברצונך למחוק נרשם זה?')) {
                    await remove(ref(db, `registrations/${regId}`));
                    alert('הנרשם נמחק בהצלחה!');
                }
            });
        });
    }
});

// Export data to CSV
const exportCsvButton = document.getElementById('exportCsvButton');
if (exportCsvButton) {
    exportCsvButton.addEventListener('click', async () => {
        const snapshot = await get(ref(db, 'registrations'));
        if (!snapshot.exists()) {
            alert("אין נרשמים לייצא.");
            return;
        }
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
}

// Hamburger menu
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
