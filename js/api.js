// ===== API 通訊模組 =====
const api = {
    // 通用請求函數
    async request(action, method = 'GET', data = null) {
        const password = localStorage.getItem(CONFIG.PASSWORD_KEY);
        
        if (!password) {
            throw new Error('未登入');
        }
        
        const url = `${CONFIG.API_URL}?action=${action}&password=${password}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && method === 'POST') {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (result.error === 'Unauthorized') {
                localStorage.removeItem(CONFIG.PASSWORD_KEY);
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
    
    // POST 請求
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
