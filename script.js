// ==================== Firebase Initialization ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update, child, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzLYn1Ct-dN7Z6KeTuyklbZLTuOzx6Ii8",
  authDomain: "dt2026-7c72e.firebaseapp.com",
  projectId: "dt2026-7c72e",
  storageBucket: "dt2026-7c72e.firebasestorage.app",
  messagingSenderId: "41614721790",
  appId: "1:41614721790:web:7b502f301566a2da401baf",
  measurementId: "G-8J914KEKL7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==================== תפריט המבורגר ====================
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

// ==================== טופס הרשמה ====================
const regForm = document.getElementById("registerForm");
if (regForm) {
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const lessonSelect = document.getElementById("lesson");

  async function populateLessons() {
    lessonSelect.innerHTML = '<option value="">-- בחר שיעור --</option>';
    const snapshot = await get(ref(db, 'lessons'));
    if (snapshot.exists()) {
      const lessonsData = snapshot.val();
      const now = new Date();
      Object.values(lessonsData).forEach(lesson => {
        // בודק אם השיעור פעיל והקיבולת > 0
        if (lesson.status === 'open' && lesson.capacity > 0) {
          // מסנן שיעורים שעברו
          const lessonDateTime = new Date(lesson.dateTime);
          if (lessonDateTime >= now) {
            const option = document.createElement("option");
            option.value = lesson.id;
            option.textContent = `${lesson.name} (${lesson.capacity} מקומות פנויים)`;
            lessonSelect.appendChild(option);
          }
        }
      });
    }
  }

  async function populateTimeSlots() {
    const selectedLessonId = lessonSelect.value;
    timeSelect.innerHTML = '<option value="">-- בחר שעה --</option>';
    if (!selectedLessonId) return;

    const snapshot = await get(ref(db, `lessons/${selectedLessonId}/slots`));
    if (snapshot.exists()) {
      const slots = snapshot.val();
      const now = new Date();
      Object.entries(slots).forEach(([key, slot]) => {
        const slotTime = new Date(slot.dateTime);
        if (!slot.reserved && slotTime >= now) {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = slotTime.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
          timeSelect.appendChild(option);
        }
      });
    }
  }

  dateInput.addEventListener('change', populateTimeSlots);
  lessonSelect.addEventListener('change', populateTimeSlots);

  populateLessons();

  regForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const lessonId = lessonSelect.value;
    const slotId = timeSelect.value;
    const name = document.getElementById("name").value;

    if (!lessonId || !slotId || !name) {
      alert("אנא מלא את כל השדות.");
      return;
    }

    const lessonRef = ref(db, `lessons/${lessonId}`);
    const slotRef = ref(db, `lessons/${lessonId}/slots/${slotId}`);

    const lessonSnap = await get(lessonRef);
    const slotSnap = await get(slotRef);
    if (!lessonSnap.exists() || !slotSnap.exists()) {
      alert("השיעור או השעה אינם קיימים.");
      return;
    }

    const lessonData = lessonSnap.val();
    const slotData = slotSnap.val();

    if (lessonData.capacity <= 0 || slotData.reserved) {
      alert("השיעור אינו זמין כרגע.");
      return;
    }

    // שמירה ברשומות
    const newRegRef = ref(db, 'registrations');
    const regSnap = await get(newRegRef);
    const regs = regSnap.exists() ? regSnap.val() : [];
    regs.push({
      lessonId,
      lessonName: lessonData.name,
      slotId,
      dateTime: slotData.dateTime,
      zoom: lessonData.zoom || '',
      name,
      approved: false
    });
    await set(newRegRef, regs);

    // עדכון קיבולת ושעת השיעור
    await update(lessonRef, { capacity: lessonData.capacity - 1 });
    await update(slotRef, { reserved: true });

    alert("נרשמת בהצלחה! ✅");
    this.reset();
    populateLessons();
    populateTimeSlots();
  });
}

// ==================== עמוד מנהלים ====================
const passInput = document.getElementById("pass");
if (passInput) {
  passInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") checkPass();
  });
}

async function checkPass() {
  if (document.getElementById("pass").value === "025429") {
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("adminArea").style.display = "block";
    displayAdminHeaderInfo();
    renderAdmin();
    alert("ברוך הבא למערכת הניהול! ✅");
  } else {
    alert("סיסמה שגויה, נסה שוב. ❌");
  }
}

function logout() {
  document.getElementById("adminArea").style.display = "none";
  document.getElementById("loginArea").style.display = "block";
  document.getElementById("pass").value = "";
  alert("התנתקת בהצלחה. להתראות! 👋");
}

function displayAdminHeaderInfo() {
  const infoDiv = document.getElementById('adminHeaderInfo');
  const now = new Date();
  const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayOfWeek = daysOfWeek[now.getDay()];
  const date = now.toLocaleDateString('he-IL');
  const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  infoDiv.innerHTML = `<p><strong>${dayOfWeek}, ${date}</strong> | <strong>${time}</strong></p>
                       <p><strong>הנהגה עליונה ארגון החירות והצדק</strong></p>`;
}

