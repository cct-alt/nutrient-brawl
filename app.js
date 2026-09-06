window.onload = () => {
    const classSelect = document.getElementById('login-class');
    const deleteSelect = document.getElementById('delete-class');
    classSelect.innerHTML = '<option value="">選擇班別</option>';
    deleteSelect.innerHTML = '<option value="">選擇班別</option>';
    
    for (let i = 1; i <= 6; i++) {
        ['A', 'B', 'C', 'D'].forEach(c => { 
            const opt = `<option value="${i}${c}">${i}${c}</option>`;
            classSelect.innerHTML += opt; 
            deleteSelect.innerHTML += opt;
        });
    }
};

const firebaseConfig = { apiKey: "AIzaSyCdugk4Rv4RnuBnjwwGkIcjMSJ96gLAJdY", authDomain: "nutrient-brawl.firebaseapp.com", projectId: "nutrient-brawl", storageBucket: "nutrient-brawl.firebasestorage.app", appId: "1:764517744885:web:b3cba8b2662379f0a445bc", databaseURL: "https://nutrient-brawl-default-rtdb.firebaseio.com" };
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

// 🌟 單人模式 (改為 20 秒)
let hp = 500, bossHp = 1000, score = 0, combo = 0, currentQ = null, timer = null, timeLeft = 20;
function startSinglePlayer() { hp = 500; bossHp = 1000; score = 0; combo = 0; document.getElementById('boss-avatar').innerText = "👾"; updateStats(); showScreen('screen-single'); Swal.fire({ title: '病魔來襲！', text: '準備好你的營養素！', icon: 'warning', timer: 1500, showConfirmButton: false }).then(() => { nextQuestion(); }); }
function updateStats() { document.getElementById('player-hp').innerText = hp; document.getElementById('player-score').innerText = score; document.getElementById('boss-hp-text').innerText = bossHp; const hpPercent = Math.max(0, (bossHp / 1000) * 100); document.getElementById('boss-hp-bar').style.width = hpPercent + "%"; const comboEl = document.getElementById('combo-text'); const screen = document.getElementById('screen-single'); if (combo >= 3) { comboEl.style.display = 'block'; document.getElementById('combo-count').innerText = combo; screen.classList.add('combo-aura'); } else { comboEl.style.display = 'none'; screen.classList.remove('combo-aura'); } }
function nextQuestion() {
    clearInterval(timer); if (hp <= 0) { endGame("lose"); return; } if (bossHp <= 0) { endGame("win"); return; }
    document.getElementById('boss-avatar').innerText = "👾"; 
    const qIndex = Math.floor(Math.random() * questionsData.length); currentQ = questionsData[qIndex]; document.getElementById('boss-question').innerText = currentQ.q;
    const optionsArea = document.getElementById('options-area'); optionsArea.innerHTML = "";
    let ops = currentQ.options.map((opt, idx) => ({ text: opt, isCorrect: idx === 0 }));
    for (let i = ops.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ops[i], ops[j]] = [ops[j], ops[i]]; }
    ops.forEach((obj) => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.background = '#fff'; btn.style.color = '#333'; btn.style.border = '2px solid #ccc'; btn.innerText = obj.text; btn.onclick = () => checkAnswer(obj.isCorrect, btn); optionsArea.appendChild(btn); });
    
    // 🌟 設定每題 20 秒
    timeLeft = 20; document.getElementById('question-timer').innerText = timeLeft;
    timer = setInterval(() => { timeLeft--; document.getElementById('question-timer').innerText = timeLeft; if (timeLeft <= 0) { clearInterval(timer); hp -= 100; combo = 0; playerTakeDamage(); showFloatingText('-100', '#1976D2', 'screen-single'); optionsArea.innerHTML = "<h3 style='color:red;'>超時！病魔對你造成 100 傷害！</h3>"; setTimeout(nextQuestion, 1500); } }, 1000);
}
function checkAnswer(isCorrect, btnElement) {
    clearInterval(timer); const optionsArea = document.getElementById('options-area'); const bossContainer = document.getElementById('boss-container');
    if (isCorrect) { btnElement.style.background = '#4CAF50'; btnElement.style.color = 'white'; btnElement.style.transform = 'scale(1.05)'; combo++; let isCrit = combo >= 3; let dmg = isCrit ? 200 : 100; let basePoints = isCrit ? 200 : 100; let timeBonus = timeLeft * 10; bossHp -= dmg; score += (basePoints + timeBonus); document.getElementById('boss-avatar').innerText = "💥"; bossContainer.classList.add('shake-anim'); setTimeout(() => bossContainer.classList.remove('shake-anim'), 400); showFloatingText(`-${dmg}`, '#d32f2f', 'boss-container'); fireMagicAttack(); optionsArea.innerHTML += `<h3 style='color:green; margin:5px 0;'>命中！造成 ${dmg} 傷害！<br><span style='font-size:0.9rem; color:#FF9800;'>基礎 +${basePoints} | 極速加成 +${timeBonus}</span></h3>`; } 
    else { btnElement.style.background = '#f44336'; btnElement.style.color = 'white'; hp -= 100; combo = 0; playerTakeDamage(); showFloatingText('-100', '#1976D2', 'screen-single'); optionsArea.innerHTML += `<h3 style='color:red; margin:5px 0;'>答錯了！扣 100 滴血！</h3>`; }
    updateStats(); setTimeout(nextQuestion, 1500);
}
function playerTakeDamage() { updateStats(); const screen = document.getElementById('screen-single'); const avatar = document.getElementById('boss-avatar'); screen.classList.add('damage-flash'); avatar.innerText = "😈"; avatar.classList.add('monster-attack-anim'); screen.style.transform = "translate(10px, 10px)"; setTimeout(() => screen.style.transform = "translate(0, 0)", 100); setTimeout(() => { screen.classList.remove('damage-flash'); avatar.classList.remove('monster-attack-anim'); }, 500); }

