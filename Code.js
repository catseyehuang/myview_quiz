// ==========================================
// ⚙️ 系統設定區
// ==========================================
// 如果您是從 Google Sheets 點擊「擴充功能 > Apps Script」建立此專案，這裡請保持空白 "" 即可。
// 如果您是另外建立的 GAS 專案，請將 Google Sheets 網址中的 ID 貼在這裡。
// (例如網址是 https://docs.google.com/spreadsheets/d/1A2B3C4D/edit，ID 就是 1A2B3C4D)
var SHEET_ID = "17ZmNltr4-FgsidlhqR9ForRJhxm4DKU8GcVsMd58jLI"; 

// 取得資料庫連線的共用函式
function getDB() {
  if (SHEET_ID === "") {
    return SpreadsheetApp.getActiveSpreadsheet();
  } else {
    return SpreadsheetApp.openById(SHEET_ID);
  }
}

// ==========================================
// 🌐 1. 網頁路由與初始化
// ==========================================
function doGet(e) {
  // 如果網址沒有帶 unit 參數，預設給 Unit 1 (或任何提示文字)
  var targetUnit = 'Unit 1';
  if (e && e.parameter && e.parameter.unit) {
    targetUnit = e.parameter.unit;
  }
  
  // 建立 HTML 模板，注意這裡的檔名必須跟你的 HTML 檔名一致 (例如 'Index')
  var template = HtmlService.createTemplateFromFile('Index');
  template.currentUnit = targetUnit; 
  
  return template.evaluate()
      .setTitle('🌟 MyView Online Quiz 🌟')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ==========================================
// 📚 2. 取得題目 (過濾正確答案)
// ==========================================
function getQuestions(unit) {
  try {
    var db = getDB();
    var sheet = db.getSheetByName('Questions');
    if (!sheet) throw new Error("Can't find the 'Questions' sheet");

  var data = sheet.getDataRange().getValues();
  var questions = [];

  // 從第 2 列開始跑迴圈 (跳過標題列)
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == unit) { // 找到符合 Unit 的題目
      var qType = data[i][1];
      var qText = data[i][2];
      
      var qData = {
        type: qType,
        question: qText
      };
      
      // 如果是選擇題，把 D 到 H 欄的選項塞進陣列
      if (qType === 'MCQ') {
        var options = [];
        if (data[i][3]) options.push(String(data[i][3]));
        if (data[i][4]) options.push(String(data[i][4]));
        if (data[i][5]) options.push(String(data[i][5]));
        if (data[i][6]) options.push(String(data[i][6]));
        if (data[i][7]) options.push(String(data[i][7]));
        qData.options = options;
      }
      
      questions.push(qData);
    }
  }
  return questions;
  } catch (error) {
    throw new Error("Fail to get questions:" + error.toString());
  }
}

// ==========================================
// 📝 3. 接收答案、批改與寫入成績 (含 LockService 防護)
// ==========================================
function submitAnswers(payload) {
  // 【安全機制】加入 LockService 防止全班同時交卷造成資料覆蓋
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 最多等待 10 秒排隊
  } catch (e) {
    throw new Error("System is currently busy, please wait a few seconds and try again!");
  }

  try {
    var db = getDB();
    var sheet = db.getSheetByName('Questions');
  var data = sheet.getDataRange().getValues();
  
  var correctAnswers = [];
  var questionsText = [];

    // 抓取真實答案
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == payload.unit) {
      correctAnswers.push(String(data[i][8]).trim()); // 第 I 欄是正確答案
      questionsText.push(data[i][2]);
    }
  }

  var score = 0;
  var details = [];
  // 計算一題幾分 (滿分 100)
  var pointsPerQ = 100 / correctAnswers.length;

  // 開始比對學生答案
  for (var j = 0; j < payload.answers.length; j++) {
    var studentAns = String(payload.answers[j] || "").trim();
    var correctAns = correctAnswers[j];
    
      // 【優化】進階容錯：轉小寫、去除標點符號、將多個連續空白轉為單一空白
      var cleanStudentAns = studentAns.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
      var cleanCorrectAns = String(correctAns).toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();

      var isCorrect = (cleanStudentAns === cleanCorrectAns);

      if (isCorrect) score += pointsPerQ;

    details.push({
      question: questionsText[j],
      studentAns: studentAns,
      correctAns: correctAns,
      correct: isCorrect
    });
  }

  // 分數四捨五入 (處理像是 33.333 的狀況)
  score = Math.round(score);
  if (score === 99) score = 100;

    // 寫入成績
    var scoresSheet = db.getSheetByName('Scores');
    if (!scoresSheet) throw new Error("Can't find the 'Scores' sheet");

  scoresSheet.appendRow([
    new Date(),               // Timestamp
    payload.unit,             // Unit
    payload.name,             // Student Name
    score,                    // Score
    JSON.stringify(payload.answers) // 將學生作答存成文字備查
  ]);

    // 取得最新排行榜
    var leaderboard = getLeaderboardInternal(payload.unit, db);

  // 回傳結果給前端
  return {
    score: score,
    details: details,
    leaderboard: leaderboard
  };
  } catch (error) {
    // 【防呆】錯誤捕捉回傳
    throw new Error("Fail to process scores:" + error.toString());
  } finally {
    // 無論成功失敗，都釋放鎖定
    lock.releaseLock();
  }
}

