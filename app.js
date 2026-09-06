// ===== 1. Firebase 初始化 =====
const firebaseConfig = {
    apiKey: "AIzaSyCdugk4Rv4RnuBnjwwGkIcjMSJ96gLAJdY", authDomain: "nutrient-brawl.firebaseapp.com",
    projectId: "nutrient-brawl", storageBucket: "nutrient-brawl.firebasestorage.app",
    appId: "1:764517744885:web:b3cba8b2662379f0a445bc", databaseURL: "https://nutrient-brawl-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

let currentUser = { class: "", number: "" };

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function login() {
    const cls = document.getElementById('login-class').value; const num = document.getElementById('login-number').value;
    if (!cls || !num) { Swal.fire({ icon: 'error', title: '等等！', text: '請選擇班別並輸入學號！', confirmButtonColor: '#4CAF50' }); return; }
    currentUser.class = cls; currentUser.number = num;
    document.getElementById('welcome-text').innerText = `歡迎！${cls}班 ${num}號`;
    showScreen('screen-menu');
}

// ===== 3. 單人遊戲核心 =====
let hp = 500, bossHp = 1000, score = 0, combo = 0;
let currentQ = null, timer = null, timeLeft = 10;

function startSinglePlayer() {
    hp = 500; bossHp = 1000; score = 0; combo = 0;
    document.getElementById('boss-avatar').innerText = "👾"; 
    updateStats(); showScreen('screen-single');
    Swal.fire({ title: '病魔來襲！', text: '準備好你的營養素！', icon: 'warning', timer: 1500, showConfirmButton: false }).then(() => { nextQuestion(); });
}

function updateStats() {
    document.getElementById('player-hp').innerText = hp; document.getElementById('player-score').innerText = score;
    document.getElementById('boss-hp-text').innerText = bossHp;
    const hpPercent = Math.max(0, (bossHp / 1000) * 100); document.getElementById('boss-hp-bar').style.width = hpPercent + "%";
    const comboEl = document.getElementById('combo-text'); const screen = document.getElementById('screen-single');
    if (combo >= 3) { comboEl.style.display = 'block'; document.getElementById('combo-count').innerText = combo; screen.classList.add('combo-aura'); } 
    else { comboEl.style.display = 'none'; screen.classList.remove('combo-aura'); }
}

function nextQuestion() {
    clearInterval(timer);
    if (hp <= 0) { endGame("lose"); return; }
    if (bossHp <= 0) { endGame("win"); return; }

    document.getElementById('boss-avatar').innerText = "👾"; 
    
    // 隨機抽題
    const qIndex = Math.floor(Math.random() * questionsData.length);
    currentQ = questionsData[qIndex];
    document.getElementById('boss-question').innerText = currentQ.q;

    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = "";
    
    // 🌟 核心升級：自動洗牌演算法 (Fisher-Yates Shuffle)
    // 我們約定題庫中 options[0] 永遠是正確答案，這樣你以後加題目會超方便
    let ops = currentQ.options.map((opt, idx) => ({ text: opt, isCorrect: idx === 0 }));
    for (let i = ops.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ops[i], ops[j]] = [ops[j], ops[i]]; // 交換位置
    }

    ops.forEach((obj) => {
        const btn = document.createElement('button');
        btn.className = 'btn'; btn.style.background = '#fff'; btn.style.color = '#333'; btn.style.border = '2px solid #ccc';
        btn.innerText = obj.text;
        btn.onclick = () => checkAnswer(obj.isCorrect, btn); // 傳入是否為正確答案
        optionsArea.appendChild(btn);
    });

    timeLeft = 10; document.getElementById('question-timer').innerText = timeLeft;
    timer = setInterval(() => {
        timeLeft--; document.getElementById('question-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer); hp -= 100; combo = 0; 
            playerTakeDamage(); 
            showFloatingText('-100', '#1976D2', 'screen-single');
            optionsArea.innerHTML = "<h3 style='color:red;'>超時！病魔對你造成 100 傷害！</h3>";
            setTimeout(nextQuestion, 1500);
        }
    }, 1000);
}