function endGame(result) {
    clearInterval(timer); document.getElementById('screen-single').classList.remove('combo-aura');
    if (result === "win") {
        epicFireworks(); const bonus = hp * 2; score += bonus;
        Swal.fire({ title: '🎉 恭喜破關！', html: `成功擊敗病魔！<br>血量獎勵：+${bonus}分<br><b style="font-size:2rem; color:#FF5722;">最終總分：${score}</b>`, icon: 'success', confirmButtonText: '查看榮譽榜', confirmButtonColor: '#9C27B0', backdrop: `rgba(0,0,123,0.4)` })
        .then(() => { saveRecordAndGo('screen-leaderboard'); });
    } else {
        Swal.fire({ title: '💀 挑戰失敗...', html: `你被病魔打敗了<br><b style="font-size:1.5rem; color:#333;">最終總分：${score}</b><br>去溫習專區看看再來挑戰吧！`, icon: 'error', confirmButtonText: '返回主選單' })
        .then(() => { saveRecordAndGo('screen-menu'); });
    }
}
function saveRecordAndGo(targetScreen) {
    try { const recordRef = db.ref('records').push(); recordRef.set({ class: currentUser.class, number: currentUser.number, score: score, timestamp: new Date().toLocaleString('zh-HK') }).catch(err => console.log(err)); } catch (error) {}
    showScreen(targetScreen); if(targetScreen === 'screen-leaderboard') { loadLeaderboard(); }
}
function forceEndGame() { clearInterval(timer); document.getElementById('screen-single').classList.remove('combo-aura'); Swal.fire('逃離戰場', '本次分數不予記錄', 'info').then(() => showScreen('screen-menu')); }

