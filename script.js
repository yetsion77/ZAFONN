// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCr99B3to9oh2SyvkhSjCxIhjuzl2-4KuA",
  authDomain: "zafon-d1165.firebaseapp.com",
  projectId: "zafon-d1165",
  storageBucket: "zafon-d1165.firebasestorage.app",
  messagingSenderId: "277039794189",
  appId: "1:277039794189:web:13952ae1a02fe3bd7ded44",
  measurementId: "G-8PQYSEZ897"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const highScoresCollection = collection(db, "highscores");

document.addEventListener('DOMContentLoaded', () => {
    const DEBUG_MODE = true;

    const localitiesListEl = document.getElementById('localities-list');
    const checkButton = document.getElementById('check-button');
    const feedbackEl = document.getElementById('feedback');
    const levelIndicatorEl = document.getElementById('level-indicator');
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const highScoresListEl = document.getElementById('high-scores-list');

    let level, score, lives;
    const itemsPerLevel = 5;
    let currentLocalities = [];
    let sortable;
    const MAX_HIGH_SCORES = 5;

    const handcraftedLevels = {
        1: ['מטולה', 'חיפה', 'תל אביב -יפו', 'באר שבע', 'אילת'],
        2: ['קצרין', 'כרמיאל', 'נתניה', 'אשקלון', 'שדרות'],
        3: ['צפת', 'עפולה', 'רעננה', 'רחובות', 'ירוחם'],
        4: ['קריית שמונה', 'טבריה', 'פתח תקווה', 'ירושלים', 'ערד'],
        5: ['עכו', 'זכרון יעקב', 'נתניה', 'אשדוד', 'מצפה רמון'],
        6: ['ראש פינה', 'חדרה', 'ראשון לציון', 'קריית גת', 'דימונה']
    };

    const facts = {
        'אילת': 'העיר הדרומית ביותר בישראל, מהווה גשר יבשתי בין אסיה לאפריקה.',
        'באר שבע': 'בירת הנגב, מוזכרת בספר בראשית כמקום בו אברהם אבינו כרת ברית.',
        'מצפה רמון': 'ממוקמת על שפתו של מכתש רמון, המכתש הגדול בעולם מסוגו.',
        'ירוחם': 'העיירה הראשונה שהוקמה בנגב לאחר קום המדינה, בשנת 1951.',
        'דימונה': 'נוסדה כעיירת פיתוח ב-1955, ומוכרת בזכות הקריה למחקר גרעיני הסמוכה לה.',
        'ערד': 'עיר מתוכננת שנוסדה ב-1962, ידועה באוויר הנקי והיבש שלה.',
        'ירושלים': 'בירת ישראל והעיר הגדולה ביותר במדינה. קדושה לשלוש הדתות המונותאיסטיות הגדולות.',
        'תל אביב -יפו': 'המרכז הכלכלי והתרבותי של ישראל. "העיר הלבנה" שלה הוכרזה כאתר מורשת עולמית.',
        'חיפה': 'עיר נמל מרכזית וביתם של הגנים הבהאיים המרהיבים, אתר מורשת עולמית של אונסק"ו.',
        'צפת': 'אחת מארבע ערי הקודש, ונחשבת למרכז עולמי של תורת הקבלה.',
        'טבריה': 'יושבת על חופה המערבי של הכנרת. קרויה על שמו של הקיסר הרומי טיבריוס.',
        'קריית שמונה': 'העיר הצפונית ביותר בישראל, קרויה על שם שמונת הנופלים בקרב תל חי.',
        'פתח תקווה': 'מכונה "אם המושבות" והיא אחת הערים הראשונות שהוקמו בעת החדשה, בשנת 1878.',
        'ראשון לציון': 'ההמנון הלאומי, "התקווה", נכתב והושר בה לראשונה. גם דגל ישראל הונף בה לראשונה.',
        'נתניה': 'בירת השרון, קרויה על שם נתן שטראוס. ידועה בחופיה הארוכים ובצוקי הכורכר שלה.',
        'עכו': 'עיר נמל עתיקה עם היסטוריה של אלפי שנים. העיר העתיקה שלה היא אתר מורשת עולמית.',
        'אשדוד': 'ביתה של הנמל הגדול בישראל, והיא עיר פלשתית קדומה המוזכרת בתנ"ך.',
        'אשקלון': 'אחת הערים העתיקות בעולם, עם היסטוריה של למעלה מ-5,000 שנה.',
        'רחובות': 'מארחת את מכון ויצמן למדע, אחד ממוסדות המחקר המובילים בעולם.',
        'קצרין': 'נחשבת לבירת הגולן, ובקרבתה נמצאים אתרים ארכאולוגיים רבים וכרמים.',
        'שדרות': 'העיר הקרובה ביותר לרצועת עזה, ידועה בחוסן הקהילתי והתרבותי שלה.',
        'רעננה': 'עיר בשרון הידועה באיכות החיים הגבוהה ובפארק רעננה המפורסם.',
        'עפולה': 'מכונה "בירת העמק" בשל מיקומה המרכזי בעמק יזרעאל.'
    };
    
    async function initGame() {
        level = 1;
        score = 0;
        lives = 3;
        updateStats();
        await displayHighScores();
        startGame();
    }

    function updateStats() {
        scoreEl.textContent = score;
        livesEl.textContent = lives;
        levelIndicatorEl.textContent = `שלב: ${level}`;
    }

    function startGame() {
        if (DEBUG_MODE) console.log(`1. startGame() called for level ${level}`);
        updateStats();
        feedbackEl.textContent = '';
        feedbackEl.className = '';
        checkButton.disabled = false;

        currentLocalities = [];
        let chosenNames = new Set();

        if (handcraftedLevels[level]) {
            const levelNames = handcraftedLevels[level];
            currentLocalities = levelNames.map(name => localities.find(loc => loc.name === name)).filter(Boolean);
        } else {
            generateRandomLocalities();
        }

        displayLocalities();
        if (DEBUG_MODE) console.log('3. Display updated. Ready for user.');
    }

    function generateRandomLocalities() {
        // For the first couple of random levels (7 and 8), ensure a wide geographical spread for an easier start.
        if (level <= 8) {
            if (DEBUG_MODE) console.log(`Generating easy random level ${level} using binning method.`);
            const numBins = itemsPerLevel; // 5
            const binSize = Math.floor(localities.length / numBins);
            currentLocalities = [];
    
            for (let i = 0; i < numBins; i++) {
                const start = i * binSize;
                const end = (i === numBins - 1) ? localities.length : (i + 1) * binSize;
                const bin = localities.slice(start, end);
                
                if (bin.length > 0) {
                     const randomIndex = Math.floor(Math.random() * bin.length);
                     currentLocalities.push(bin[randomIndex]);
                }
            }
    
            // Fallback in case the binning method fails to produce enough localities.
            if (currentLocalities.length < itemsPerLevel) {
                if (DEBUG_MODE) console.error("Binning method failed, using fallback random selection.");
                const shuffled = [...localities].sort(() => 0.5 - Math.random());
                currentLocalities = shuffled.slice(0, itemsPerLevel);
            }
    
        } else { // For level 9+, use the previous logic with a smoother ramp-up.
            if (DEBUG_MODE) console.log(`Generating hard random level ${level} using slicing method.`);
            const totalLocalities = localities.length;
            const difficultyFactor = (level - 8) * 40; // Starts easy and gets harder
            const minSliceSize = 100;
            const sliceSize = Math.max(totalLocalities - difficultyFactor, minSliceSize);
            const start = Math.floor(Math.random() * (totalLocalities - sliceSize));
            const selectionPool = localities.slice(start, start + sliceSize);
    
            const shuffledPool = [...selectionPool].sort(() => 0.5 - Math.random());
            currentLocalities = shuffledPool.slice(0, itemsPerLevel);
        }
    }

    function displayLocalities() {
        localitiesListEl.innerHTML = '';
        const shuffled = [...currentLocalities].sort(() => Math.random() - 0.5);
        
        shuffled.forEach(loc => {
            const li = document.createElement('li');
            li.textContent = loc.name;
            li.dataset.lat = loc.lat;
            localitiesListEl.appendChild(li);
        });

        if (sortable) {
            sortable.destroy();
        }
        sortable = new Sortable(localitiesListEl, {
            animation: 150,
            ghostClass: 'sortable-ghost'
        });
    }

    function checkAnswer() {
        if (DEBUG_MODE) console.log('4. checkAnswer() called.');
        const userSortedItems = [...localitiesListEl.children];
        
        if (userSortedItems.length === 0 || userSortedItems.length < itemsPerLevel) {
            if (DEBUG_MODE) console.error('Error: checkAnswer called on an empty or incomplete list.');
            feedbackEl.textContent = 'אירעה שגיאה. נסו לרענן את הדף.';
            feedbackEl.className = 'incorrect';
            return;
        }

        const userSortedNames = userSortedItems.map(li => li.textContent);
        const correctOrder = [...currentLocalities].sort((a, b) => b.lat - a.lat);
        const correctNames = correctOrder.map(loc => loc.name);

        if (JSON.stringify(userSortedNames) === JSON.stringify(correctNames)) {
            feedbackEl.textContent = 'כל הכבוד! התשובה נכונה!';
            feedbackEl.className = 'correct';
            checkButton.disabled = true;
            score += 10;
            updateStats();

            setTimeout(() => {
                showSuccessPopup();
            }, 1000);

        } else {
            lives--;
            updateStats();
            feedbackEl.textContent = `טעות, נסו שוב. נותרו לכם ${lives} חיים.`;
            feedbackEl.className = 'incorrect';

            if (lives === 0) {
                gameOver();
            }
        }
    }
    
    function showSuccessPopup() {
        const popupEl = document.createElement('div');
        popupEl.id = 'popup';
        
        const factLocality = currentLocalities.find(loc => facts[loc.name]);
        let infoText = `עברתם את שלב ${level}! מוכנים לשלב הבא?`;

        if (factLocality) {
            infoText = `<b>${factLocality.name}:</b> ${facts[factLocality.name]}<br><br>${infoText}`;
        }

        popupEl.innerHTML = `
            <div class="popup-content">
                <span class="close-button">&times;</span>
                <h2>כל הכבוד!</h2>
                <p id="popup-info">${infoText}</p>
                <button id="next-level-button">לשלב הבא</button>
            </div>
        `;
        
        document.body.appendChild(popupEl);

        popupEl.querySelector('.close-button').addEventListener('click', () => {
            document.body.removeChild(popupEl);
        });

        popupEl.querySelector('#next-level-button').addEventListener('click', () => {
            document.body.removeChild(popupEl);
            nextLevel();
        });
    }

    function gameOver() {
        checkButton.disabled = true;
        feedbackEl.textContent = 'המשחק נגמר!';
        showGameOverPopup();
    }

    function showGameOverPopup() {
        const popupEl = document.createElement('div');
        popupEl.id = 'popup';

        popupEl.innerHTML = `
            <div class="popup-content">
                <h2>המשחק נגמר!</h2>
                <p>הניקוד הסופי שלך: ${score}</p>
                <input type="text" id="player-name" placeholder="הכנס את שמך" style="width: 80%; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #ccc;">
                <button id="save-score-button">שמור תוצאה</button>
            </div>
        `;
        
        document.body.appendChild(popupEl);

        popupEl.querySelector('#save-score-button').addEventListener('click', () => {
            const playerName = popupEl.querySelector('#player-name').value.trim();
            if (playerName) {
                saveHighScore(playerName, score);
                document.body.removeChild(popupEl);
                initGame(); // Restart game
            }
        });
    }

    async function saveHighScore(name, score) {
        try {
            await addDoc(highScoresCollection, {
                name: name,
                score: score,
                timestamp: new Date()
            });
            await displayHighScores();
        } catch (error) {
            console.error("Error adding document: ", error);
            feedbackEl.textContent = "שגיאה בשמירת התוצאה.";
        }
    }

    async function displayHighScores() {
        highScoresListEl.innerHTML = '<li>טוען שיאים...</li>';
        try {
            const q = query(highScoresCollection, orderBy("score", "desc"), limit(MAX_HIGH_SCORES));
            const querySnapshot = await getDocs(q);
            
            highScoresListEl.innerHTML = ''; // Clear existing scores
            
            if (querySnapshot.empty) {
                highScoresListEl.innerHTML = '<li>אין עדיין שיאים...</li>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const scoreItem = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `<span class="name">${scoreItem.name}</span> <span class="score">${scoreItem.score}</span>`;
                highScoresListEl.appendChild(li);
            });
        } catch (error) {
            console.error("Error getting documents: ", error);
            highScoresListEl.innerHTML = '<li>שגיאה בטעינת השיאים.</li>';
        }
    }

    function nextLevel() {
        level++;
        startGame();
    }

    checkButton.addEventListener('click', checkAnswer);
    initGame();
}); 