function checkAnswer(isCorrect, btnElement) {
    clearInterval(timer);
    const optionsArea = document.getElementById('options-area');
    const bossContainer = document.getElementById('boss-container');
    
    if (isCorrect) {
        btnElement.style.background = '#4CAF50'; btnElement.style.color = 'white'; btnElement.style.transform = 'scale(1.05)';
        combo++;
        let isCrit = combo >= 3;
        
        // 🌟 傷害下調：一般扣100，爆擊扣200
        let dmg = isCrit ? 200 : 100; 
        let basePoints = isCrit ? 200 : 100;
        let timeBonus = timeLeft * 10; 
        
        bossHp -= dmg; score += (basePoints + timeBonus); 
        document.getElementById('boss-avatar').innerText = "💥"; 
        bossContainer.classList.add('shake-anim'); setTimeout(() => bossContainer.classList.remove('shake-anim'), 400);

        showFloatingText(`-${dmg}`, '#d32f2f', 'boss-container'); fireMagicAttack();
        optionsArea.innerHTML += `<h3 style='color:green; line-height: 1.4;'>命中！造成 ${dmg} 傷害！<br><span style='font-size:1rem; color:#FF9800;'>基礎 +${basePoints} | 極速加成 +${timeBonus}</span></h3>`;
    } else {
        btnElement.style.background = '#f44336'; btnElement.style.color = 'white';
        hp -= 100; combo = 0;
        playerTakeDamage(); 
        showFloatingText('-100', '#1976D2', 'screen-single');
        optionsArea.innerHTML += `<h3 style='color:red;'>答錯了！病魔反擊，扣 100 滴血！</h3>`;
    }
    updateStats(); setTimeout(nextQuestion, 1500);
}

function showFloatingText(text, color, elementId) {
    const target = document.getElementById(elementId); const floater = document.createElement('div');
    floater.className = 'floating-text'; floater.style.color = color; floater.innerText = text;
    const randomX = Math.floor(Math.random() * 80) - 40; floater.style.left = `calc(50% + ${randomX}px)`; floater.style.top = '10%';
    target.appendChild(floater); setTimeout(() => floater.remove(), 1000);
}

// 🌟 加入怪物撲臉特效
function playerTakeDamage() {
    updateStats();
    const screen = document.getElementById('screen-single');
    const avatar = document.getElementById('boss-avatar');
    
    screen.classList.add('damage-flash');
    avatar.innerText = "😈"; 
    avatar.classList.add('monster-attack-anim'); // 觸發怪物撲過來的CSS動畫
    
    screen.style.transform = "translate(10px, 10px)";
    setTimeout(() => screen.style.transform = "translate(0, 0)", 100);
    
    setTimeout(() => {
        screen.classList.remove('damage-flash');
        avatar.classList.remove('monster-attack-anim');
    }, 500);
}

function fireMagicAttack() { confetti({ particleCount: 40, spread: 80, origin: { y: 0.8 }, colors: ['#FFC107', '#FF9800', '#FF5722'], shapes: ['star'], gravity: 0.5, scalar: 1.2 }); }
function epicFireworks() {
    var duration = 3 * 1000; var animationEnd = Date.now() + duration; var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    var interval = setInterval(function() { var timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) { return clearInterval(interval); } var particleCount = 50 * (timeLeft / duration); confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } })); }, 250);
}

