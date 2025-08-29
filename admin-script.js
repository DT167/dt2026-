// admin-script.js
import { getDatabase, ref, onValue, set, push, remove, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase-config.js";

const db = getDatabase(app);

// --- עוטף הכל כדי להבטיח שה־DOM קיים ---
document.addEventListener('DOMContentLoaded', () => {
  const passInput   = document.getElementById("pass");
  const loginButton = document.getElementById('loginButton');
  const logoutButton= document.getElementById('logoutButton');
  const adminArea   = document.getElementById('adminArea');
  const loginArea   = document.getElementById('loginArea');
  const password    = "025429"; // דמו

  // ===== התחברות/התנתקות =====
  loginButton.addEventListener('click', () => {
    if (passInput.value === password) {
      loginArea.style.display = 'none';
      adminArea.style.display = 'block';
      alert("ברוך הבא למערכת הניהול! ✅");
      deletePastLessons();            // ניקוי מיידי
      startAutoCleanup();             // וניקוי מחזורי
    } else {
      alert("סיסמה שגויה, נסה שוב. ❌");
    }
  });

  passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginButton.click();
  });

  logoutButton.addEventListener('click', () => {
    loginArea.style.display = 'block';
    adminArea.style.display = 'none';
    passInput.value = "";
    alert("התנתקת בהצלחה. 👋");
  });

  // ===== ניקוי שיעורים שחלפו =====
  async function deletePastLessons() {
    const activeLessonsRef = ref(db, 'lessons/active');
    const snapshot = await get(activeLessonsRef);
    if (!snapshot.exists()) return;

    const now = new Date();
    const removals = [];
    snapshot.forEach(child => {
      const l = child.val();
      const dt = new Date(`${l.date}T${l.time}`);
      if (isFinite(dt) && dt < now) {
        removals.push(remove(ref(db, `lessons/active/${child.key}`)));
        console.log(`שיעור ${l.name} הוסר אוטומטית (עבר זמנו).`);
      }
    });
    await Promise.allSettled(removals);
  }

  let cleanupTimer = null;
  function startAutoCleanup() {
    if (cleanupTimer) clearInterval(cleanupTimer);
    cleanupTimer = setInterval(deletePastLessons, 60 * 1000); // כל דקה
  }

  // ===== הוספת שיעור ייחודי (תוקן: מאזין בטוח + ולידציה מוקשחת) =====
  const addUniqueLessonButton = document.getElementById('addUniqueLessonButton');
  if (addUniqueLessonButton) {
    addUniqueLessonButton.addEventListener('click', async () => {
      const name = (document.getElementById('uniqueLessonName').value || '').trim();
      const date = document.getElementById('uniqueLessonDate').value;
      const time = document.getElementById('uniqueLessonTime').value;
      const zoomLink = (document.getElementById('uniqueLessonZoomLink').value || '').trim();
      const maxParticipantsStr = document.getElementById('uniqueLessonMaxParticipants').value;
      const maxParticipants = Number(maxParticipantsStr);

      if (!name || !date || !time || !zoomLink || !Number.isInteger(maxParticipants) || maxParticipants <= 0) {
        alert('נא למלא את כל השדות בצורה תקינה (כולל מספר מקסימלי גדול מ-0).');
        return;
      }

      const lessonDateTime = new Date(`${date}T${time}`);
      const now = new Date();
      if (!isFinite(lessonDateTime)) {
        alert('תאריך/שעה לא תקינים.');
        return;
      }
      if (lessonDateTime < now) {
        alert('לא ניתן להוסיף שיעור במועד שחלף.');
        return;
      }

      // מניעת כפילות (אותו שם + אותו זמן)
      const activeSnap = await get(ref(db, 'lessons/active'));
      let duplicate = false;
      if (activeSnap.exists()) {
        activeSnap.forEach(child => {
          const l = child.val();
          if ((l.name || '').trim() === name && l.date === date && l.time === time) {
            duplicate = true;
          }
        });
      }
      if (duplicate) {
        alert('כבר קיים שיעור עם אותו שם באותו מועד.');
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
        type: 'unique',
        createdAt: Date.now()
      });

      alert('השיעור הייחודי נוסף בהצלחה! 👏');

      // ניקוי שדות
      document.getElementById('uniqueLessonName').value = '';
      document.getElementById('uniqueLessonDate').value = '';
      document.getElementById('uniqueLessonTime').value = '';
      document.getElementById('uniqueLessonZoomLink').value = '';
      document.getElementById('uniqueLessonMaxParticipants').value = '';
    });
  }

  // ===== הפעלת שיעור קיים מתוך lessons/base =====
  const existingLessonsList = document.getElementById('existingLessonsList');
  onValue(ref(db, 'lessons/base'), (snapshot) => {
    existingLessonsList.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
      const base = childSnapshot.val();
      const lessonId = childSnapshot.key;
      const div = document.createElement('div');
      div.innerHTML = `
        <h4>${base.name}</h4>
        <input type="date" id="date-${lessonId}">
        <input type="time" id="time-${lessonId}">
        <input type="url" id="zoom-${lessonId}" placeholder="קישור לזום">
        <input type="number" id="max-${lessonId}" placeholder="מספר נרשמים מקסימלי" min="1">
        <button class="activate-btn" data-lesson-id="${lessonId}">הפעל שיעור זה</button>
      `;
      existingLessonsList.appendChild(div);
    });

    document.querySelectorAll('.activate-btn').forEach(button => {
      button.addEventListener('click', async (event) => {
        const lessonId = event.target.dataset.lessonId;
        const date = document.getElementById(`date-${lessonId}`).value;
        const time = document.getElementById(`time-${lessonId}`).value;
        const zoomLink = (document.getElementById(`zoom-${lessonId}`).value || '').trim();
        const maxParticipantsStr = document.getElementById(`max-${lessonId}`).value;
        const maxParticipants = Number(maxParticipantsStr);

        if (!date || !time || !zoomLink || !Number.isInteger(maxParticipants) || maxParticipants <= 0) {
          alert('נא למלא את כל השדות להפעלת השיעור (כולל מספר מקסימלי גדול מ-0).');
          return;
        }

        const lessonDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        if (!isFinite(lessonDateTime) || lessonDateTime < now) {
          alert('לא ניתן להפעיל שיעור במועד שחלף.');
          return;
        }

        const lessonRef = ref(db, `lessons/base/${lessonId}`);
        const lessonSnapshot = await get(lessonRef);
        const base = lessonSnapshot.val();

        const newActiveLessonRef = push(ref(db, 'lessons/active'));
        await set(newActiveLessonRef, {
          baseLessonId: lessonId,
          name: base.name,
          date,
          time,
          zoomLink,
          maxParticipants,
          currentParticipants: 0,
          type: 'base',
          createdAt: Date.now()
        });
        alert(`השיעור ${base.name} הופעל בהצלחה! 🎉`);
      });
    });
  });

  // ===== רשימת שיעורים פעילים + מחיקה ידנית =====
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

  // ===== רשימת נרשמים + מחיקה =====
  const regTable = document.getElementById('regTable');
  onValue(ref(db, 'registrations'), (snapshot) => {
    const tbody = regTable.querySelector('tbody');
    if (!tbody) return;
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
  });

  // ===== ייצוא CSV =====
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
        const row = [reg.name, reg.lessonName, reg.date, reg.time, reg.status || ""];
        csvContent += row.map(item => `"${(item ?? '').toString().replace(/"/g,'""')}"`).join(",") + "\n";
      });
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = "registrations.csv";
      link.click();
    });
  }

  // ===== המבורגר =====
  (function initHamburgerMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".navMenu");
    if (hamburger && navMenu) {
      hamburger.addEventListener("click", () => {
        navMenu.classList.toggle("active");
        hamburger.classList.toggle("active");
      });
    }
  })();
});