// 🌟 雙人對戰模式 (改為 20 秒)
let p1Hp = 1000, p2Hp = 1000, multiTimer = null, multiTimeLeft = 20;
let p1Locked = false, p2Locked = false;
function startMultiPlayer() { p1Hp = 1000; p2Hp = 1000; updateMultiStats(); showScreen('screen-multi'); Swal.fire({ title: '⚔️ 雙人對戰', text: '請將 iPad 平放於桌面，兩人各佔一邊！', icon: 'info', timer: 2000, showConfirmButton: false }).then(() => nextMultiQuestion()); }
function updateMultiStats() { document.getElementById('p1-hp').innerText = p1Hp; document.getElementById('p2-hp').innerText = p2Hp; }
function nextMultiQuestion() {
    clearInterval(multiTimer); p1Locked = false; p2Locked = false;
    if (p1Hp <= 0 || p2Hp <= 0) { endMultiGame(); return; }
    const qIndex = Math.floor(Math.random() * questionsData.length); const q = questionsData[qIndex];
    document.getElementById('p1-question').innerText = q.q; document.getElementById('p2-question').innerText = q.q;
    let ops = q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === 0 }));
    for (let i = ops.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ops[i], ops[j]] = [ops[j], ops[i]]; }
    const p1Area = document.getElementById('p1-options'); p1Area.innerHTML = ""; const p2Area = document.getElementById('p2-options'); p2Area.innerHTML = "";
    ops.forEach((obj) => {
        const btn1 = document.createElement('button'); btn1.className = 'btn'; btn1.style.background = '#fff'; btn1.style.color = '#333'; btn1.style.border = '2px solid #ccc'; btn1.innerText = obj.text; btn1.onclick = () => handleMultiClick(1, obj.isCorrect, btn1); p1Area.appendChild(btn1);
        const btn2 = document.createElement('button'); btn2.className = 'btn'; btn2.style.background = '#fff'; btn2.style.color = '#333'; btn2.style.border = '2px solid #ccc'; btn2.innerText = obj.text; btn2.onclick = () => handleMultiClick(2, obj.isCorrect, btn2); p2Area.appendChild(btn2);
    });
    
    // 🌟 設定每題 20 秒
    multiTimeLeft = 20; document.getElementById('multi-timer').innerText = multiTimeLeft;
    multiTimer = setInterval(() => { multiTimeLeft--; document.getElementById('multi-timer').innerText = multiTimeLeft; if (multiTimeLeft <= 0) { clearInterval(multiTimer); p1Hp -= 50; p2Hp -= 50; updateMultiStats(); flashMultiDamage(1); flashMultiDamage(2); document.getElementById('p1-question').innerHTML = "<span style='color:red;'>超時！雙方各扣 50 血！</span>"; document.getElementById('p2-question').innerHTML = "<span style='color:red;'>超時！雙方各扣 50 血！</span>"; setTimeout(nextMultiQuestion, 1500); } }, 1000);
}
function handleMultiClick(playerNum, isCorrect, btnElement) {
    if (playerNum === 1 && p1Locked) return; if (playerNum === 2 && p2Locked) return;
    btnElement.style.background = isCorrect ? '#4CAF50' : '#f44336'; btnElement.style.color = 'white';
    if (isCorrect) {
        clearInterval(multiTimer); p1Locked = true; p2Locked = true; 
        if (playerNum === 1) { p2Hp -= 100; flashMultiDamage(2); showFloatingText('-100', '#d32f2f', 'p2-zone'); document.getElementById('p1-question').innerHTML = "<span style='color:green;'>✔️ 搶答成功！給予對手 100 傷害！</span>"; document.getElementById('p2-question').innerHTML = "<span style='color:red;'>❌ 對手搶答！你被扣血！</span>"; } 
        else { p1Hp -= 100; flashMultiDamage(1); showFloatingText('-100', '#d32f2f', 'p1-zone'); document.getElementById('p2-question').innerHTML = "<span style='color:green;'>✔️ 搶答成功！給予對手 100 傷害！</span>"; document.getElementById('p1-question').innerHTML = "<span style='color:red;'>❌ 對手搶答！你被扣血！</span>"; }
        updateMultiStats(); setTimeout(nextMultiQuestion, 1500);
    } else {
        if (playerNum === 1) { p1Hp -= 50; p1Locked = true; flashMultiDamage(1); showFloatingText('-50', '#1976D2', 'p1-zone'); document.getElementById('p1-question').innerText = "❌ 答錯扣 50 滴血！(等待對手)"; } 
        else { p2Hp -= 50; p2Locked = true; flashMultiDamage(2); showFloatingText('-50', '#1976D2', 'p2-zone'); document.getElementById('p2-question').innerText = "❌ 答錯扣 50 滴血！(等待對手)"; }
        updateMultiStats();
        if (p1Locked && p2Locked) { clearInterval(multiTimer); document.getElementById('p1-question').innerHTML = "<span style='color:red;'>雙方皆錯！換下一題！</span>"; document.getElementById('p2-question').innerHTML = "<span style='color:red;'>雙方皆錯！換下一題！</span>"; setTimeout(nextMultiQuestion, 1500); }
    }
}
function flashMultiDamage(playerNum) { const zone = document.getElementById(playerNum === 1 ? 'p1-zone' : 'p2-zone'); zone.classList.add('damage-flash'); zone.classList.add('shake-anim'); setTimeout(() => { zone.classList.remove('damage-flash'); zone.classList.remove('shake-anim'); }, 400); }
function endMultiGame() { clearInterval(multiTimer); epicFireworks(); let winnerText = ""; if (p1Hp <= 0 && p2Hp <= 0) winnerText = "平手！同歸於盡！"; else if (p2Hp <= 0) winnerText = "👑 玩家 1 (上方) 獲勝！"; else winnerText = "👑 玩家 2 (下方) 獲勝！"; Swal.fire({ title: '戰鬥結束', html: `<b style="font-size:2rem; color:#FF5722;">${winnerText}</b>`, icon: 'success', confirmButtonText: '返回主選單', backdrop: `rgba(0,0,123,0.4)` }).then(() => showScreen('screen-menu')); }
function forceEndMulti() { clearInterval(multiTimer); Swal.fire('逃離戰場', '結束雙人對戰', 'info').then(() => showScreen('screen-menu')); }