function endGame(result) {
    clearInterval(timer); document.getElementById('screen-single').classList.remove('combo-aura');
    if (result === "win") {
        epicFireworks(); const bonus = hp * 2; score += bonus;
        Swal.fire({ title: '🎉 恭喜破關！', html: `成功擊敗病魔！<br>血量獎勵：+${bonus}分<br><b style="font-size:2rem; color:#FF5722;">最終總分：${score}</b>`, icon: 'success', confirmButtonText: '查看榮譽榜', confirmButtonColor: '#9C27B0', backdrop: `rgba(0,0,123,0.4)` }).then(() => { saveRecordAndGo('screen-leaderboard'); loadLeaderboard(); });
    } else {
        Swal.fire({ title: '💀 挑戰失敗...', html: `你被病魔打敗了<br><b style="font-size:1.5rem; color:#333;">最終總分：${score}</b><br>去溫習專區看看再來挑戰吧！`, icon: 'error', confirmButtonText: '返回主選單' }).then(() => { saveRecordAndGo('screen-menu'); });
    }
}
function saveRecordAndGo(targetScreen) { const recordRef = db.ref('records').push(); recordRef.set({ class: currentUser.class, number: currentUser.number, score: score, timestamp: new Date().toLocaleString('zh-HK') }); showScreen(targetScreen); }
function forceEndGame() { clearInterval(timer); document.getElementById('screen-single').classList.remove('combo-aura'); Swal.fire('逃離戰場', '本次分數不予記錄', 'info').then(() => showScreen('screen-menu')); }

// ===== 4. 溫習、老師與排行榜 =====
function loadRevision() { const container = document.getElementById('revision-content'); container.innerHTML = ""; revisionData.forEach(item => { const card = document.createElement('div'); card.className = 'card'; card.innerHTML = `<h3>${item.name}</h3><p><strong>🍎 來源：</strong>${item.sources}</p><p><strong>💪 功能：</strong>${item.func}</p><p><strong>⚠️ 缺乏症：</strong><span style="color:#d32f2f; font-weight:bold;">${item.deficiency}</span></p>`; container.appendChild(card); }); }
function checkTeacher() { Swal.fire({ title: '進入老師專區', input: 'password', inputPlaceholder: '請輸入密碼', showCancelButton: true, confirmButtonText: '登入', cancelButtonText: '取消' }).then((result) => { if (result.isConfirmed) { if (result.value === "123321") { showScreen('screen-teacher'); } else { Swal.fire('錯誤', '密碼不正確', 'error'); } } }); }
function loadLeaderboard() {
    document.getElementById('lb-class-name').innerText = currentUser.class; document.getElementById('class-leaderboard').innerHTML = "載入中..."; document.getElementById('grade-leaderboard').innerHTML = "載入中...";
    db.ref('records').once('value').then(snapshot => {
        const data = snapshot.val(); if (!data) return; const highestScores = {};
        for (let key in data) { const r = data[key]; const studentId = `${r.class}_${r.number}`; if (!highestScores[studentId] || r.score > highestScores[studentId].score) { highestScores[studentId] = r; } }
        const allStudents = Object.values(highestScores).sort((a, b) => b.score - a.score); const classStudents = allStudents.filter(s => s.class === currentUser.class).slice(0, 10); const gradeStudents = allStudents.slice(0, 20);
        const renderList = (arr, elementId) => { const ul = document.getElementById(elementId); ul.innerHTML = ""; arr.forEach((s, idx) => { ul.innerHTML += `<li style="font-size:1.2rem; margin:5px 0;"><strong>第 ${idx+1} 名:</strong> ${s.class}班 ${s.number}號 - <span style="color:#FF5722; font-weight:bold;">${s.score}分</span></li>`; }); };
        renderList(classStudents, 'class-leaderboard'); renderList(gradeStudents, 'grade-leaderboard');
    });
}
function exportToCSV() { db.ref('records').once('value').then(snapshot => { const data = snapshot.val(); if (!data) { Swal.fire('提示', '目前無遊玩紀錄', 'info'); return; } let csvContent = "班別,學號,分數,遊玩時間\n"; for (let key in data) { const r = data[key]; csvContent += `${r.class},${r.number},${r.score},${r.timestamp}\n`; } const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `營養大亂鬥_紀錄.csv`; link.click(); Swal.fire('成功', '紀錄已下載', 'success'); }); }
