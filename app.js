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

// ===== 3. 單人遊戲核心 (加入極速加成機制) =====
let hp = 500;       
let bossHp = 1000;  
let score = 0, combo = 0;
let currentQ = null, timer = null, timeLeft = 10;

function startSinglePlayer() {
    hp = 500; bossHp = 1000; score = 0; combo = 0;
    document.getElementById('boss-avatar').innerText = "👾"; 
    updateStats();
    showScreen('screen-single');
    nextQuestion();
}

function updateStats() {
    document.getElementById('player-hp').innerText = hp;
    document.getElementById('player-score').innerText = score;
    
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
    
    if (hp <= 0) { endGame("lose"); return; }
    if (bossHp <= 0) { endGame("win"); return; }

    document.getElementById('boss-avatar').innerText = "👾"; 

    const qIndex = Math.floor(Math.random() * questionsData.length);
    currentQ = questionsData[qIndex];
    document.getElementById('boss-question').innerText = currentQ.q;

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

    timeLeft = 10;
    document.getElementById('question-timer').innerText = timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('question-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            hp -= 100; combo = 0; 
            showFloatingText('-100', '#1976D2', 'screen-single'); // 顯示玩家被扣血 (藍色字)
            playerTakeDamage(); 
            optionsArea.innerHTML = "<h3 style='color:red;'>超時！病魔對你造成 100 傷害！</h3>";
            setTimeout(nextQuestion, 1500);
        }
    }, 1000);
}

function checkAnswer(selectedIndex, btnElement) {
    clearInterval(timer); // 停止計時，鎖定剩餘時間
    const optionsArea = document.getElementById('options-area');
    const bossContainer = document.getElementById('boss-container');
    
    if (selectedIndex === currentQ.ans) {
        btnElement.style.background = '#4CAF50'; btnElement.style.color = 'white';
        combo++;
        let isCrit = combo >= 3;
        let dmg = isCrit ? 400 : 200; 
        
        // --- 核心修改：計算極速加成 ---
        let basePoints = isCrit ? 200 : 100;
        let timeBonus = timeLeft * 10; // 剩幾秒就送幾乘10分
        let totalPoints = basePoints + timeBonus;
        
        bossHp -= dmg;
        showFloatingText(`-${dmg}`, '#d32f2f', 'boss-container'); // 顯示紅色扣血數字

        score += totalPoints; // 加上總分

        document.getElementById('boss-avatar').innerText = "💥"; 
        bossContainer.classList.add('shake-anim'); 
        setTimeout(() => bossContainer.classList.remove('shake-anim'), 400);

        // 畫面顯示分數結構，讓學生知道快有快的好處
        optionsArea.innerHTML += `<h3 style='color:green; line-height: 1.4;'>命中！造成 ${dmg} 傷害！<br><span style='font-size:1rem; color:#FF9800;'>基礎 +${basePoints} | 極速加成 +${timeBonus}</span></h3>`;
    } else {
        btnElement.style.background = '#f44336'; btnElement.style.color = 'white';
        hp -= 100;
        combo = 0;
        playerTakeDamage(); 
        optionsArea.innerHTML += `<h3 style='color:red;'>答錯了！病魔反擊，扣 100 滴血！</h3>`;
    }
    
    updateStats();
    setTimeout(nextQuestion, 1500);
}

function playerTakeDamage() {
    updateStats();
    const screen = document.getElementById('screen-single');
    screen.classList.add('damage-flash');
    document.getElementById('boss-avatar').innerText = "😈"; 
    setTimeout(() => screen.classList.remove('damage-flash'), 500);
}

function endGame(result) {
    clearInterval(timer);
    
    if (result === "win") {
        const bonus = hp * 2;
        score += bonus;
        alert(`🎉 恭喜破關！成功擊敗病魔！\n血量獎勵：+${bonus}分\n【最終總分：${score} 分】`);
    } else {
        alert(`💀 挑戰失敗！你被病魔打敗了...\n【最終總分：${score} 分】\n去溫習專區看看再來挑戰吧！`);
    }
    
    const recordRef = db.ref('records').push();
    recordRef.set({
        class: currentUser.class, 
        number: currentUser.number,
        score: score, 
        timestamp: new Date().toLocaleString('zh-HK')
    });
    
    showScreen('screen-menu');
}

function forceEndGame() {
    clearInterval(timer);
    alert("你已逃離戰場，本次分數不予記錄。");
    showScreen('screen-menu');
}

// ===== 4. 溫習、老師與排行榜功能 =====
function loadRevision() {
    const container = document.getElementById('revision-content'); 
    container.innerHTML = "";
    revisionData.forEach(item => {
        const card = document.createElement('div'); card.className = 'card';
        card.innerHTML = `<h3>${item.name}</h3><p><strong>🍎 來源：</strong>${item.sources}</p><p><strong>💪 功能：</strong>${item.func}</p><p><strong>⚠️ 缺乏症：</strong><span style="color:#d32f2f; font-weight:bold;">${item.deficiency}</span></p>`;
        container.appendChild(card);
    });
}

function checkTeacher() {
    const pwd = prompt("請輸入老師密碼：");
    if (pwd === "123321") showScreen('screen-teacher'); 
    else if (pwd !== null) alert("密碼錯誤！");
}

function loadLeaderboard() {
    document.getElementById('lb-class-name').innerText = currentUser.class;
    document.getElementById('class-leaderboard').innerHTML = "載入中..."; 
    document.getElementById('grade-leaderboard').innerHTML = "載入中...";
    
    db.ref('records').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) return;
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
            arr.forEach((s, idx) => { 
                ul.innerHTML += `<li style="font-size:1.2rem; margin:5px 0;"><strong>第 ${idx+1} 名:</strong> ${s.class}班 ${s.number}號 - <span style="color:#FF5722; font-weight:bold;">${s.score}分</span></li>`; 
            });
        };
        renderList(classStudents, 'class-leaderboard');
        renderList(gradeStudents, 'grade-leaderboard');
    });
}

function exportToCSV() {
    db.ref('records').once('value').then(snapshot => {
        const data = snapshot.val(); if (!data) { alert("無紀錄"); return; }
        let csvContent = "班別,學號,分數,遊玩時間\n";
        for (let key in data) { const r = data[key]; csvContent += `${r.class},${r.number},${r.score},${r.timestamp}\n`; }
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
        link.download = `營養素大亂鬥_紀錄.csv`; link.click();
    });
}

// RPG 飄浮文字特效函數
function showFloatingText(text, color, elementId) {
    const target = document.getElementById(elementId);
    const floater = document.createElement('div');
    floater.className = 'floating-text';
    floater.style.color = color;
    floater.innerText = text;
    
    // 隨機一點左右偏移，讓數字不會全疊在一起
    const randomX = Math.floor(Math.random() * 60) - 30; 
    floater.style.left = `calc(50% + ${randomX}px)`;
    floater.style.top = '20%';
    
    target.appendChild(floater);
    
    // 1秒後動畫結束自動移除元素
    setTimeout(() => floater.remove(), 1000);
}
