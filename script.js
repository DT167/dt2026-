// ==================== רקע תלת-ממדי לעמוד הבית ====================
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

// ==================== טופס הרשמה ====================
const regForm = document.getElementById("registerForm");
if (regForm) {
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const lessonSelect = document.getElementById("lesson");

  // נתונים ראשוניים של שיעורים
  let lessonsData = JSON.parse(localStorage.getItem('lessons')) || [
    { id: 'electronics', name: 'אלקטרוניקה', description: 'בגרות 10 יחידות', status: 'closed', capacity: 5 },
    { id: 'physics', name: 'פיזיקה', description: '5 יח"ל', status: 'closed', capacity: 5 },
    { id: 'hebrew', name: 'מקצועות השפה העברית', description: 'בגרות 2 יח"ל', status: 'closed', capacity: 5 },
  ];

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
    const availableTimes = JSON.parse(localStorage.getItem("availableTimes")) || [];
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
  populateLessons();
  populateTimeSlots();

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

    const lesson = lessonsData.find(l => l.id === lessonId);
    if (!lesson || lesson.capacity <= 0) {
        alert("הרישום לשיעור זה נסגר.");
        return;
    }

    // הפחתת מקום פנוי
    lesson.capacity--;
    if (lesson.capacity <= 0) {
        lesson.status = 'closed';
    }

    let regs = JSON.parse(localStorage.getItem("registrations")) || [];
    let selectedDateTime = new Date(time);

    regs.push({ lesson: lesson.name, date, time: selectedDateTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }), name, approved: false });
    localStorage.setItem("registrations", JSON.stringify(regs));

    let availableTimes = JSON.parse(localStorage.getItem("availableTimes")) || [];
    const slotIndex = availableTimes.findIndex(s => s.dateTime === time);
    if (slotIndex !== -1) {
      availableTimes[slotIndex].reserved = true;
      localStorage.setItem("availableTimes", JSON.stringify(availableTimes));
    }
    
    // שמירת הנתונים המעודכנים של השיעורים
    localStorage.setItem("lessons", JSON.stringify(lessonsData));

    alert("נרשמת בהצלחה! ✅");
    this.reset();
    populateLessons();
    populateTimeSlots();
  });
}

// ==================== ניהול נרשמים ====================
let availableTimes = JSON.parse(localStorage.getItem("availableTimes")) || [];
let lessonsData = JSON.parse(localStorage.getItem('lessons')) || [
  { id: 'electronics', name: 'אלקטרוניקה', description: 'בגרות 10 יחידות', status: 'closed', capacity: 5 },
  { id: 'physics', name: 'פיזיקה', description: '5 יח"ל', status: 'closed', capacity: 5 },
  { id: 'hebrew', name: 'מקצועות השפה העברית', description: 'בגרות 2 יח"ל', status: 'closed', capacity: 5 },
];

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
    availableTimes.push({ dateTime: dateTimeString, reserved: false });
    localStorage.setItem("availableTimes", JSON.stringify(availableTimes));
    renderTimeSlots();
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
  availableTimes.forEach((slot, index) => {
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
      availableTimes.splice(index, 1);
      localStorage.setItem("availableTimes", JSON.stringify(availableTimes));
      renderTimeSlots();
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
      capacity: 5 // קיבולת ברירת מחדל לשיעורים חדשים
    };
    lessonsData.push(newLesson);
    localStorage.setItem("lessons", JSON.stringify(lessonsData));
    renderLessons();
    newLessonInput.value = '';
    alert('שיעור חדש נוסף בהצלחה!');
  } else {
    alert("אנא הזן שם שיעור.");
  }
}

function renderLessons() {
  const lessonsList = document.getElementById("lessonsList");
  if (!lessonsList) return;
  lessonsList.innerHTML = '';
  lessonsData.forEach(lesson => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${lesson.name} (${lesson.status === 'open' ? 'פתוח' : 'סגור'}) - מקומות: ${lesson.capacity}</span>
      <button class="toggle-status" data-id="${lesson.id}">${lesson.status === 'open' ? 'סגור' : 'פתח'}</button>
    `;
    lessonsList.appendChild(li);
  });
  
  lessonsList.querySelectorAll('.toggle-status').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const lesson = lessonsData.find(l => l.id === id);
      if (lesson) {
        if (lesson.status === 'open') {
          lesson.status = 'closed';
        } else {
          lesson.status = 'open';
        }
        localStorage.setItem("lessons", JSON.stringify(lessonsData));
        renderLessons();
      }
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
    loadRegs();
    renderTimeSlots();
    renderLessons(); 
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

function loadRegs() {
  let regs = JSON.parse(localStorage.getItem("registrations")) || [];
  let table = document.getElementById("regTable");
  if (!table) return;
  table.innerHTML = `<tr><th>שם</th><th>שיעור</th><th>תאריך</th><th>שעה</th><th>סטטוס</th><th>פעולות</th></tr>`;
  regs.forEach((r, i) => {
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
    btnA.onclick = () => { r.approved = true; saveAndReload(regs); };
    cell.appendChild(btnA);
    let btnR = document.createElement("button");
    btnR.innerText = "דחה";
    btnR.classList.add("reject");
    btnR.onclick = () => {
      const registrationDateTime = new Date(`${r.date}T${r.time}`);
      const slotToFree = availableTimes.find(s => new Date(s.dateTime).getTime() === registrationDateTime.getTime());
      if (slotToFree) {
        slotToFree.reserved = false;
      }
      regs.splice(i, 1); saveAndReload(regs);
    };
    cell.appendChild(btnR);
  });
}

function saveAndReload(regs) {
  localStorage.setItem("registrations", JSON.stringify(regs));
  localStorage.setItem("availableTimes", JSON.stringify(availableTimes));
  localStorage.setItem("lessons", JSON.stringify(lessonsData)); 
  loadRegs();
  renderTimeSlots();
  renderLessons();
}

function exportCSV() {
  let regs = JSON.parse(localStorage.getItem("registrations")) || [];
  let csv = "שם,שיעור,תאריך,שעה,סטטוס\n";
  regs.forEach(r => { csv += `${r.name},${r.lesson},${r.date},${r.time},${r.approved ? "מאושר" : "ממתין"}\n`; });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "registrations.csv";
  link.click();
}

// ==================== קוד עמוד מידע (info.html) ====================
const infoPage = document.querySelector('.hero.info');
if (infoPage) {
    const courseCardsContainer = document.getElementById('courseCardsContainer');
    const uniqueLessonsSection = document.getElementById('uniqueLessonsSection');
    const lessonsData = JSON.parse(localStorage.getItem('lessons')) || [
        { id: 'electronics', name: 'אלקטרוניקה', description: 'בגרות 10 יחידות', status: 'closed', capacity: 5 },
        { id: 'physics', name: 'פיזיקה', description: '5 יח"ל', status: 'closed', capacity: 5 },
        { id: 'hebrew', name: 'מקצועות השפה העברית', description: 'בגרות 2 יח"ל', status: 'closed', capacity: 5 },
    ];
    
    function renderLessonCards() {
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

    renderLessonCards();
}
