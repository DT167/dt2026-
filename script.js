// ==================== אנימציית רקע עמוד הבית ====================
const hero = document.getElementById("hero");
if(hero && hero.classList.contains("index")){
  document.addEventListener("mousemove", e => {
    let x=(e.clientX/window.innerWidth-0.5)*20;
    let y=(e.clientY/window.innerHeight-0.5)*20;
    hero.style.backgroundPosition=`${50+x}% ${50+y}%`;
  });
}

// ==================== טופס הרשמה ====================
const regForm = document.getElementById("registerForm");
if(regForm){
  regForm.addEventListener("submit", function(e){
    e.preventDefault();
    let lesson=document.getElementById("lesson").value;
    let date=document.getElementById("date").value;
    let time=document.getElementById("time").value;
    let name=document.getElementById("name").value;
    let email=document.getElementById("email").value;
    let regs=JSON.parse(localStorage.getItem("registrations"))||[];
    regs.push({lesson,date,time,name,email,approved:false});
    localStorage.setItem("registrations", JSON.stringify(regs));
    alert("נרשמת בהצלחה! ✅");
    this.reset();
  });
}

// ==================== ניהול נרשמים ====================
function checkPass(){
  if(document.getElementById("pass").value==="025429"){
    document.getElementById("loginArea").style.display="none";
    document.getElementById("adminArea").style.display="block";
    loadRegs();
  } else { alert("סיסמה שגויה ❌"); }
}

function loadRegs(){
  let regs=JSON.parse(localStorage.getItem("registrations"))||[];
  let table=document.getElementById("regTable");
  if(!table) return;
  table.innerHTML=`<tr><th>שם</th><th>אימייל</th><th>שיעור</th><th>תאריך</th><th>שעה</th><th>סטטוס</th><th>פעולות</th></tr>`;
  regs.forEach((r,i)=>{
    let row=table.insertRow();
    row.insertCell(0).innerText=r.name;
    row.insertCell(1).innerText=r.email;
    row.insertCell(2).innerText=r.lesson;
    row.insertCell(3).innerText=r.date;
    row.insertCell(4).innerText=r.time;
    row.insertCell(5).innerText=r.approved?"מאושר":"ממתין";
    let cell=row.insertCell(6);
    let btnA=document.createElement("button"); 
    btnA.innerText="אשר"; 
    btnA.classList.add("approve"); 
    btnA.onclick=()=>
