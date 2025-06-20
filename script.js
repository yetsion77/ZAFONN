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

    checkButton.addEventListener('click', checkAnswer);

    let level, score, lives;
    const itemsPerLevel = 5;
    let currentLocalities = [];
    let sortable;
    const MAX_HIGH_SCORES = 5;

    // --- New Tiered Level Data & Logic ---

    // Game-specific generated levels
    let balancedTierLevels = [];
    let tier1Shuffled, tier2Shuffled, tier3Shuffled;
    let tier1Index, tier2Index, tier3Index;

    const fixedLevels = {
        1: ['מטולה', 'חיפה', 'תל אביב -יפו', 'באר שבע', 'אילת'],
        2: ['קצרין', 'טבריה', 'נתניה', 'אשקלון', 'מצפה רמון']
    };

    const balancedTierSource = [
        'כרמיאל', 'שדרות', 'צפת', 'עפולה', 'רעננה', 'רחובות', 'ירוחם', 'קריית שמונה', 
        'פתח תקווה', 'ירושלים', 'ערד', 'עכו', 'זכרון יעקב', 'אשדוד', 'ראש פינה', 
        'חדרה', 'ראשון לציון', 'קריית גת', 'דימונה'
    ];

    const tier1Source = [
        'מטולה', 'חיפה', 'תל אביב -יפו', 'באר שבע', 'אילת', 'קצרין', 'כרמיאל', 'נתניה', 'אשקלון', 'שדרות',
        'צפת', 'עפולה', 'רעננה', 'רחובות', 'ירוחם', 'קריית שמונה', 'טבריה', 'פתח תקווה', 'ירושלים', 'ערד',
        'עכו', 'זכרון יעקב', 'אשדוד', 'מצפה רמון', 'ראש פינה', 'חדרה', 'ראשון לציון', 'קריית גת', 'דימונה', 'בית שמש'
    ];

    const tier2Source = [
        'שלומי', 'מעלות-תרשיחא', 'כפר ורדים', 'קריית ים', 'קריית מוצקין', 'קריית ביאליק', 'טירת כרמל', 'נשר', 'יקנעם עילית', 'קריית טבעון', 'רמת ישי', 'מגדל העמק', 'בית שאן', 'עספיא', 'אור עקיבא', 
        'פרדס חנה-כרכור', 'כפר יונה', 'תל מונד', 'אבן יהודה', 'כפר סבא', 'הוד השרון', 'רמת השרון', 'לוד', 'רמלה', 'חולון', 'בת ים', 'רמת גן', 'גבעתיים', 'בני ברק', 'אור יהודה', 'גבעת שמואל', 'קריית אונו', 
        'נס ציונה', 'יבנה', 'גדרה', 'מזכרת בתיה', 'מבשרת ציון', 'מעלה אדומים', 'אופקים', 'נתיבות', 'קריית מלאכי', 'להבים', 'עומר', 'מיתר', 'רהט',
        'אריאל', 'גני תקווה', 'טירה', 'כפר קאסם', 'אורנית', 'קריית עקרון'
    ];

    const tier3Source = [
        'דן', 'דפנה', 'כפר גלעדי', 'כפר בלום', 'שדה נחמיה', 'יסוד המעלה', 'עין גב', "דגניה א'", 'אפיקים', 'כפר תבור', 'נהלל', 'שדה אליהו',
        'קיסריה', 'מעגן מיכאל', 'שפיים', 'געש', 'כפר שמריהו', 'סביון', 'שוהם', 'בית דגן', 'פלמחים', 'ניצנים', 'כפר חב"ד',
        'אבו גוש', 'צור הדסה', 'הר אדר', 'נווה אילן', 'קריית ענבים',
        'יד מרדכי', 'נתיב העשרה', 'ניר עם', 'מפלסים', 'כפר עזה', 'סעד', 'בארי', 'רעים', 'נירים', 'כיסופים', 'שדה בוקר', 'משאבי שדה', 'צאלים', 'גבולות', 'עין גדי',
        'נחשולים', 'הזורע'
    ];
    
    const facts = {
        'אילת': 'העיר הדרומית ביותר בישראל, מהווה גשר יבשתי בין אסיה לאפריקה.',
        'באר שבע': 'בירת הנגב, מוזכרת בספר בראשית כמקום בו אברהם אבינו כרת ברית.',
        'מצפה רמון': 'ממוקמת על שפתו של מכתש רמון, המכתש הגדול בעולם מסוגו.',
        'ירוחם': 'העיירה הראשונה שהוקמה בנגב לאחר קום המדינה, בשנת 1951.',
        'דימונה': 'נוסדה כעיירת פיתוח ב-1955, ומוכרת בזכות הקריה למחקר גרעיני הסמוכה לה.',
        'ערד': 'עיר מתוכננת שנוסדה ב-1962, ידועה באוויר הנקי והיבש שלה.',
        'ירושלים': 'בירת ישראל והעיר הגדולה ביותר במדינה.',
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
        tier1Index = 0;
        tier2Index = 0;
        tier3Index = 0;

        // Shuffle tiers at the beginning
        tier1Shuffled = [...tier1Source].sort(() => Math.random() - 0.5);
        tier2Shuffled = [...tier2Source].sort(() => Math.random() - 0.5);
        tier3Shuffled = [...tier3Source].sort(() => Math.random() - 0.5);

        // Check for debug mode via URL parameter to jump to a level
        const urlParams = new URLSearchParams(window.location.search);
        const startLevelParam = urlParams.get('level');
        
        if (startLevelParam) {
            const startLevel = parseInt(startLevelParam, 10);
            if (!isNaN(startLevel) && startLevel > 1) {
                if (DEBUG_MODE) console.warn(`DEBUG MODE: Jumping to level ${startLevel}`);
                level = startLevel;
                let levelsToSkip = startLevel - 1;

                // Fast-forward through tiers
                const tier1LevelsAvailable = Math.floor(tier1Shuffled.length / itemsPerLevel);
                const tier1LevelsToSkip = Math.min(levelsToSkip, tier1LevelsAvailable);
                tier1Index = tier1LevelsToSkip * itemsPerLevel;
                levelsToSkip -= tier1LevelsToSkip;

                if (levelsToSkip > 0) {
                    const tier2LevelsAvailable = Math.floor(tier2Shuffled.length / itemsPerLevel);
                    const tier2LevelsToSkip = Math.min(levelsToSkip, tier2LevelsAvailable);
                    tier2Index = tier2LevelsToSkip * itemsPerLevel;
                    levelsToSkip -= tier2LevelsToSkip;
                }
                
                if (levelsToSkip > 0) {
                    const tier3LevelsAvailable = Math.floor(tier3Shuffled.length / itemsPerLevel);
                    const tier3LevelsToSkip = Math.min(levelsToSkip, tier3LevelsAvailable);
                    tier3Index = tier3LevelsToSkip * itemsPerLevel;
                    // levelsToSkip is not used after this, but good practice
                    levelsToSkip -= tier3LevelsToSkip; 
                }
            }
        }

        updateStats();
        await displayHighScores();
        startGame();
    }

    function updateStats() {
        scoreEl.textContent = score;
        livesEl.textContent = lives;
        levelIndicatorEl.textContent = `שלב: ${level}`;
        checkButton.disabled = false;
    }

    function startGame() {
        if (DEBUG_MODE) console.log(`1. startGame() called for level ${level}`);
        updateStats();
        feedbackEl.textContent = '';
        feedbackEl.className = '';
        checkButton.disabled = false;

        currentLocalities = [];
        let levelNames = [];

        // Try to get a level from the tiers in order.
        if (tier1Index + itemsPerLevel <= tier1Shuffled.length) {
            if (DEBUG_MODE) console.log(`Serving level from Tier 1`);
            levelNames = tier1Shuffled.slice(tier1Index, tier1Index + itemsPerLevel);
            tier1Index += itemsPerLevel;
        } else if (tier2Index + itemsPerLevel <= tier2Shuffled.length) {
            if (DEBUG_MODE) console.log(`Serving level from Tier 2`);
            levelNames = tier2Shuffled.slice(tier2Index, tier2Index + itemsPerLevel);
            tier2Index += itemsPerLevel;
        } else if (tier3Index + itemsPerLevel <= tier3Shuffled.length) {
            if (DEBUG_MODE) console.log(`Serving level from Tier 3`);
            levelNames = tier3Shuffled.slice(tier3Index, tier3Index + itemsPerLevel);
            tier3Index += itemsPerLevel;
        }

        // If we got names from a tier, find their data.
        if (levelNames.length > 0) {
            currentLocalities = levelNames.map(name => localities.find(loc => loc.name === name)).filter(Boolean);
        }
        
        // If after trying all tiers we still have no localities, it's time for random generation.
        if (currentLocalities.length === 0) {
             if (DEBUG_MODE) console.log(`All tiers exhausted. Generating a random level.`);
             generateRandomLocalities();
        }

        displayLocalities();
        if (DEBUG_MODE) console.log('3. Display updated. Ready for user.');
    }

    function generateRandomLocalities() {
        if (DEBUG_MODE) console.log(`Generating hard random level ${level} using a new spread-out method.`);
        
        const allTieredLocalities = new Set([...tier1Source, ...tier2Source, ...tier3Source]);
        const randomPool = localities.filter(loc => !allTieredLocalities.has(loc.name));

        const totalLocalities = randomPool.length;
        if (totalLocalities < itemsPerLevel) {
            if (DEBUG_MODE) console.log("Not enough unique random localities left, game might end.");
            currentLocalities = [];
            return;
        }

        // New logic: Pick one from each of 5 zones to ensure spread.
        const selectedForLevel = new Set();
        const zones = itemsPerLevel;
        const zoneSize = Math.floor(totalLocalities / zones);

        for (let i = 0; i < zones; i++) {
            const start = i * zoneSize;
            const end = (i === zones - 1) ? totalLocalities : start + zoneSize;
            
            const randomIndex = start + Math.floor(Math.random() * (end - start));
            selectedForLevel.add(randomPool[randomIndex]);
        }
        
        currentLocalities = Array.from(selectedForLevel);
        
        // Fallback to ensure we always have 5, though it's unlikely to be needed with the Set logic.
        while (currentLocalities.length < itemsPerLevel && currentLocalities.length < totalLocalities) {
            const randomLoc = randomPool[Math.floor(Math.random() * totalLocalities)];
            if (!currentLocalities.some(l => l.name === randomLoc.name)) {
                 currentLocalities.push(randomLoc);
            }
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
        popupEl.className = 'popup-overlay';

        // Pick a random locality from the current level that has a fact
        const localitiesWithFacts = currentLocalities.filter(loc => facts[loc.name]);
        let factText = "כל הכבוד! הצלחתם למקם נכון את כל היישובים.";
        if (localitiesWithFacts.length > 0) {
            const randomLocality = localitiesWithFacts[Math.floor(Math.random() * localitiesWithFacts.length)];
            factText = `<strong>${randomLocality.name}:</strong> ${facts[randomLocality.name]}`;
        }

        popupEl.innerHTML = `
            <div class="popup-content">
                <h2>השלב הושלם!</h2>
                <p>${factText}</p>
                <button id="next-level-button">לשלב הבא</button>
            </div>
        `;
        
        document.body.appendChild(popupEl);

        popupEl.querySelector('#next-level-button').addEventListener('click', () => {
            document.body.removeChild(popupEl);
            nextLevel();
        });
    }

    function gameOver() {
        checkButton.disabled = true;
        const userSortedNames = [...localitiesListEl.children].map(li => li.textContent);
        const correctOrder = [...currentLocalities].sort((a, b) => b.lat - a.lat).map(loc => loc.name);
        
        showGameOverPopup(userSortedNames, correctOrder);
    }
    
    function showGameOverPopup(userOrder, correctOrder) {
        const popupEl = document.createElement('div');
        popupEl.className = 'popup-overlay';
        const correctNames = correctOrder.join(' ← ');

        popupEl.innerHTML = `
            <div class="popup-content">
                <h2>המשחק נגמר!</h2>
                <p>הסדר הנכון היה:</p>
                <p class="correct-order-display">${correctNames}</p>
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
