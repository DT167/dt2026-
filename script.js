// === הגדרות כלליות ===
// כתובת ה-Web App לאחר פרסום ה-Apps Script (ראה README)
const FORM_ENDPOINT = "YOUR_DEPLOYED_WEB_APP_URL"; // לדוגמה: https://script.google.com/macros/s/AKfycbx.../exec

// טווח שעות אפשרי (ניתן להתאים): 09:00–17:00 בהפרשים של 30 דק׳
const SLOT_START = 9; // 9:00
const SLOT_END = 17; // 17:00
const SLOT_STEP_MIN = 30;

// ימי השבוע
