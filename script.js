// ==================== רקע תלת-ממדי לעמוד הבית ====================
// ==================== Firebase Configuration ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, push, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const database = getDatabase(app);

// References to your database collections
const lessonsRef = ref(database, 'lessons');
const registrationsRef = ref(database, 'registrations');
const availableTimesRef = ref(database, 'availableTimes');

// ==================== Background, Hamburger, etc. (No change) ====================
// ... (The existing code for the background animation, hamburger menu, etc., remains here)
const canvas = document.getElementById("bgCanvas");
if (canvas && document.body.classList.contains("index")) {
  const ctx = canvas.getContext("2d");
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 150; 

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.z = Math.random() * width;
      this.size = Math.random() * 3 + 1;
      this.speed = Math.random() * 0.05 + 0.02;
      this.color = `hsl(${Math.random() * 360}, 100%, 70%)`; 
    }
    update() {
      this.z -= this.speed * width;
      if (this.z <= 0) this.reset();
    }
    draw() {
      const scale = 500 / (500 + this.z);
      const x = (this.x - width / 2) * scale + width / 2;
      const y = (this.y - height / 2) * scale + height / 2;
      ctx.beginPath();
      ctx.arc(x, y, this.size * scale, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(0,0,30,0.3)");
    gradient.addColorStop(0.5, "rgba(10,10,50,0.3)");
    gradient.addColorStop(1, "rgba(0,0,30,0.3)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => { p.update(); p.draw(); });

    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
}

// ==================== אפקט רקע קליני עם תזוזת עכבר ====================
const hero = document.getElementById("hero");
if (hero && hero.classList.contains("index")) {
  document.addEventListener("mousemove", e => {
    let x = (e.clientX / window.innerWidth - 0.5) * 20;
    let y = (e.clientY / window.innerHeight - 0.5) * 20;
    hero.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
  });
}

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


// ==================== Registration Form (register.html) ====================
const regForm = document.getElementById("registerForm");
if (regForm) {
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const lessonSelect = document.getElementById("lesson");

  // Read data from Firebase
  onValue(lessonsRef, (snapshot) => {
    lessonsData = snapshot.val() ? Object.values(snapshot.val()) : [];
    populateLessons();
  });
  
  onValue(availableTimesRef, (snapshot) => {
    availableTimes = snapshot.val() ? Object.values(snapshot.val()) : [];
    populateTimeSlots();
  });

  function populateLessons() {
    lessonSelect.innerHTML = '<option value="">-- בחר שיעור --</option>';
    const availableLessons = lessonsData.filter(l => l.status === 'open' && l.capacity > 0);
    availableLessons.forEach(lesson => {
      const option = document.createElement("option");
      option.value = lesson.id;
      option.textContent = `${lesson.name} (${lesson.capacity} מקומות פנויים)`;
      lessonSelect.appendChild(option);
    });
  }

  function populateTimeSlots() {
    const selectedDate = dateInput.value;
    timeSelect.innerHTML = '<option value="">-- בחר שעה --</option>';
    const filteredSlots = availableTimes.filter(slot => {
      const slotDate = new Date(slot.dateTime).toISOString().split('T')[0];
      return slotDate === selectedDate && !slot.reserved;
    });
    filteredSlots.forEach(slot => {
      const option = document.createElement("option");
      const time = new Date(slot.dateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      option.value = slot.dateTime;
      option.textContent = time;
      timeSelect.appendChild(option);
    });
  }

  dateInput.addEventListener('change', populateTimeSlots);

  regForm.addEventListener("submit", function (e) {
    e.preventDefault();
    let lessonId = document.getElementById("lesson").value;
    let date = dateInput.value;
    let time = timeSelect.value;
    let name = document.getElementById("name").value;

    if (!lessonId || !date || !time || !name) {
      alert("אנא מלא את כל השדות.");
      return;
    }

    const lessonIndex = lessonsData.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1 || lessonsData[lessonIndex].capacity <= 0) {
        alert("הרישום לשיעור זה נסגר.");
        return;
    }

    // Update Firebase with new registration
    push(registrationsRef, { 
      lesson: lessonsData[lessonIndex].name, 
      date, 
      time: new Date(time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }), 
      name, 
      approved: false 
    });

    // Update Firebase with reduced capacity
    lessonsData[lessonIndex].capacity--;
    if (lessonsData[lessonIndex].capacity <= 0) {
      lessonsData[lessonIndex].status = 'closed';
    }
    set(lessonsRef, lessonsData);

    const slotIndex = availableTimes.findIndex(s => s.dateTime === time);
    if (slotIndex !== -1) {
      availableTimes[slotIndex].reserved = true;
      set(availableTimesRef, availableTimes);
    }

    alert("נרשמת בהצלחה! ✅");
    this.reset();
  });
}

// ==================== Admin Page (admin.html) ====================
let lessonsData = []; // This will be populated by Firebase
let availableTimes = []; // This will be populated by Firebase
let registrationsData = {}; // This will hold the key-value pair of registrations

const passInput = document.getElementById("pass");
if (passInput) {
  passInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      checkPass();
    }
  });
}

