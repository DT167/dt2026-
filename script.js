// Toggle sidebar menu
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if(sidebar) sidebar.classList.toggle('active');
  if(overlay) overlay.classList.toggle('active');
}

// --------------------
// Register Page Code
// --------------------
if(document.getElementById("registration-form")) {
  let availability = JSON.parse(localStorage.getItem("availability") || "{}");

  const dateSelect = document.getElementById("dateSelect");
  const timeSelect = document.getElementById("timeSelect");

  // Populate date
  Object.keys(availability).forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    dateSelect.appendChild(option);
  });

  dateSelect.addEventListener("change", () => {
    timeSelect.innerHTML = '<option value="" disabled selected>בחר שעה…</option>';
    const selectedDate = dateSelect.value;
    (availability[selectedDate] || []).forEach(time => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      timeSelect.appendChild(option);
    });
  });

  let registrations = JSON.parse(localStorage.getItem("registrations") || "[]");

  document.getElementById("registration-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fullName = e.target.fullName.value.trim();
    const date = e.target.date.value;
    const time = e.target.time.value;

    const exists = registrations.some(r => r.date===date && r.time===time);
    const statusEl = document.getElementById("status");
    if(exists) {
      statusEl.textContent = "המועד הזה כבר נרשם, בחרו מועד אחר.";
      return;
    }

    registrations.push({fullName, date, time, status:"ממתין"});
    localStorage.setItem("registrations", JSON.stringify(registrations));
    statusEl.textContent = "הרישום נשמר בהצלחה!";
    e.target.reset();
    timeSelect.innerHTML = '<option value="" disabled selected>בחר שעה…</option>';
  });
}

// --------------------
// Admin Page Code
// --------------------
if(document.getElementById("loginBtn")) {
  const correctPassword = "AD025429"; // שנה לפי הצורך
  const loginBtn = document.getElementById("loginBtn");
  const adminPanel = document.getElementById("adminPanel");

  loginBtn.addEventListener("click", () => {
    const pwd = document.getElementById("adminPassword").value;
    if(pwd === correctPassword) {
      adminPanel.style.display = "block";
      loadRegistrations();
      loadAvailability();
    } else {
      alert("סיסמה שגויה!");
    }
  });

  let registrations = JSON.parse(localStorage.getItem("registrations") || "[]");
  let availability = JSON.parse(localStorage.getItem("availability") || "{}");

  function loadRegistrations() {
    const tbody = document.querySelector("#registrationsTable tbody");
    tbody.innerHTML = "";
    registrations.forEach((r,index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.fullName}</td>
                      <td>${r.date}</td>
                      <td>${r.time}</td>
                      <td>${r.status}</td>
                      <td>
                        <button onclick="approveRegistration(${index})">אשר</button>
                        <button onclick="deleteRegistration(${index})">מחק</button>
                      </td>`;
      tbody.appendChild(tr);
    });
  }

  window.approveRegistration = function(index){
    registrations[index].status = "מאושר";
    localStorage.setItem("registrations", JSON.stringify(registrations));
    loadRegistrations();
  }

  window.deleteRegistration = function(index){
    if(confirm("בטוח שברצונך למחוק רשומה זו?")){
      registrations.splice(index,1);
      localStorage.setItem("registrations", JSON.stringify(registrations));
      loadRegistrations();
    }
  }

  document.getElementById("exportBtn").addEventListener("click", () => {
    if(!registrations.length) { alert("אין רשומות לייצוא"); return; }
    const headers = ["שם מלא","תאריך","שעה","סטטוס"];
    const csvContent = [
      headers.join(","),
      ...registrations.map(r => [r.fullName,r.date,r.time,r.status].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "registrations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // --------------------
  // Availability management
  // --------------------
  const availabilityList = document.getElementById("availabilityList");
  const addBtn = document.getElementById("addAvailabilityBtn");

  function loadAvailability(){
    availabilityList.innerHTML="";
    Object.keys(availability).forEach(date=>{
      availability[date].forEach(time=>{
        const li = document.createElement("li");
        li.textContent = `${date} - ${time} `;
        const delBtn = document.createElement("button");
        delBtn.textContent="מחק";
        delBtn.onclick = () => {
          deleteAvailability(date,time);
        };
        li.appendChild(delBtn);
        availabilityList.appendChild(li);
      });
    });
    localStorage.setItem("availability", JSON.stringify(availability));
  }

  function deleteAvailability(date,time){
    availability[date] = availability[date].filter(t=>t!==time);
    if(availability[date].length===0) delete availability[date];
    loadAvailability();
  }

  addBtn.addEventListener("click",()=>{
    const date = document.getElementById("newDate").value;
    const time = document.getElementById("newTime").value;
    if(!date || !time){ alert("בחר תאריך ושעה"); return;}
    if(!availability[date]) availability[date]=[];
    if(availability[date].includes(time)){ alert("המועד כבר קיים"); return;}
    availability[date].push(time);
    document.getElementById("newDate").value="";
    document.getElementById("newTime").value="";
    loadAvailability();
  });
}

