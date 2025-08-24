// ==================== רקע שמיים (פרלקס) לעמוד הבית ====================
// שימו לב: הקוד הזה מזיז את תמונת הרקע של אלמנט ה-hero 
// כדי ליצור אשליית עומק (פרלקס) בעת הזזת העכבר.
const hero = document.getElementById("hero");
if (hero && hero.classList.contains("index")) {
  document.addEventListener("mousemove", e => {
    // מודד את מיקום העכבר בין 0 ל-1, וממיר לטווח שלילי-חיובי (-0.5 עד 0.5)
    let mouseX = (e.clientX / window.innerWidth) - 0.5;
    let mouseY = (e.clientY / window.innerHeight) - 0.5;

    // מגדיר את מידת התזוזה של הרקע (כאן 5% מכל צד)
    // המיקום ההתחלתי הוא 50%, והוא משתנה ב-mouseX/Y כפול גורם תנועה (5)
    let bgPosX = (50 + mouseX * 5) + '%';
    let bgPosY = (50 + mouseY * 5) + '%';

    // מעדכן את מיקום הרקע ליצירת אפקט התזוזה
    hero.style.backgroundPosition = `${bgPosX} ${bgPosY}`;
  });
}

// קוד ה-canvas הקודם של החלקיקים כבר לא נחוץ
const canvas = document.getElementById("bgCanvas");
if (canvas) {
    // מונע מהקנבס (ששימש לחלקיקים) להציג דברים ומבטל את קוד ה-JS שלו אם קיים
    canvas.style.display = 'none'; 
}


// ==================== תפריט המבורגר (לכל העמודים מלבד הבית) ====================
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

  function populateLessons() {
    const lessonSelect = document.getElementById("lesson");
    const availableLessons = JSON.parse(localStorage.getItem("availableLessons")) || [];
    lessonSelect.innerHTML = '<option value="">-- בחר שיעור --</option>';
    availableLessons.forEach(lesson => {
      const option = document.createElement("option");
      option.value = lesson;
      option.textContent = lesson;
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
    let lesson = document.getElementById("lesson").value;
    let date = dateInput.value;
    let time = timeSelect.value;
    let name = document.getElementById("name").value;

    if (!lesson || !date || !time || !name) {
      alert("אנא מלא את כל השדות.");
      return;
    }

    let regs = JSON.parse(localStorage.getItem("registrations")) || [];
    let selectedDateTime = new Date(time);

    regs.push({ lesson, date, time: selectedDateTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }), name, approved: false });
    localStorage.setItem("registrations", JSON.stringify(regs));

    let availableTimes = JSON.parse(localStorage.getItem("availableTimes")) || [];
    const slotIndex = availableTimes.findIndex(s => s.dateTime === time);
    if (slotIndex !== -1) {
      availableTimes[slotIndex].reserved = true;
      localStorage.setItem("availableTimes", JSON.stringify(availableTimes));
    }

    alert("נרשמת בהצלחה! ✅");
    this.reset();
    populateTimeSlots();
  });
}

// ==================== ניהול נרשמים ====================
let availableTimes = JSON.parse(localStorage.getItem("availableTimes")) || [];
let availableLessons = JSON.parse(localStorage.getItem("availableLessons")) || [];

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
  const newLesson = newLessonInput.value.trim();
  if (newLesson) {
    availableLessons.push(newLesson);
    localStorage.setItem("availableLessons", JSON.stringify(availableLessons));
    renderLessons();
    newLessonInput.value = '';
  } else {
    alert("אנא הזן שם שיעור.");
  }
}

function renderLessons() {
  const lessonsList = document.getElementById("lessonsList");
  if (!lessonsList) return;
  lessonsList.innerHTML = '';
  availableLessons.forEach((lesson, index) => {
    const li = document.createElement("li");
    li.textContent = lesson;
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "מחק";
    deleteBtn.onclick = () => {
      availableLessons.splice(index, 1);
      localStorage.setItem("availableLessons", JSON.stringify(availableLessons));
      renderLessons();
    };
    li.appendChild(deleteBtn);
    lessonsList.appendChild(li);
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
  localStorage.setItem("availableLessons", JSON.stringify(availableLessons));
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