// 共用特效與後台
function showFloatingText(text, color, elementId) { const target = document.getElementById(elementId); const floater = document.createElement('div'); floater.className = 'floating-text'; floater.style.color = color; floater.innerText = text; const randomX = Math.floor(Math.random() * 80) - 40; floater.style.left = `calc(50% + ${randomX}px)`; floater.style.top = '10%'; target.appendChild(floater); setTimeout(() => floater.remove(), 1000); }
function fireMagicAttack() { confetti({ particleCount: 40, spread: 80, origin: { y: 0.8 }, colors: ['#FFC107', '#FF9800', '#FF5722'], shapes: ['star'], gravity: 0.5, scalar: 1.2 }); }
function epicFireworks() { var duration = 3 * 1000; var animationEnd = Date.now() + duration; var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; var interval = setInterval(function() { var timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) { return clearInterval(interval); } var particleCount = 50 * (timeLeft / duration); confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } })); }, 250); }

function loadRevision() { const container = document.getElementById('revision-content'); container.innerHTML = ""; revisionData.forEach(item => { const card = document.createElement('div'); card.className = 'flip-card'; card.onclick = () => card.classList.toggle('flipped'); card.innerHTML = `<div class="flip-card-inner"><div class="flip-card-front"><h3>🔍 ${item.name}</h3><p style="color:#666; font-size:0.9rem; margin-top:10px;">(點擊翻面)</p></div><div class="flip-card-back"><p><strong>🍎 來源：</strong>${item.sources}</p><p><strong>💪 功能：</strong>${item.func}</p><p><strong>⚠️ 缺乏症：</strong><span style="color:#d32f2f; font-weight:bold;">${item.deficiency}</span></p></div></div>`; container.appendChild(card); }); }
function checkTeacher() { Swal.fire({ title: '進入老師專區', input: 'password', inputPlaceholder: '請輸入密碼', showCancelButton: true, confirmButtonText: '登入', cancelButtonText: '取消' }).then((result) => { if (result.isConfirmed) { if (result.value === "123321") { showScreen('screen-teacher'); } else { Swal.fire('錯誤', '密碼不正確', 'error'); } } }); }

