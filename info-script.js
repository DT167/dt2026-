// info-script.js
import { getDatabase, ref, onValue, set, push, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase-config.js";

const db = getDatabase(app);

const courseCardsContainer = document.getElementById('courseCardsContainer');
const uniqueLessonsSection = document.getElementById('uniqueLessonsSection');

// פונקציית עזר ליצירת כרטיס שיעור
function createCardElement(lesson, status, lessonId) {
    const card = document.createElement('div');
    card.className = 'course-card';
    let statusText = 'השיעור אינו זמין כרגע';
    if (status === 'active') {
        statusText = 'שיעור פעיל';
    } else if (lesson.type === 'unique') {
        statusText = 'שיעור חדש פתוח לרישום';
    }
    
    const zoomLinkHTML = (status === 'active' && lesson.zoomLink) ? `<p><strong>קישור לשיעור:</strong> <a href="${lesson.zoomLink}" target="_blank">התחבר עכשיו</a></p>` : '';
    const dateAndTimeHTML = (status === 'active') ? `<p><strong>תאריך:</strong> ${lesson.date}</p><p><strong>שעה:</strong> ${lesson.time}</p>` : '';
    
    const registerLink = (status === 'active') ? `register.html?lessonId=${lessonId}` : `register.html`;
    const registerBtnHTML = `<a href="${registerLink}" class="register-btn" ${status !== 'active' ? 'style="display:none;"' : ''}>הירשם לשיעור</a>`;

    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <h2>${lesson.name}</h2>
                <p>${lesson.description || ''}</p>
            </div>
            <div class="card-back">
                <p>${statusText}</p>
                ${dateAndTimeHTML}
                ${zoomLinkHTML}
                ${registerBtnHTML}
            </div>
        </div>
    `;
    return card;
}

// בדיקה ויצירה של שיעורים בסיסיים אם הם לא קיימים
const baseLessonsRef = ref(db, 'lessons/base');
get(baseLessonsRef).then(snapshot => {
    const existingLessons = snapshot.val() || {};
    const lessonsToCreate = [
        { name: "אלקטרוניקה - 10 יח\"ל", description: "השיעור מכסה את היסודות והתאוריה של האלקטרוניקה. השיעור מותאם לתלמידי תיכון." },
        { name: "ידיעת השפה העברית - 2 יח\"ל", description: "השיעור מכסה נושאים של תחביר, מורפולוגיה, וכתיבה. מותאם לתלמידי תיכון." }
    ];

    lessonsToCreate.forEach(lesson => {
        const lessonExists = Object.values(existingLessons).some(l => l.name === lesson.name);
        if (!lessonExists) {
            push(baseLessonsRef, lesson);
        }
    });
});

// מאזינים לשיעורים בסיסיים
onValue(ref(db, 'lessons/base'), (baseSnapshot) => {
    courseCardsContainer.innerHTML = '';
    onValue(ref(db, 'lessons/active'), (activeSnapshot) => {
        const activeLessonsMap = new Map();
        activeSnapshot.forEach(activeChild => {
            const lesson = activeChild.val();
            if (lesson.type === 'base') {
                activeLessonsMap.set(lesson.baseLessonId, lesson);
            }
        });

        baseSnapshot.forEach(baseChild => {
            const lesson = baseChild.val();
            const lessonId = baseChild.key;
            const activeLesson = activeLessonsMap.get(lessonId);
            
            let status = 'closed';
            let activeLessonId = null;
            if (activeLesson) {
                status = 'active';
                activeLessonId = activeLesson.key;
                lesson.zoomLink = activeLesson.zoomLink;
                lesson.date = activeLesson.date;
                lesson.time = activeLesson.time;
            }

            const card = createCardElement(lesson, status, activeLessonId);
            courseCardsContainer.appendChild(card);
        });
    }, { onlyOnce: false }); // נשאר כ-false כדי להתעדכן בשינויים

    // הצגת שיעורים ייחודיים
    onValue(ref(db, 'lessons/active'), (snapshot) => {
        uniqueLessonsSection.innerHTML = '';
        const uniqueLessons = [];
        snapshot.forEach((childSnapshot) => {
            const lesson = childSnapshot.val();
            if (lesson.type === 'unique') {
                uniqueLessons.push({ ...lesson, key: childSnapshot.key });
            }
        });

        if (uniqueLessons.length > 0) {
            const uniqueHeader = document.createElement('h2');
            uniqueHeader.textContent = 'שיעורים יחודיים';
            uniqueLessonsSection.appendChild(uniqueHeader);
            const uniqueCardsContainer = document.createElement('div');
            uniqueCardsContainer.className = 'course-cards-container';
            uniqueLessons.forEach(lesson => {
                const card = createCardElement(lesson, 'active', lesson.key);
                uniqueCardsContainer.appendChild(card);
            });
            uniqueLessonsSection.appendChild(uniqueCardsContainer);
        }
    }, { onlyOnce: false });
});

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