// ==================== ניהול שיעורים זמינים ומיוחד ====================
async function renderAdmin() {
  const lessonsRef = ref(db, 'lessons');
  const lessonsSnap = await get(lessonsRef);
  const lessonsData = lessonsSnap.exists() ? lessonsSnap.val() : {};

  const lessonsList = document.getElementById("lessonsList");
  if (!lessonsList) return;
  lessonsList.innerHTML = '';

  Object.values(lessonsData).forEach(lesson => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${lesson.name} (${lesson.status === 'open' ? 'פתוח' : 'סגור'}) - מקומות: ${lesson.capacity}</span>
      <button class="toggle-status" data-id="${lesson.id}">${lesson.status === 'open' ? 'סגור' : 'פתח'}</button>
    `;
    lessonsList.appendChild(li);
  });

  lessonsList.querySelectorAll('.toggle-status').forEach(button => {
    button.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const lessonRef = ref(db, `lessons/${id}`);
      const lessonSnap = await get(lessonRef);
      if (!lessonSnap.exists()) return;
      const lesson = lessonSnap.val();
      const newStatus = lesson.status === 'open' ? 'closed' : 'open';
      await update(lessonRef, { status: newStatus });
      renderAdmin();
    });
  });
}

async function addLesson() {
  const newLessonInput = document.getElementById("newLesson");
  const newLessonName = newLessonInput.value.trim();
  const newDate = document.getElementById("newDate").value;
  const newTime = document.getElementById("newTime").value;
  const newZoom = document.getElementById("newZoom").value.trim();

  if (!newLessonName || !newDate || !newTime) {
    alert("אנא מלא את כל השדות (שם, תאריך, שעה).");
    return;
  }

  const lessonId = 'new-' + Date.now();
  const dateTimeStr = `${newDate}T${newTime}`;
  const lessonObj = {
    id: lessonId,
    name: newLessonName,
    status: 'open',
    capacity: 5,
    isNew: true,
    dateTime: dateTimeStr,
    zoom: newZoom || ''
  };

  await set(ref(db, `lessons/${lessonId}`), lessonObj);
  alert('שיעור חדש נוסף בהצלחה!');
  newLessonInput.value = '';
  document.getElementById("newDate").value = '';
  document.getElementById("newTime").value = '';
  document.getElementById("newZoom").value = '';
  renderAdmin();
}

// ==================== עמוד מידע ====================
const infoPage = document.querySelector('.hero.info');
if (infoPage) {
  const courseCardsContainer = document.getElementById('courseCardsContainer');
  const uniqueLessonsSection = document.getElementById('uniqueLessonsSection');

  const lessonsRef = ref(db, 'lessons');
  onValue(lessonsRef, (snapshot) => {
    const lessonsData = snapshot.exists() ? snapshot.val() : {};
    const now = new Date();

    const standardLessons = Object.values(lessonsData).filter(l => !l.isNew);
    const newLessons = Object.values(lessonsData).filter(l => l.isNew && l.status === 'open' && new Date(l.dateTime) >= now);

    courseCardsContainer.innerHTML = '';
    uniqueLessonsSection.innerHTML = '';

    standardLessons.forEach(lesson => {
      const card = createCardElement(lesson);
      courseCardsContainer.appendChild(card);
    });

    if (newLessons.length > 0) {
      const uniqueHeader = document.createElement('h2');
      uniqueHeader.textContent = 'שיעורים יחודיים';
      uniqueLessonsSection.appendChild(uniqueHeader);

      const newCardsContainer = document.createElement('div');
      newCardsContainer.className = 'course-cards-container';
      newLessons.forEach(lesson => {
        const card = createCardElement(lesson);
        newCardsContainer.appendChild(card);
      });
      uniqueLessonsSection.appendChild(newCardsContainer);
    }
  });

  function createCardElement(lesson) {
    const card = document.createElement('div');
    card.className = 'course-card';
    let newTag = '';
    if (lesson.isNew && lesson.status === 'open') {
      newTag = `<div class="card-new-tag">שיעור פעיל</div>`;
    }
    card.innerHTML = `
      ${newTag}
      <div class="card-inner">
          <div class="card-front">
              <h2>${lesson.name}</h2>
              <p>${lesson.description || ''}</p>
          </div>
          <div class="card-back">
              <p>${lesson.status === 'open' ? 'הירשם עכשיו!' : 'השיעור אינו זמין כרגע'}</p>
              <a href="${lesson.zoom || '#'}" target="_blank" class="register-btn" data-status="${lesson.status}" data-lesson-id="${lesson.id}">הירשם לשיעור</a>
          </div>
      </div>
    `;
    return card;
  }
}
