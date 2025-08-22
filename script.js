/*-----------------------------------
  תפריט צדדי / המבורגר
-----------------------------------*/
function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
}

/*-----------------------------------
  רשומות וזמינות
-----------------------------------*/
let registrations = JSON.parse(localStorage.getItem("registrations") || "[]");
let availability = JSON.parse(localStorage.getItem("availability") || "{}");

// פונקציה שממלאת תאריכים ושעות בדף הרישום
function loadAvailableDates() {
  const dateSelect = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  if(!dateSelect || !timeSelect) return;

  dateSelect.innerHTML = "<option value='' disabled selected>בחר תאריך…</option>";
  Object.keys(availability).sort().forEach(date => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = date;
    dateSelect.appendChild(opt);
  });

  dateSelect.onchange = () => {
    const selectedDate = dateSelect.value;
    timeSelect.innerHTML = "<option value='' disabled selected>בחר שעה…</option>";
    if(selectedDate && availability[selectedDate]) {
      availability[selectedDate].forEach(time => {
        // בדיקה אם הזמן כבר תפוס
        const taken = registrations.some(r => r.date===selectedDate && r.time===time);
        if(!taken){
          const opt = document.createElement("option");
          opt.value = time;
          opt.textContent = time;
          timeSelect.appendChild(opt);
        }
      });
    }
  };
}

/*-----------------------------------
  טיפול בטופס רישום
-----------------------------------*/
const regForm = document.getElementById("registration-form");
if(regForm){
  loadAvailableDates();

  regForm.addEventListener("submit", e=>{
    e.preventDefault();
    const fullName = regForm.fullName.value.trim();
    const date = regForm.date.value;
    const time = regForm.time.value;

    // בדיקת כפילות
    const duplicate = registrations.some(r=>r.date===date && r.time===time);
    if(duplicate){
      document.getElementById("status").textContent = "המועד כבר תפוס!";
      return;
    }

    registrations.push({fullName, date, time, status:"ממתין"});
    localStorage.setItem("registrations", JSON.stringify(registrations));
    document.getElementById("status").textContent = "הרשמת בהצלחה!";
    regForm.reset();
    loadAvailableDates();
  });
}

/*-----------------------------------
  דף מנהל
-----------------------------------*/
const adminPassword = "025429";
const loginBtn = document.getElementById("loginBtn");
const adminPanel = document.getElementById("adminPanel");

if(loginBtn){
  loginBtn.addEventListener("click", ()=>{
    const pwd = document.getElementById("adminPassword").value;
    if(pwd === adminPassword){
      adminPanel.style.display = "block";
      loadAdminRegistrations();
      loadAdminAvailability();
    } else {
      alert("סיסמה שגויה!");
    }
  });
}

function loadAdminRegistrations(){
  const tbody = document.querySelector("#registrationsTable tbody");
  if(!tbody) return;
  tbody.innerHTML = "";
  registrations.forEach((r,index)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.fullName}</td><td>${r.date}</td><td>${r.time}</td><td>${r.status}</td>
      <td>
        <button onclick="approveRegistration(${index})">אשר</button>
        <button onclick="deleteRegistration(${index})">מחק</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function approveRegistration(i){
  registrations[i].status = "מאושר";
  saveRegistrations();
  loadAdminRegistrations();
}
function deleteRegistration(i){
  registrations.splice(i,1);
  saveRegistrations();
  loadAdminRegistrations();
}
function saveRegistrations(){
  localStorage.setItem("registrations", JSON.stringify(registrations));
}

// ניהול זמינות
function loadAdminAvailability(){
  const list = document.getElementById("availabilityList");
  if(!list) return;
  list.innerHTML = "";
  Object.keys(availability).sort().forEach(date=>{
    availability[date].forEach((time,idx)=>{
      const li = document.createElement("li");
      li.textContent = `${date} - ${time} `;
      const delBtn = document.createElement("button");
      delBtn.textContent = "מחק";
      delBtn.onclick = ()=>{
        availability[date].splice(idx,1);
        if(availability[date].length===0) delete availability[date];
        saveAvailability();
        loadAdminAvailability();
      };
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  });
}

const addBtn = document.getElementById("addAvailability");
if(addBtn){
  addBtn.addEventListener("click", ()=>{
    const date = document.getElementById("newDate").value;
    const time = document.getElementById("newTime").value;
    if(!date || !time){ alert("בחר תאריך ושעה"); return; }
    if(!availability[date]) availability[date] = [];
    if(!availability[date].includes(time)) availability[date].push(time);
    saveAvailability();
    loadAdminAvailability();
  });
}

function saveAvailability(){
  localStorage.setItem("availability", JSON.stringify(availability));
}

// ייצוא CSV
function exportCSV(){
  if(registrations.length===0){ alert("אין הרשמות לייצוא"); return; }
  let csv = "שם מלא,תאריך,שעה,סטטוס\n";
  registrations.forEach(r=>{
    csv += `${r.fullName},${r.date},${r.time},${r.status}\n`;
  });
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
}

