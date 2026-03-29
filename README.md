# 🌟 MyView Online Quiz 🌟

Web URL: https://catseyehuang.github.io/myview_quiz/



這是一個專為班級設計的線上測驗系統，結合了 Google Apps Script 的強大後端處理能力和現代化的前端介面。學生可以透過簡單的介面選擇姓名、測驗單元，並以有趣的閃卡模式進行作答。老師則可以透過 Google Sheets 輕鬆管理題目與查看成績。

![Quiz Screenshot](https://github.com/catseyehuang/myview_quiz/raw/main/docs/screenshot.png) 
*(建議您截一張專案的實際畫面，並替換此處的圖片連結)*

---

## 🚀 主要功能

*   **雙重部署架構**:
    *   **後端**: 使用 Google Apps Script (GAS) 作為 Web App API，處理所有商業邏輯。
    *   **前端**: 部署在 GitHub Pages 的純靜態 HTML/CSS/JS，透過 `fetch` 與後端 API 溝通。
    *   GAS 原生網址也可直接訪問，呈現一個備用版本的介面。
*   **友善的使用者介面**:
    *   使用 Tailwind CSS 打造的現代化、響應式設計。
    *   透過姓名點選按鈕登入，無需複雜的帳號密碼。
    *   「閃卡」模式一次顯示一題，讓學生專注作答。
    *   支援鍵盤 `Enter` 鍵快速跳至下一題或提交。
*   **動態題目管理**:
    *   所有題目、單元列表及狀態（發布/草稿）皆由 Google Sheets 管理。
    *   支援「選擇題 (MCQ)」與「填空題 (Fill)」兩種題型。
*   **即時回饋與排行榜**:
    *   提交後立即計分，並顯示活潑的結果頁面與 confetti 慶祝動畫。
    *   提供「題目回顧 (Review)」功能，答錯的題目會直接顯示正確答案。
    *   自動產生該單元的「排行榜 (Leaderboard)」，增加學習動力。
*   **權限管理**:
    *   特定使用者（如老師 `00-Tr. Adam`）可以看到狀態為「草稿 (Draft)」的未發布單元。
*   **穩定的後端**:
    *   使用 `LockService` 防止多位學生同時提交答案時發生資料寫入衝突。
    *   所有成績、作答時間與學生答案都會被安全地記錄在 Google Sheets 中。
*   **易於開發**:
    *   前端程式碼包含本地測試資料，在無法連接後端 API 時會自動切換，方便 UI 開發與調試。

---

## 🛠️ 技術棧

*   **後端**: Google Apps Script
*   **資料庫**: Google Sheets
*   **前端**: HTML5, JavaScript (ES6), Tailwind CSS
*   **部署**:
    *   Google Apps Script Web App
    *   GitHub Pages

---

## ⚙️ 安裝與部署指南

請依照以下三個主要步驟來完成專案的部署。

### 第一步：設定 Google Sheet (資料庫)

1.  **建立 Google Sheet**: 建立一份新的 Google Sheet。
2.  **取得試算表 ID**: 複製網址中的 ID。例如，如果網址是 `https://docs.google.com/spreadsheets/d/1A2B3C4D_.../edit`，則 ID 為 `1A2B3C4D_...`。
3.  **建立工作表**: 在這份 Google Sheet 中建立三個工作表，並確保名稱**完全符合**以下要求：
    *   `Units`: 用於管理測驗單元。
        *   `A欄`: **ID** (單元編號，例如 `U1.1.1`)
        *   `B欄`: **Title** (單元標題，例如 `The Solar System`)
        *   `C欄`: **Status** (狀態，填寫 `Publish` 或 `Draft`)
    *   `Questions`: 用於存放所有題目。
        *   `A欄`: **Unit** (對應到 `Units` 工作表的 ID)
        *   `B欄`: **Type** (題型，填寫 `MCQ` 或 `Fill`)
        *   `C欄`: **Question** (題目文字)
        *   `D欄` 到 `H欄`: **Option1** 到 **Option5** (選擇題的選項)
        *   `I欄`: **CorrectAnswer** (該題的正確答案)
    *   `Scores`: 用於自動記錄學生分數。
        *   `A欄`: **Timestamp** (提交時間)
        *   `B欄`: **Unit** (測驗單元)
        *   `C欄`: **Name** (學生姓名)
        *   `D欄`: **Score** (分數)
        *   `E欄`: **TimeTaken** (作答時間/秒)
        *   `F欄`: **Answers** (學生答案的 JSON 字串)

### 第二步：設定 Google Apps Script (後端)

1.  **建立 Apps Script**:
    *   打開剛剛建立的 Google Sheet。
    *   點擊頂部選單的「擴充功能」 > 「Apps Script」。
2.  **貼上後端程式碼**:
    *   將專案中 `Code.js` 的所有內容，複製並貼到 Apps Script 編輯器中，覆蓋掉預設的程式碼。
3.  **更新 Sheet ID**:
    *   在 `Code.js` 的最上方，找到 `var SHEET_ID = "..."` 這一行。
    *   將你在第一步中取得的 Google Sheet ID 貼到引號中。
4.  **部署為 Web App**:
    *   點擊編輯器右上角的「**部署**」 > 「**新增部署作業**」。
    *   在「選取類型」旁點擊齒輪圖示，選擇「**網頁應用程式**」。
    *   在「說明」欄位中輸入一個版本描述（例如 `v1.0.0`）。
    *   將「執行身分」設定為「**我**」。
    *   將「誰可以存取」設定為「**任何人**」。
    *   點擊「**部署**」。
    *   **重要**: 授權存取權限後，複製產生的「**網頁應用程式網址**」。這個網址將在下一步用到。

### 第三步：設定 GitHub Pages (前端)

1.  **更新 API 網址**:
    *   打開專案中的 `docs/index.html` 檔案。
    *   在 `<script>` 區塊中，找到 `const gasApiUrl = "..."` 這一行。
    *   將上一步複製的 GAS **網頁應用程式網址**貼到引號中。
2.  **設定 GitHub Repository**:
    *   將整個專案推送到您的 GitHub Repository。
    *   進入該 Repository 的 **Settings** > **Pages**。
    *   在 "Build and deployment" 下，將 "Source" 設定為 **Deploy from a branch**。
    *   將 "Branch" 設定為您的主要分支 (通常是 `main`)，並將資料夾設定為 `/docs`。
    *   點擊 **Save**。
3.  **完成**: 等待幾分鐘後，您的線上測驗系統就可以透過 `https://<你的GitHub用戶名>.github.io/<你的Repository名稱>/` 訪問了！

---


## 🎨 前端開發

本專案的前端檔案 (`docs/index.html`) 是一個純粹的靜態頁面，它透過 `fetch` 呼叫您在 `<script>` 區塊中設定的 `gasApiUrl` 變數來與後端 API 進行所有資料交換。

若要在本地進行開發與測試，您需要一個本地網頁伺服器。您可以使用像 VS Code 的 `Live Server` 擴充功能，或任何其他本地伺服器工具來運行 `docs` 資料夾。專案中的 `.vscode/launch.json` 已包含一個使用 `localhost:8080` 進行偵錯的範例設定。

---
&copy; 2026 MyView Online Quiz.