// ==========================================
// 🏆 4. 內部函式：計算排行榜
// ==========================================
function getLeaderboardInternal(unit, db) {
  var sheet = db.getSheetByName('Scores');
  var data = sheet.getDataRange().getValues();
  var records = [];

  // 抓出該單元的所有成績
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == unit) {
      records.push({
        name: String(data[i][2]),
        score: parseInt(data[i][3], 10)
      });
    }
  }

  // 依照分數從高到低排序
  records.sort(function(a, b) {
    return b.score - a.score;
  });

  // 去除重複名字 (只保留同一個人的最高分)
  var uniqueRecords = [];
  var namesSeen = {};
  for(var j = 0; j < records.length; j++) {
    if(!namesSeen[records[j].name]) {
      uniqueRecords.push(records[j]);
      namesSeen[records[j].name] = true;
    }
  }

  // 回傳前 5 名
  //return uniqueRecords.slice(0, 5);
  // 回傳全部(如果想要更多名次可以調整這裡)
    return uniqueRecords;
}

// ==========================================
// 📚 5. 取得現有單元列表 (支援 Draft/Publish 狀態)
// ==========================================
function getAvailableUnits() {
  try {
    var db = getDB(); 
    var unitsSheet = db.getSheetByName('Units');
    var uniqueUnits = [];

    // 如果有建立 Units 工作表，就從這裡讀取
    if (unitsSheet) {
      var data = unitsSheet.getDataRange().getValues();
      // 從第 2 列開始跑 (跳過標題列)
      for (var i = 1; i < data.length; i++) {
        var unitId = String(data[i][0]).trim();
        var unitTitle = String(data[i][1]).trim(); // B欄 Title
        var unitStatus = String(data[i][2]).trim(); // C欄 Status (Draft/Publish)
        
        if (unitId !== "") {
          uniqueUnits.push({
            id: unitId,
            title: unitTitle,
            status: unitStatus
          });
        }
      }
    } 
    // 如果未來不小心刪除了 Units 工作表，退回原本抓 Questions 的邏輯 (防呆)
    else {
      // 容錯：如果沒有 Units 表，退回舊版抓 Questions
      var qSheet = db.getSheetByName('Questions');
      var qData = qSheet.getDataRange().getValues();
      var unitsMap = {};
      for (var j = 1; j < qData.length; j++) {
        var uName = String(qData[j][0]).trim();
        if (uName !== "") unitsMap[uName] = true;
      }
      var keys = Object.keys(unitsMap);
      keys.sort(function(a, b) { return b.localeCompare(a); });
      for (var k = 0; k < keys.length; k++) {
        uniqueUnits.push({ id: keys[k], title: "", status: "Publish" });
      }
    }

    return uniqueUnits;
  } catch (error) {
    throw new Error("Fail to get Unit list:" + error.toString());
  }
}