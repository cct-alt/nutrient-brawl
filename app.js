// 紀錄當前玩家的身分
let currentUser = {
    class: "",
    number: ""
};

// 畫面切換函數
function showScreen(screenId) {
    // 隱藏所有畫面
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    // 顯示目標畫面
    document.getElementById(screenId).classList.add('active');
}

// 登入功能
function login() {
    const classSelect = document.getElementById('login-class').value;
    const numberInput = document.getElementById('login-number').value;

    if (classSelect === "" || numberInput === "") {
        alert("同學，請選擇班別並輸入學號喔！");
        return;
    }

    currentUser.class = classSelect;
    currentUser.number = numberInput;

    // 更新主選單的歡迎文字
    document.getElementById('welcome-text').innerText = `歡迎！${classSelect}班 ${numberInput}號`;
    
    // 切換到主選單
    showScreen('screen-menu');
}

// 載入溫習專區資料
function loadRevision() {
    const container = document.getElementById('revision-content');
    container.innerHTML = ""; // 清空舊內容

    // revisionData 是來自 data.js 的資料
    revisionData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${item.name}</h3>
            <p><strong>🍎 來源：</strong>${item.sources}</p>
            <p><strong>💪 功能：</strong>${item.func}</p>
            <p><strong>⚠️ 缺乏症：</strong><span style="color:#d32f2f; font-weight:bold;">${item.deficiency}</span></p>
        `;
        container.appendChild(card);
    });
}

// 老師專區驗證
function checkTeacher() {
    const pwd = prompt("請輸入老師密碼：");
    if (pwd === "123321") {
        alert("登入成功！(老師後台會在下一階段完成接入)");
        // 未來這裡會切換到老師專區畫面
    } else if (pwd !== null) {
        alert("密碼錯誤！這不是給學生進來的地方喔！");
    }
}
