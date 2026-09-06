// ===== 1. Firebase 初始化 =====
const firebaseConfig = {
    apiKey: "AIzaSyCdugk4Rv4RnuBnjwwGkIcjMSJ96gLAJdY",
    authDomain: "nutrient-brawl.firebaseapp.com",
    projectId: "nutrient-brawl",
    storageBucket: "nutrient-brawl.firebasestorage.app",
    messagingSenderId: "764517744885",
    appId: "1:764517744885:web:b3cba8b2662379f0a445bc",
    // 必須手動補上這行，資料庫才能連線！
    databaseURL: "https://nutrient-brawl-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== 2. 基礎設定與登入 =====
let currentUser = { class: "", number: "" };

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function login() {
    const cls = document.getElementById('login-class').value;
    const num = document.getElementById('login-number').value;
    if (!cls || !num) { alert("請選擇班別並輸入學號！"); return; }
    currentUser.class = cls;
    currentUser.number = num;
    document.getElementById('welcome-text').innerText = `歡迎！${cls}班 ${num}號`;
    showScreen('screen-menu');
}

// ===== 3. 單人遊戲核心 (Boss Rush) =====
let hp = 1000, score = 0, combo = 0;
let currentQ = null, timer = null, timeLeft = 10;

function startSinglePlayer() {
    hp = 1000; score = 0; combo = 0;
    updateStats();
    showScreen('screen-single');
    nextQuestion();
}

function updateStats() {
    document.getElementById('player-hp').innerText = hp;
    document.getElementById('player-score').innerText = score;
    const comboEl = document.getElementById('combo-text');
    if (combo >= 3) {
        comboEl.style.display = 'block';
        document.getElementById('combo-count').innerText = combo;
    } else {
        comboEl.style.display = 'none';
    }
}

function nextQuestion() {
    clearInterval(timer);
    if (hp <= 0) { endGame(); return; }

    // 隨機抽題
    const qIndex = Math.floor(Math.random() * questionsData.length);
    currentQ = questionsData[qIndex];
    document.getElementById('boss-question').innerText = currentQ.q;

    // 產生選項
    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = "";
    currentQ.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.background = '#fff';
        btn.style.color = '#333';
        btn.style.border = '2px solid #ccc';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(idx, btn);
        optionsArea.appendChild(btn);
    });

    // 倒數計時
    timeLeft = 10;
    document.getElementById('question-timer').innerText = timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('question-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            hp -= 50; combo = 0; updateStats();
            optionsArea.innerHTML = "<h3 style='color:red;'>超時！被病魔攻擊扣 50 滴血！</h3>";
            setTimeout(nextQuestion, 1500);
        }
    }, 1000);
}

function checkAnswer(selectedIndex, btnElement) {
    clearInterval(timer);
    const optionsArea = document.getElementById('options-area');
    
    if (selectedIndex === currentQ.ans) {
        btnElement.style.background = '#4CAF50'; // 綠色
        btnElement.style.color = 'white';
        combo++;
        let points = 100 * (combo >= 3 ? 2 : 1); // 連擊加倍
        score += points;
        optionsArea.innerHTML += `<h3 style='color:green;'>答對了！病魔受到重創 (+${points}分)</h3>`;
    } else {
        btnElement.style.background = '#f44336'; // 紅色
        btnElement.style.color = 'white';
        hp -= 100;
        combo = 0;
        optionsArea.innerHTML += `<h3 style='color:red;'>答錯了！病魔攻擊！扣 100 滴血！</h3>`;
    }
    updateStats();
    setTimeout(nextQuestion, 1500); // 1.5秒後換下一題
}

function endGame() {
    clearInterval(timer);
    alert(`遊戲結束！你的最終分數是：${score}`);
    
    // 將分數寫入 Firebase 資料庫 (包含時間戳記)
    const recordRef = db.ref('records').push();
    recordRef.set({
        class: currentUser.class,
        number: currentUser.number,
        score: score,
        timestamp: new Date().toLocaleString('zh-HK')
    });
    
    showScreen('screen-menu');
}

// ===== 4. 溫習與老師專區 =====
function loadRevision() {
    const container = document.getElementById('revision-content');
    container.innerHTML = "";
    revisionData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${item.name}</h3><p><strong>🍎 來源：</strong>${item.sources}</p><p><strong>💪 功能：</strong>${item.func}</p><p><strong>⚠️ 缺乏症：</strong><span style="color:#d32f2f; font-weight:bold;">${item.deficiency}</span></p>`;
        container.appendChild(card);
    });
}

function checkTeacher() {
    const pwd = prompt("請輸入老師密碼：");
    if (pwd === "123321") showScreen('screen-teacher');
    else if (pwd !== null) alert("密碼錯誤！");
}

// ===== 5. 榮譽榜邏輯 (只取最高分) =====
function loadLeaderboard() {
    document.getElementById('lb-class-name').innerText = currentUser.class;
    document.getElementById('class-leaderboard').innerHTML = "載入中...";
    document.getElementById('grade-leaderboard').innerHTML = "載入中...";

    db.ref('records').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) return;

        // 整理每個學生的「最高分」
        const highestScores = {};
        for (let key in data) {
            const r = data[key];
            const studentId = `${r.class}_${r.number}`;
            if (!highestScores[studentId] || r.score > highestScores[studentId].score) {
                highestScores[studentId] = r;
            }
        }

        // 轉換為陣列並排序 (由高到低)
        const allStudents = Object.values(highestScores).sort((a, b) => b.score - a.score);

        // 過濾本班
        const classStudents = allStudents.filter(s => s.class === currentUser.class).slice(0, 10);
        // 全級
        const gradeStudents = allStudents.slice(0, 20);

        // 渲染畫面
        const renderList = (arr, elementId) => {
            const ul = document.getElementById(elementId);
            ul.innerHTML = "";
            arr.forEach((s, idx) => {
                ul.innerHTML += `<li style="font-size:1.2rem; margin:5px 0;">
                    <strong>第 ${idx+1} 名:</strong> ${s.class}班 ${s.number}號 - <span style="color:#FF5722; font-weight:bold;">${s.score}分</span>
                </li>`;
            });
        };
        renderList(classStudents, 'class-leaderboard');
        renderList(gradeStudents, 'grade-leaderboard');
    });
}

// ===== 6. 老師一鍵匯出 Excel (CSV) =====
function exportToCSV() {
    db.ref('records').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) { alert("目前還沒有任何遊玩紀錄喔！"); return; }

        let csvContent = "班別,學號,分數,遊玩時間\n";
        for (let key in data) {
            const r = data[key];
            csvContent += `${r.class},${r.number},${r.score},${r.timestamp}\n`;
        }

        // 觸發下載 (使用 UTF-8 BOM 避免 Excel 中文亂碼)
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `營養素大亂鬥_全校紀錄_${new Date().getTime()}.csv`;
        link.click();
    });
}