function loadLeaderboard() { 
    document.getElementById('lb-class-name').innerText = currentUser.class; 
    document.getElementById('class-leaderboard').innerHTML = "<p style='text-align:center;'>載入中...</p>"; document.getElementById('grade-leaderboard').innerHTML = "<p style='text-align:center;'>載入中...</p>"; 
    db.ref('records').once('value').then(snapshot => { 
        const data = snapshot.val(); 
        if (!data) { document.getElementById('class-leaderboard').innerHTML = "<p style='text-align:center;'>尚無紀錄</p>"; document.getElementById('grade-leaderboard').innerHTML = "<p style='text-align:center;'>尚無紀錄</p>"; return; } 
        const highestScores = {}; 
        for (let key in data) { const r = data[key]; const studentId = `${r.class}_${r.number}`; if (!highestScores[studentId] || r.score > highestScores[studentId].score) { highestScores[studentId] = r; } } 
        const allStudents = Object.values(highestScores).sort((a, b) => b.score - a.score); const classStudents = allStudents.filter(s => s.class === currentUser.class).slice(0, 10); const gradeStudents = allStudents.slice(0, 20); 
        const renderList = (arr, elementId) => { const container = document.getElementById(elementId); container.innerHTML = ""; arr.forEach((s, idx) => { let icon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `<span style="display:inline-block;width:24px;text-align:center;">${idx+1}</span>`; let topClass = idx <= 2 ? `top-${idx+1}` : ''; let isMeClass = (s.class === currentUser.class && s.number === currentUser.number) ? 'is-me' : ''; container.innerHTML += `<div class="rank-item ${topClass} ${isMeClass}"><div>${icon} &nbsp; <b>${s.class}</b>班 <b>${s.number}</b>號 ${isMeClass ? '(你)' : ''}</div><div style="font-weight:900; font-size:1.3rem;">${s.score} <span style="font-size:0.8rem; font-weight:normal;">分</span></div></div>`; }); }; 
        renderList(classStudents, 'class-leaderboard'); renderList(gradeStudents, 'grade-leaderboard'); 
    }).catch(err => { document.getElementById('class-leaderboard').innerHTML = "<p style='text-align:center; color:red;'>網路受阻，無法載入</p>"; document.getElementById('grade-leaderboard').innerHTML = "<p style='text-align:center; color:red;'>網路受阻，無法載入</p>"; }); 
}
function exportToCSV() { db.ref('records').once('value').then(snapshot => { const data = snapshot.val(); if (!data) { Swal.fire('提示', '目前無遊玩紀錄', 'info'); return; } let csvContent = "班別,學號,分數,遊玩時間\n"; for (let key in data) { const r = data[key]; csvContent += `${r.class},${r.number},${r.score},${r.timestamp}\n`; } const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `營養大亂鬥_紀錄.csv`; link.click(); Swal.fire('成功', '紀錄已下載', 'success'); }); }

// 🌟 升級版：老師一鍵刪除學生紀錄
function deleteRecord() {
    const dClass = document.getElementById('delete-class').value;
    const dNum = document.getElementById('delete-number').value;
    if (!dClass || !dNum) { Swal.fire('錯誤', '請選擇班別並輸入學號', 'error'); return; }

    Swal.fire({
        title: `確定要刪除 ${dClass}班 ${dNum}號 嗎？`, text: "刪除後將無法恢復！", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d32f2f', cancelButtonColor: '#757575',
        confirmButtonText: '確定刪除', cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({title: '刪除中...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
            
            db.ref('records').once('value').then(snapshot => {
                let deletePromises = [];
                let count = 0;
                snapshot.forEach(child => {
                    const data = child.val();
                    if (data.class === dClass && data.number === dNum) {
                        deletePromises.push(child.ref.remove());
                        count++;
                    }
                });

                Promise.all(deletePromises).then(() => {
                    if (count > 0) { Swal.fire('已刪除！', `成功刪除了 ${count} 筆遊玩紀錄。`, 'success'); } 
                    else { Swal.fire('找不到紀錄', '該學生目前沒有任何遊玩紀錄。', 'info'); }
                }).catch(err => { Swal.fire('錯誤', '刪除失敗，請檢查網路連線', 'error'); });
            });
        }
    });
}
