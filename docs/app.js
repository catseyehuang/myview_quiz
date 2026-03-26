// API 網址已移至 config.js 統一管理
// 請確保載入此腳本的 HTML 檔案，已先載入 config.js

// --- GET 請求範例 (取得所有單元) ---
document.getElementById("getBtn").addEventListener("click", () => {
  const resultDiv = document.getElementById("getResult");
  resultDiv.innerText = "載入中...";

  // 透過 URL 參數 ?action=... 來告訴 GAS 我們要執行的動作
  fetch(`${gasApiUrl}?action=getAvailableUnits`)
    .then(response => response.json())
    .then(res => {
      if (res.status === 'error') throw new Error(res.message);
      console.log("GET 成功:", res.data);
      // 將單元列表顯示出來
      const unitsList = res.data.map(u => `<li>${u.id} (${u.title}) - ${u.status}</li>`).join('');
      resultDiv.innerHTML = `<b>可用的單元:</b> <ul>${unitsList}</ul>`;
    })
    .catch(error => {
      console.error("GET 錯誤:", error);
      resultDiv.innerText = `發生錯誤: ${error.message}`;
    });
});

// --- POST 請求範例 (送出答案) ---
document.getElementById("postBtn").addEventListener("click", () => {
  const resultDiv = document.getElementById("postResult");
  resultDiv.innerText = "傳送中...";

  // 準備要傳給 GAS 的資料，外層要有 action 和 data
  const payload = {
    action: "submitAnswers",
    data: {
      name: "GitHub 訪客",
      unit: "Unit 1", // 假設我們正在測 Unit 1
      answers: ["A", "B", "C"] // 假設的答案
    }
  };

  fetch(gasApiUrl, {
    method: "POST",
    // GAS 處理 POST 請求時，如果用 'application/json' 會有預檢請求 (Preflight/OPTIONS) 問題
    // 實務上通常改用 'text/plain' 繞過 CORS 限制，GAS 端一樣用 JSON.parse 解析即可
    // 這是一個常見的 GAS CORS 解決方法
    headers: {
      "Content-Type": "text/plain;charset=utf-8", 
    },
    body: JSON.stringify(payload),
    // 如果你的 GAS 專案設定為允許所有人匿名存取，就不需要這個 redirect
    // 但如果遇到 CORS 或 redirect 問題，可以加上這個
    redirect: "follow"
  })
    .then(response => response.json())
    .then(res => {
      if (res.status === 'error') throw new Error(res.message);
      console.log("POST 成功:", res.data);
      const score = res.data.score;
      resultDiv.innerText = `送出成功！ 您的分數是: ${score}`;
    })
    .catch(error => {
      console.error("POST 錯誤:", error);
      resultDiv.innerText = `發生錯誤: ${error.message}`;
    });
});