function addTimeSlot() {
  const newDate = document.getElementById("newDate").value;
  const newTime = document.getElementById("newTime").value;
  if (newDate && newTime) {
    const dateTimeString = `${newDate}T${newTime}`;
    // Push new time slot to Firebase
    push(availableTimesRef, { dateTime: dateTimeString, reserved: false });
    document.getElementById("newDate").value = '';
    document.getElementById("newTime").value = '';
  } else {
    alert("יש לבחור תאריך ושעה.");
  }
}

function renderTimeSlots() {
  const timesList = document.getElementById("timesList");
  if (!timesList) return;
  timesList.innerHTML = '';
  // Use Object.entries to get key-value pairs
  Object.entries(availableTimes).forEach(([key, slot]) => {
    const li = document.createElement("li");
    const date = new Date(slot.dateTime).toLocaleDateString('he-IL');
    const time = new Date(slot.dateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    li.textContent = `${date} בשעה ${time}`;
    if (slot.reserved) {
      li.style.textDecoration = "line-through";
      li.textContent += " (תפוס)";
    }
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "מחק";
    deleteBtn.onclick = () => {
      // Remove from Firebase using key
      remove(ref(database, `availableTimes/${key}`));
    };
    li.appendChild(deleteBtn);
    timesList.appendChild(li);
  });
}

function addLesson() {
  const newLessonInput = document.getElementById("newLesson");
  const newLessonName = newLessonInput.value.trim();
  if (newLessonName) {
    const newLesson = {
      id: 'new-' + Date.now(),
      name: newLessonName,
      description: 'שיעור חדש פתוח לרישום',
      status: 'open',
      isNew: true,
      capacity: 5
    };
    // Push new lesson to Firebase
    push(lessonsRef, newLesson);
    newLessonInput.value = '';
    alert('שיעור חדש נוסף בהצלחה! ✅');
  } else {
    alert("אנא הזן שם שיעור.");
  }
}

function renderLessons() {
  const lessonsList = document.getElementById("lessonsList");
  if (!lessonsList) return;
  lessonsList.innerHTML = '';
  Object.entries(lessonsData).forEach(([key, lesson]) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${lesson.name} (${lesson.status === 'open' ? 'פתוח' : 'סגור'}) - מקומות: ${lesson.capacity}</span>
      <button class="toggle-status" data-key="${key}" data-status="${lesson.status}">${lesson.status === 'open' ? 'סגור' : 'פתח'}</button>
    `;
    lessonsList.appendChild(li);
  });
  
  lessonsList.querySelectorAll('.toggle-status').forEach(button => {
    button.addEventListener('click', (e) => {
      const key = e.target.dataset.key;
      const currentStatus = e.target.dataset.status;
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      // Update lesson status in Firebase
      update(ref(database, `lessons/${key}`), { status: newStatus });
    });
  });
}

function displayAdminHeaderInfo() {
  const infoDiv = document.getElementById('adminHeaderInfo');
  const now = new Date();
  const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayOfWeek = daysOfWeek[now.getDay()];
  const date = now.toLocaleDateString('he-IL');
  const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  infoDiv.innerHTML = `
    <p><strong>${dayOfWeek}, ${date}</strong> | <strong>${time}</strong></p>
    <p><strong>הנהגה עליונה ארגון החירות והצדק</strong></p>
  `;
}

function checkPass() {
  if (document.getElementById("pass").value === "025429") {
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("adminArea").style.display = "block";
    displayAdminHeaderInfo();
    // Listen for data changes from Firebase
    onValue(registrationsRef, (snapshot) => {
      registrationsData = snapshot.val() || {};
      loadRegs(registrationsData);
    });
    onValue(availableTimesRef, (snapshot) => {
      availableTimes = snapshot.val() || {};
      renderTimeSlots();
    });
    onValue(lessonsRef, (snapshot) => {
      lessonsData = snapshot.val() || {};
      renderLessons();
    });
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

function loadRegs(regs) {
  let table = document.getElementById("regTable");
  if (!table) return;
  table.innerHTML = `<tr><th>שם</th><th>שיעור</th><th>תאריך</th><th>שעה</th><th>סטטוס</th><th>פעולות</th></tr>`;
  Object.entries(regs).forEach(([key, r]) => {
    let row = table.insertRow();
    row.insertCell(0).innerText = r.name;
    row.insertCell(1).innerText = r.lesson;
    row.insertCell(2).innerText = r.date;
    row.insertCell(3).innerText = r.time;
    row.insertCell(4).innerText = r.approved ? "מאושר" : "ממתין";
    let cell = row.insertCell(5);
    let btnA = document.createElement("button");
    btnA.innerText = "אשר";
    btnA.classList.add("approve");
    btnA.onclick = () => { 
        // Update approved status in Firebase
        update(ref(database, `registrations/${key}`), { approved: true });
    };
    cell.appendChild(btnA);
    let btnR = document.createElement("button");
    btnR.innerText = "דחה";
    btnR.classList.add("reject");
    btnR.onclick = () => {
        // Remove registration from Firebase
        remove(ref(database, `registrations/${key}`));
    };
    cell.appendChild(btnR);
  });
}

function exportCSV() {
  // Use the local copy of data to export
  const regs = Object.values(registrationsData);
  let csv = "שם,שיעור,תאריך,שעה,סטטוס\n";
  regs.forEach(r => { csv += `${r.name},${r.lesson},${r.date},${r.time},${r.approved ? "מאושר" : "ממתין"}\n`; });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "registrations.csv";
  link.click();
}

// ==================== Info Page (info.html) ====================
const infoPage = document.querySelector('.hero.info');
if (infoPage) {
    const courseCardsContainer = document.getElementById('courseCardsContainer');
    const uniqueLessonsSection = document.getElementById('uniqueLessonsSection');
    
    // Listen for data changes from Firebase
    onValue(lessonsRef, (snapshot) => {
        const lessonsData = snapshot.val() ? Object.values(snapshot.val()) : [];
        renderLessonCards(lessonsData);
    });

    function renderLessonCards(lessonsData) {
        const standardLessons = lessonsData.filter(l => !l.isNew);
        const newLessons = lessonsData.filter(l => l.isNew && l.status === 'open');

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
    }
    
    function createCardElement(lesson) {
      const card = document.createElement('div');
      card.className = 'course-card';

      let newTag = '';
      if (lesson.isNew) {
          newTag = `<div class="card-new-tag">שיעור חדש פתוח לרישום</div>`;
      }

      card.innerHTML = `
          ${newTag}
          <div class="card-inner">
              <div class="card-front">
                  <h2>${lesson.name}</h2>
                  <p>${lesson.description}</p>
              </div>
              <div class="card-back">
                  <p>${lesson.status === 'open' ? 'הירשם עכשיו!' : 'השיעור אינו זמין כרגע'}</p>
                  <a href="#" class="register-btn" data-status="${lesson.status}" data-lesson-id="${lesson.id}">הירשם לשיעור</a>
              </div>
          </div>
      `;
      return card;
    }

    courseCardsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.register-btn');
        if (btn) {
            e.preventDefault();
            const status = btn.dataset.status;
            if (status === 'closed') {
                alert('השיעור אינו זמין כרגע.');
            } else {
                window.location.href = 'register.html';
            }
        }
    });
    
    uniqueLessonsSection.addEventListener('click', (e) => {
        const btn = e.target.closest('.register-btn');
        if (btn) {
            e.preventDefault();
            const status = btn.dataset.status;
            if (status === 'closed') {
                alert('השיעור אינו זמין כרגע.');
            } else {
                window.location.href = 'register.html';
            }
        }
    });
}

     
