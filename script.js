// === הגדרות כלליות ===
// כתובת ה-Web App לאחר פרסום ה-Apps Script (ראה README)
const FORM_ENDPOINT = "YOUR_DEPLOYED_WEB_APP_URL"; // לדוגמה: https://script.google.com/macros/s/AKfycbx.../exec

// טווח שעות אפשרי (ניתן להתאים): 09:00–17:00 בהפרשים של 30 דק׳
const SLOT_START = 9;   // 9:00
const SLOT_END   = 17;  // 17:00
const SLOT_STEP_MIN = 30;

// ימי השבוע שמותרים לרישום (0=ראשון ... 6=שבת). לדוגמה: א׳–ה׳ בלבד
const ALLOWED_WEEKDAYS = [0,1,2,3,4];

// תאריך מינימלי לרישום – מחר (אפשר לשנות ל-0 כדי לאפשר מהיום)
const MIN_START_OFFSET_DAYS = 1;

// === עזרי תצוגה ===
function pad(n){return String(n).padStart(2,'0');}
function toISODate(d){return d.toISOString().slice(0,10);}

function buildTimeSlots(){
  const slots = [];
  for(let h=SLOT_START; h<=SLOT_END; h++){
    for(let m=0; m<60; m+=SLOT_STEP_MIN){
      const label = `${pad(h)}:${pad(m)}`;
      slots.push(label);
    }
  }
  return slots;
}

function isAllowedWeekday(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  const wd = d.getDay(); // 0=Sunday
  return ALLOWED_WEEKDAYS.includes(wd);
}

// === שליפת זמינות מהשרת ===
async function fetchTakenTimes(dateStr){
  if(!FORM_ENDPOINT) return [];
  const url = new URL(FORM_ENDPOINT);
  url.searchParams.set('date', dateStr);
  const res = await fetch(url, { method:'GET' });
  if(!res.ok){
    console.warn('fetchTakenTimes failed', res.status);
    return [];
  }
  const data = await res.json();
  return Array.isArray(data.taken) ? data.taken : [];
}

// === מילוי רשימת השעות ו"ביטול" תפוסות ===
async function populateTimeSelect(dateStr){
  const select = document.getElementById('timeSelect');
  select.innerHTML = '<option value="" disabled selected>בחר שעה…</option>';
  const slots = buildTimeSlots();
  const taken = await fetchTakenTimes(dateStr);
  const takenSet = new Set(taken);
  slots.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    if(takenSet.has(t)){
      opt.disabled = true; opt.textContent = `${t} (תפוס)`;
    }
    select.appendChild(opt);
  });
}

// === אתחול טופס ===
function initForm(){
  const form = document.getElementById('registration-form');
  if(!form) return;
  const datePicker = document.getElementById('datePicker');
  const statusEl = document.getElementById('status');
  const resetBtn = document.getElementById('resetBtn');

  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + MIN_START_OFFSET_DAYS);
  datePicker.min = toISODate(minDate);

  datePicker.addEventListener('change', async (e) => {
    const value = e.target.value;
    if(!value) return;
    if(!isAllowedWeekday(value)){
      statusEl.textContent = 'לא ניתן לבחור תאריך זה. בחרו יום א׳–ה׳.';
      document.getElementById('timeSelect').innerHTML = '<option value="" disabled selected>בחר שעה…</option>';
      return;
    }
    statusEl.textContent = 'טוען זמינות…';
    await populateTimeSelect(value);
    statusEl.textContent = '';
  });

  resetBtn?.addEventListener('click', ()=>{
    statusEl.textContent = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'שולח…';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if(!payload.date){ statusEl.textContent = 'בחרו תאריך.'; return; }
    if(!isAllowedWeekday(payload.date)){ statusEl.textContent = 'בחרו יום א׳–ה׳.'; return; }
    if(!payload.time){ statusEl.textContent = 'בחרו שעה.'; return; }

    try{
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(res.ok && data.success){
        form.reset();
        document.getElementById('timeSelect').innerHTML = '<option value="" disabled selected>בחר שעה…</option>';
        statusEl.textContent = 'נרשמתם בהצלחה! התקבל אישור.';
      } else {
        statusEl.textContent = data.message || 'אירעה שגיאה בשליחה.';
      }
    }catch(err){
      console.error(err);
      statusEl.textContent = 'שגיאת רשת. נסו שוב מאוחר יותר.';
    }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initForm);
}else{
  initForm();
}
