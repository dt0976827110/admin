// ===== API 設定 =====
const CONFIG = {
    // ⚠️ 請填入你的 GAS Web App URL
    API_URL: 'https://script.google.com/macros/s/AKfycbzj_V9ywaB7S3CBLinOcWOpxB-9-UM7VnWs7e_v5LtnEbAr9OjAzgdmf0yNg8oiwcbU/exec',
    
    // ✅ 密碼留空!改為每次登入時手動輸入
    PASSWORD: '',
    
    // Sheet ID
    SHEET_ID: '1K_a9KEizA7zBL9F6Y-DkJCa5QfrRuoTKZdUzLvfYnoo',
    
    // 本地存儲 key
    STORAGE_KEY: 'line_member_pwa',
    PASSWORD_KEY: 'line_member_pwd'
};

// 使用說明:
// 1. 只需要填入 API_URL (GAS 部署後的網址)
// 2. PASSWORD 保持空字串
// 3. 每次開啟 PWA 都需要輸入密碼
// 4. 這樣 GitHub 上就看不到你的密碼了!
