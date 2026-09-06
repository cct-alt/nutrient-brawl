// ===== 1. Firebase 初始化 =====
const firebaseConfig = {
    apiKey: "AIzaSyCdugk4Rv4RnuBnjwwGkIcjMSJ96gLAJdY",
    authDomain: "nutrient-brawl.firebaseapp.com",
    projectId: "nutrient-brawl",
    storageBucket: "nutrient-brawl.firebasestorage.app",
    appId: "1:764517744885:web:b3cba8b2662379f0a445bc",
    databaseURL: "https://nutrient-brawl-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

let currentUser = { class: "", number: "" };

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function login() {
    const cls = document.getElementById('login-class').value;
    const num = document.getElementById('login-number').value;
    if (!cls || !num) { alert("請選擇班別並輸入學號！"); return; }
    currentUser.class = cls; currentUser.number = num;
    document.getElementById('welcome-text').innerText = `歡迎！${cls}班 ${num}號`;
    showScreen('screen-menu');
}

// ===== 3. 單人遊戲核心 (升級版打擊機制) =====
let hp = 500;       // 玩家血量下調，增加刺激感
let bossHp = 1000;  // 病魔血量
let score = 0, combo = 0;
let currentQ = null, timer = null, timeLeft = 10;

function startSinglePlayer() {
    hp = 500; bossHp = 1000; score = 0; combo = 0;
    document.getElementById('boss-avatar').innerText = "👾"; // 恢復病魔表情
    updateStats();
    showScreen('screen-single');
    nextQuestion();
}

function updateStats() {
    document.getElementById('player-hp').innerText = hp;
    document.getElementById('player-score').innerText = score;
    
    // 更新病魔血條
    document.getElementById('boss-hp-text').innerText = bossHp;
    const hpPercent = Math.max(0, (bossHp / 1000) * 100);
    document.getElementById('boss-hp-bar').style.width = hpPercent + "%";

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
    
    // 檢查生死狀態
    if (hp <= 0) { 
        endGame("lose"); return; 
    }
    if (bossHp <= 0) { 
        endGame("win"); return; 
    }

    document.getElementById('boss-avatar').innerText = "👾"; // 恢復一般表情

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
        btn.style.background = '#fff'; btn.style.color = '#333'; btn.style.border = '2px solid #ccc';
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
            hp -= 100; combo = 0; 
            playerTakeDamage(); // 觸發受傷特效
            optionsArea.innerHTML = "<h3 style='color:red;'>超時！病魔對你造成 100 傷害！</h3>";
            setTimeout(nextQuestion, 1500);
        }
    }, 1000);
}

function checkAnswer(selectedIndex, btnElement) {
    clearInterval(timer);
    const optionsArea = document.getElementById('options-area');
    const bossContainer = document.getElementById('boss-container');
    
    if (selectedIndex === currentQ.ans) {
        // 答對邏輯
        btnElement.style.background = '#4CAF50'; btnElement.style.color = 'white';
        combo++;
        let isCrit = combo >= 3;
        let dmg = isCrit ? 400 : 200; // 連擊大爆擊
        let points = isCrit ? 200 : 100;
        
        bossHp -= dmg;
        score += points;
        
        document.getElementById('boss-avatar').innerText = "💥"; // 病魔慘叫表情
        bossContainer.classList.add('shake-anim'); // 病魔震動
        setTimeout(() => bossContainer.classList.remove('shake-anim'), 400);

        optionsArea.innerHTML += `<h3 style='color:green;'>命中！對病魔造成 ${dmg} 點傷害！ (+${points}分)</h3>`;
    } else {
        // 答錯邏輯
        btnElement.style.background = '#f44336'; btnElement.style.color = 'white';
        hp -= 100;
        combo = 0;
        playerTakeDamage(); // 畫面閃紅光
        optionsArea.innerHTML += `<h3 style='color:red;'>答錯了！病魔反擊，扣 100 滴血！</h3>`;
    }
    
    updateStats();
    setTimeout(nextQuestion, 1500);
}

