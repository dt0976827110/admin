// ===== API 通訊模組 (簡化版 - 避免 CORS preflight) =====
const api = {
    // 通用請求函數
    async request(action, method = 'GET', data = null) {
        const password = sessionStorage.getItem(CONFIG.PASSWORD_KEY);
        
        if (!password) {
            throw new Error('未登入');
        }
        
        let url = `${CONFIG.API_URL}?action=${action}&password=${password}`;
        
        // 如果有資料,轉成 JSON 字串並放到 URL 參數
        if (data && method === 'POST') {
            url += `&data=${encodeURIComponent(JSON.stringify(data))}`;
        }
        
        try {
            // ✅ 關鍵: 只用 GET,不加 headers (避免觸發 CORS preflight)
            const response = await fetch(url, {
                method: 'GET'
            });
            
            const result = await response.json();
            
            if (result.error === 'Unauthorized') {
                sessionStorage.removeItem(CONFIG.PASSWORD_KEY);
                app.logout();
                throw new Error('認證失敗,請重新登入');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // GET 請求
    async get(action) {
        return await this.request(action, 'GET');
    },
    
    // POST 請求 (實際上也用 GET)
    async post(action, data) {
        return await this.request(action, 'POST', data);
    },
    
    // ===== 儀表板 =====
    async getDashboard() {
        return await this.get('getDashboard');
    },
    
    // ===== 會員管理 =====
    async getMembers() {
        return await this.get('getMembers');
    },
    
    async updateMember(data) {
        return await this.post('updateMember', data);
    },
    
    // ===== 紅包活動 =====
    async getEvent() {
        return await this.get('getEvent');
    },
    
    async updateEvent(data) {
        return await this.post('updateEvent', data);
    },
    
    async getRedPacketRecords(limit = 50) {
        return await this.get(`getRedPacketRecords&limit=${limit}`);
    },
    
    // ===== 自動回應 =====
    async getAutoReplies() {
        return await this.get('getAutoReplies');
    },
    
    async saveAutoReply(data) {
        return await this.post('saveAutoReply', data);
    },
    
    async deleteAutoReply(keyword) {
        return await this.post('deleteAutoReply', { keyword });
    },
    
    // ===== 今日折抵 =====
    async processDeduction(deductionList) {
        return await this.post('processDeduction', deductionList);
    }
};
