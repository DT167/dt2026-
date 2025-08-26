// info-script.js
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase-config.js";

const db = getDatabase(app);

const courseCardsContainer = document.getElementById('courseCardsContainer');
const uniqueLessonsSection = document.getElementById('uniqueLessonsSection');

function createCardElement(lesson, status, isUnique = false) {
    const card = document.createElement('div');
    card.className = 'course-card';
    let statusText = 'השיעור אינו זמין כרגע';
    if (status === 'active') {
        statusText = 'שיעור פעיל';
    } else if (isUnique) {
        statusText = 'שיעור חדש פתוח לרישום';
    }

    const zoomLinkHTML = (status === 'active' && lesson.zoomLink) ? `<p><strong>קישור לשיעור:</strong> <a href="${lesson.zoomLink}" target="_blank">התחבר עכשיו</a></p>` : '';
    const dateAndTimeHTML = (status === 'active') ? `<p><strong>תאריך:</strong> ${lesson.date}</p><p><strong>שעה:</strong> ${lesson.time}</p>` : '';

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
                <a href="register.html" class="register-btn" data-status="${status}">הירשם לשיעור</a>
            </div>
        </div>
    `;
    const registerBtn = card.querySelector('.register-btn');
    if (status !== 'active') {
        registerBtn.style.display = 'none';
    }
    return card;
}

// טעינת שיעורים קיימים (בסיסיים)
onValue(ref(db, 'lessons/base'), (snapshot) => {
    courseCardsContainer.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
        const lesson = childSnapshot.val();
        const lessonId = childSnapshot.key;
        
        onValue(ref(db, 'lessons/active'), (activeSnapshot) => {
            let status = 'closed';
            activeSnapshot.forEach(activeChild => {
                if (activeChild.val().baseLessonId === lessonId) {
                    status = 'active';
                }
            });
            const card = createCardElement(lesson, status);
            courseCardsContainer.appendChild(card);
        }, { onlyOnce: true });
    });
});

// טעינת שיעורים פעילים (ייחודיים ובסיסיים שהופעלו)
onValue(ref(db, 'lessons/active'), (snapshot) => {
    uniqueLessonsSection.innerHTML = '';
    const uniqueLessons = [];
    snapshot.forEach((childSnapshot) => {
        const lesson = childSnapshot.val();
        if (lesson.type === 'unique') {
            uniqueLessons.push(lesson);
        }
    });

    if (uniqueLessons.length > 0) {
        const uniqueHeader = document.createElement('h2');
        uniqueHeader.textContent = 'שיעורים יחודיים';
        uniqueLessonsSection.appendChild(uniqueHeader);
        const uniqueCardsContainer = document.createElement('div');
        uniqueCardsContainer.className = 'course-cards-container';
        uniqueLessons.forEach(lesson => {
            const card = createCardElement(lesson, 'active', true);
            uniqueCardsContainer.appendChild(card);
        });
        uniqueLessonsSection.appendChild(uniqueCardsContainer);
    }
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