// 玩家受傷特效
function playerTakeDamage() {
    updateStats();
    const screen = document.getElementById('screen-single');
    screen.classList.add('damage-flash');
    document.getElementById('boss-avatar').innerText = "😈"; // 病魔得意的表情
    setTimeout(() => screen.classList.remove('damage-flash'), 500);
}

function endGame(result) {
    clearInterval(timer);
    
    if (result === "win") {
        // 破關獎勵：剩餘血量 x 2 轉換成分數
        const bonus = hp * 2;
        score += bonus;
        alert(`🎉 恭喜破關！成功擊敗病魔！\n剩餘血量獎勵加成：+${bonus}分\n【最終總分：${score} 分】`);
    } else {
        alert(`💀 挑戰失敗！你被病魔打敗了...\n【最終總分：${score} 分】\n去溫習專區看看再來挑戰吧！`);
    }
    
    // 寫入 Firebase
    const recordRef = db.ref('records').push();
    recordRef.set({
        class: currentUser.class, number: currentUser.number,
        score: score, timestamp: new Date().toLocaleString('zh-HK')
    });
    
    showScreen('screen-menu');
}

function forceEndGame() {
    clearInterval(timer);
    alert("你已逃離戰場，本次分數不予記錄。");
    showScreen('screen-menu');
}

// ===== 4. 溫習、老師與排行榜功能 (與上階段相同) =====
function loadRevision() {
    const container = document.getElementById('revision-content'); container.innerHTML = "";
    revisionData.forEach(item => {
        const card = document.createElement('div'); card.className = 'card';
        card.innerHTML = `<h3>${item.name}</h3><p><strong>🍎 來源：</strong>${item.sources}</p><p><strong>💪 功能：</strong>${item.func}</p><p><strong>⚠️ 缺乏症：</strong><span style="color:#d32f2f; font-weight:bold;">${item.deficiency}</span></p>`;
        container.appendChild(card);
    });
}
function checkTeacher() {
    const pwd = prompt("請輸入老師密碼：");
    if (pwd === "123321") showScreen('screen-teacher'); else if (pwd !== null) alert("密碼錯誤！");
}
function loadLeaderboard() {
    document.getElementById('lb-class-name').innerText = currentUser.class;
    document.getElementById('class-leaderboard').innerHTML = "載入中..."; document.getElementById('grade-leaderboard').innerHTML = "載入中...";
    db.ref('records').once('value').then(snapshot => {
        const data = snapshot.val(); if (!data) return;
        const highestScores = {};
        for (let key in data) {
            const r = data[key]; const studentId = `${r.class}_${r.number}`;
            if (!highestScores[studentId] || r.score > highestScores[studentId].score) { highestScores[studentId] = r; }
        }
        const allStudents = Object.values(highestScores).sort((a, b) => b.score - a.score);
        const classStudents = allStudents.filter(s => s.class === currentUser.class).slice(0, 10);
        const gradeStudents = allStudents.slice(0, 20);
        const renderList = (arr, elementId) => {
            const ul = document.getElementById(elementId); ul.innerHTML = "";
            arr.forEach((s, idx) => { ul.innerHTML += `<li style="font-size:1.2rem; margin:5px 0;"><strong>第 ${idx+1} 名:</strong> ${s.class}班 ${s.number}號 - <span style="color:#FF5722; font-weight:bold;">${s.score}分</span></li>`; });
        };
        renderList(classStudents, 'class-leaderboard'); renderList(gradeStudents, 'grade-leaderboard');
    });
}
function exportToCSV() {
    db.ref('records').once('value').then(snapshot => {
        const data = snapshot.val(); if (!data) { alert("無紀錄"); return; }
        let csvContent = "班別,學號,分數,遊玩時間\n";
        for (let key in data) { con
