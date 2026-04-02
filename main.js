
// ========== config.js ==========
// ===== API 設定 =====
const CONFIG = {
    // ⚠️ 請填入你的 GAS Web App URL
    API_URL: 'https://script.google.com/macros/s/AKfycbzj_V9ywaB7S3CBLinOcWOpxB-9-UM7VnWs7e_v5LtnEbAr9OjAzgdmf0yNg8oiwcbU/exec',
    
    // ⚠️ 請填入你設定的管理密碼
    PASSWORD: 'aa8888',
    
    // Sheet ID (已從你的程式碼中取得)
    SHEET_ID: '1K_a9KEizA7zBL9F6Y-DkJCa5QfrRuoTKZdUzLvfYnoo',
    
    // 本地存儲 key
    STORAGE_KEY: 'line_member_pwa',
    PASSWORD_KEY: 'line_member_pwd'
};

// 範例:
// API_URL: 'https://script.google.com/macros/s/AKfycbxxx.../exec'
// PASSWORD: 'my_secure_password_123'


// ========== api.js ==========
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


// ========== app.js ==========
// ===== 主應用程式 =====
const app = {
    currentPage: 'dashboard',
    
    // 初始化
    init() {
        // 檢查登入狀態
        const password = localStorage.getItem(CONFIG.PASSWORD_KEY);
        if (password) {
            this.showApp();
            this.navigateTo('dashboard');
        } else {
            this.showLogin();
        }
        
        // 登入表單事件
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // 會員搜尋事件
        document.getElementById('memberSearch').addEventListener('input', (e) => {
            members.search(e.target.value);
        });
    },
    
    // 登入
    async login() {
        const password = document.getElementById('passwordInput').value;
        const errorEl = document.getElementById('loginError');
        
        // 暫存密碼
        localStorage.setItem(CONFIG.PASSWORD_KEY, password);
        
        try {
            // 測試 API 連線
            const result = await api.getDashboard();
            
            if (result.success) {
                errorEl.textContent = '';
                this.showApp();
                this.navigateTo('dashboard');
                this.showToast('登入成功', 'success');
            } else {
                throw new Error('登入失敗');
            }
        } catch (error) {
            localStorage.removeItem(CONFIG.PASSWORD_KEY);
            errorEl.textContent = '密碼錯誤或無法連接伺服器';
            this.showToast('登入失敗', 'error');
        }
    },
    
    // 登出
    logout() {
        if (confirm('確定要登出嗎?')) {
            localStorage.removeItem(CONFIG.PASSWORD_KEY);
            this.showLogin();
            this.showToast('已登出', 'info');
        }
    },
    
    // 顯示登入頁
    showLogin() {
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('passwordInput').value = '';
    },
    
    // 顯示應用程式
    showApp() {
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('appContainer').style.display = 'block';
    },
    
    // 頁面導航
    navigateTo(page) {
        // 隱藏所有頁面
        document.querySelectorAll('#appContainer .page').forEach(p => {
            p.classList.remove('active');
        });
        
        // 顯示目標頁面
        document.getElementById(`${page}Page`).classList.add('active');
        
        // 更新導航按鈕狀態
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
        
        // 記錄當前頁面
        this.currentPage = page;
        
        // 載入頁面資料
        this.loadPageData(page);
    },
    
    // 載入頁面資料
    async loadPageData(page) {
        switch(page) {
            case 'dashboard':
                await dashboard.load();
                break;
            case 'members':
                await members.load();
                break;
            case 'redpacket':
                await redpacket.load();
                break;
            case 'autoreply':
                await autoreply.load();
                break;
        }
    },
    
    // Toast 通知
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },
    
    // 顯示 Modal
    showModal(modalId) {
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    // 隱藏 Modal
    hideModal(modalId) {
        document.getElementById('modalOverlay').classList.remove('active');
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
    },
    
    // 格式化金額
    formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0
        }).format(amount);
    },
    
    // 格式化時間
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 格式化相對時間
    formatRelativeTime(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '剛剛';
        if (minutes < 60) return `${minutes}分鐘前`;
        if (hours < 24) return `${hours}小時前`;
        if (days < 7) return `${days}天前`;
        return this.formatDateTime(dateStr);
    },
    
    // 複製到剪貼簿
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('已複製到剪貼簿', 'success');
        } catch (err) {
            this.showToast('複製失敗', 'error');
        }
    }
};

// Modal 點擊遮罩關閉
document.getElementById('modalOverlay').addEventListener('click', () => {
    document.querySelectorAll('.modal.active').forEach(modal => {
        const modalId = modal.id;
        if (modalId === 'memberModal') {
            members.closeModal();
        } else if (modalId === 'replyModal') {
            autoreply.closeModal();
        }
    });
});

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});


// ========== dashboard.js ==========
// ===== 儀表板模組 =====
const dashboard = {
    data: null,
    
    // 載入儀表板資料
    async load() {
        try {
            // 載入統計資料
            const result = await api.getDashboard();
            
            if (result.success) {
                this.data = result.data;
                this.render();
            }
            
            // 載入近期紅包記錄
            await this.loadRecentActivity();
            
        } catch (error) {
            console.error('載入儀表板失敗:', error);
            app.showToast('載入失敗', 'error');
        }
    },
    
    // 渲染統計卡片
    render() {
        if (!this.data) return;
        
        document.getElementById('totalMembers').textContent = 
            this.data.totalMembers + ' 人';
        
        document.getElementById('totalBalance').textContent = 
            app.formatCurrency(this.data.totalBalance);
        
        document.getElementById('todayRedPackets').textContent = 
            this.data.todayRedPackets + ' 人';
        
        document.getElementById('autoReplyCount').textContent = 
            this.data.autoReplyCount + ' 組';
    },
    
    // 載入近期動態
    async loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        
        try {
            const result = await api.getRedPacketRecords(10);
            
            if (result.success && result.data.length > 0) {
                container.innerHTML = result.data.map(record => `
                    <div class="activity-item">
                        <div class="activity-icon">🧧</div>
                        <div class="activity-info">
                            <div class="activity-title">${record.name} 領取 ${record.eventName}</div>
                            <div class="activity-time">${app.formatRelativeTime(record.time)}</div>
                        </div>
                        <div class="activity-amount">+${record.amount}</div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="loading">暫無動態記錄</div>';
            }
        } catch (error) {
            console.error('載入近期動態失敗:', error);
            container.innerHTML = '<div class="loading">載入失敗</div>';
        }
    }
};


// ========== members.js ==========
// ===== 會員管理模組 =====
const members = {
    allMembers: [],
    filteredMembers: [],
    currentMember: null,
    originalBalance: 0,
    balanceChange: 0,
    
    // 載入會員列表
    async load() {
        const container = document.getElementById('membersList');
        container.innerHTML = '<div class="loading">載入中...</div>';
        
        try {
            const result = await api.getMembers();
            
            if (result.success) {
                this.allMembers = result.data;
                this.filteredMembers = [...this.allMembers];
                this.render();
            }
        } catch (error) {
            console.error('載入會員失敗:', error);
            container.innerHTML = '<div class="loading">載入失敗</div>';
            app.showToast('載入會員失敗', 'error');
        }
    },
    
    // 重新載入
    async refresh() {
        app.showToast('重新載入中...', 'info');
        await this.load();
    },
    
    // 搜尋會員
    search(keyword) {
        if (!keyword.trim()) {
            this.filteredMembers = [...this.allMembers];
        } else {
            const lowerKeyword = keyword.toLowerCase();
            this.filteredMembers = this.allMembers.filter(member => 
                member.id.toLowerCase().includes(lowerKeyword) ||
                member.name.toLowerCase().includes(lowerKeyword) ||
                (member.lineUid && member.lineUid.toLowerCase().includes(lowerKeyword))
            );
        }
        this.render();
    },
    
    // 渲染會員列表
    render() {
        const container = document.getElementById('membersList');
        
        if (this.filteredMembers.length === 0) {
            container.innerHTML = '<div class="loading">找不到符合的會員</div>';
            return;
        }
        
        container.innerHTML = this.filteredMembers.map(member => `
            <div class="member-card" onclick="members.showEditModal('${member.id}')">
                <div class="member-header">
                    <div class="member-id">${member.id}</div>
                    <div class="member-status ${member.status === '啟用' ? 'active' : 'inactive'}">
                        ${member.status || '未知'}
                    </div>
                </div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-balance">${app.formatCurrency(member.balance || 0)}</div>
                </div>
            </div>
        `).join('');
    },
    
    // 顯示編輯 Modal
    showEditModal(memberId) {
        this.currentMember = this.allMembers.find(m => m.id === memberId);
        if (!this.currentMember) return;
        
        this.originalBalance = this.currentMember.balance || 0;
        this.balanceChange = 0;
        
        document.getElementById('modalMemberId').textContent = this.currentMember.id;
        document.getElementById('modalMemberName').textContent = this.currentMember.name;
        document.getElementById('modalMemberUid').textContent = this.currentMember.lineUid || '-';
        document.getElementById('modalBalance').value = this.originalBalance;
        document.getElementById('modalStatus').value = this.currentMember.status || '啟用';
        document.getElementById('modalNote').value = this.currentMember.note || '';
        document.getElementById('customAdjust').value = '';
        
        // 點擊 UID 複製
        document.getElementById('modalMemberUid').onclick = () => {
            if (this.currentMember.lineUid) {
                app.copyToClipboard(this.currentMember.lineUid);
            }
        };
        
        app.showModal('memberModal');
    },
    
    // 關閉 Modal
    closeModal() {
        app.hideModal('memberModal');
        this.currentMember = null;
        this.balanceChange = 0;
    },
    
    // 調整餘額
    adjustBalance(amount) {
        this.balanceChange += amount;
        const newBalance = this.originalBalance + this.balanceChange;
        document.getElementById('modalBalance').value = newBalance;
    },
    
    // 套用自訂調整
    applyCustomAdjust() {
        const customAmount = parseInt(document.getElementById('customAdjust').value);
        if (isNaN(customAmount)) {
            app.showToast('請輸入有效數字', 'warning');
            return;
        }
        this.adjustBalance(customAmount);
        document.getElementById('customAdjust').value = '';
    },
    
    // 儲存會員
    async saveMember() {
        if (!this.currentMember) return;
        
        const newBalance = parseInt(document.getElementById('modalBalance').value);
        const status = document.getElementById('modalStatus').value;
        const note = document.getElementById('modalNote').value;
        
        // 確認大額調整
        if (Math.abs(this.balanceChange) >= 10000) {
            if (!confirm(`確定要調整 ${this.balanceChange >= 0 ? '+' : ''}${this.balanceChange} 元嗎?`)) {
                return;
            }
        }
        
        try {
            const data = {
                memberId: this.currentMember.id,
                balanceChange: this.balanceChange,
                status: status,
                note: note
            };
            
            const result = await api.updateMember(data);
            
            if (result.success) {
                app.showToast('儲存成功', 'success');
                this.closeModal();
                
                // 更新本地資料
                const member = this.allMembers.find(m => m.id === this.currentMember.id);
                if (member) {
                    member.balance = newBalance;
                    member.status = status;
                    member.note = note;
                }
                
                this.render();
            } else {
                app.showToast(result.error || '儲存失敗', 'error');
            }
        } catch (error) {
            console.error('儲存會員失敗:', error);
            app.showToast('儲存失敗', 'error');
        }
    }
};


// ========== deduction.js ==========
// ===== 今日折抵模組 =====
const deduction = {
    parsedData: [],
    membersMap: {},
    
    // 解析資料
    async parseData() {
        const input = document.getElementById('deductionInput').value.trim();
        
        if (!input) {
            app.showToast('請貼上折抵資料', 'warning');
            return;
        }
        
        // 載入會員資料(用於驗證)
        await this.loadMembers();
        
        this.parsedData = [];
        const lines = input.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // 支援多種分隔符: Tab, 逗號, 空格
            let parts = trimmed.split(/[\t,\s]+/);
            
            if (parts.length < 2) continue;
            
            const account = parts[0].trim();
            const fee = parseFloat(parts[1]) || 0;
            
            if (!account || fee <= 0) continue;
            
            const member = this.membersMap[account];
            
            this.parsedData.push({
                account: account,
                fee: fee,
                member: member,
                canDeduct: member ? Math.min(member.balance, fee) : 0,
                remaining: member ? member.balance - Math.min(member.balance, fee) : 0,
                status: member ? (member.balance >= fee ? 'success' : 'warning') : 'error'
            });
        }
        
        if (this.parsedData.length === 0) {
            app.showToast('未找到有效資料', 'warning');
            return;
        }
        
        this.showPreview();
    },
    
    // 載入會員資料
    async loadMembers() {
        try {
            const result = await api.getMembers();
            if (result.success) {
                this.membersMap = {};
                result.data.forEach(member => {
                    this.membersMap[member.id] = {
                        id: member.id,
                        name: member.name,
                        balance: member.balance || 0,
                        lineUid: member.lineUid
                    };
                });
            }
        } catch (error) {
            console.error('載入會員資料失敗:', error);
        }
    },
    
    // 顯示預覽
    showPreview() {
        const previewDiv = document.getElementById('deductionPreview');
        const tableDiv = document.getElementById('previewTable');
        
        let html = '<div class="preview-table"><table>';
        html += '<thead><tr>';
        html += '<th>帳號</th>';
        html += '<th>手續費</th>';
        html += '<th>會員餘額</th>';
        html += '<th>可扣抵</th>';
        html += '<th>剩餘</th>';
        html += '<th>狀態</th>';
        html += '</tr></thead><tbody>';
        
        this.parsedData.forEach(item => {
            const statusText = {
                'success': '✅ 正常',
                'warning': '⚠️ 餘額不足',
                'error': '❌ 未綁定'
            };
            
            html += `<tr class="${item.status}">`;
            html += `<td>${item.account}</td>`;
            html += `<td>${item.fee}</td>`;
            html += `<td>${item.member ? item.member.balance : '-'}</td>`;
            html += `<td>${item.canDeduct}</td>`;
            html += `<td>${item.member ? item.remaining : '-'}</td>`;
            html += `<td>${statusText[item.status]}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        tableDiv.innerHTML = html;
        previewDiv.style.display = 'block';
        
        // 滾動到預覽區
        previewDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    
    // 清除預覽
    clearPreview() {
        document.getElementById('deductionInput').value = '';
        document.getElementById('deductionPreview').style.display = 'none';
        document.getElementById('deductionResult').style.display = 'none';
        this.parsedData = [];
    },
    
    // 執行折抵
    async execute() {
        if (this.parsedData.length === 0) {
            app.showToast('沒有資料可執行', 'warning');
            return;
        }
        
        // 確認執行
        const totalAmount = this.parsedData.reduce((sum, item) => sum + item.canDeduct, 0);
        const confirmMsg = `確定要執行折抵嗎?\n\n` +
                          `共 ${this.parsedData.length} 筆\n` +
                          `總扣抵金額: ${app.formatCurrency(totalAmount)}`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        try {
            app.showToast('執行中...', 'info');
            
            // 準備資料
            const deductionList = this.parsedData
                .filter(item => item.member) // 只處理有綁定的會員
                .map(item => ({
                    account: item.account,
                    fee: item.fee
                }));
            
            const result = await api.processDeduction(deductionList);
            
            if (result.success) {
                this.showResult(result.results);
                app.showToast('執行成功', 'success');
            } else {
                app.showToast(result.error || '執行失敗', 'error');
            }
        } catch (error) {
            console.error('執行折抵失敗:', error);
            app.showToast('執行失敗', 'error');
        }
    },
    
    // 顯示執行結果
    showResult(results) {
        const resultDiv = document.getElementById('deductionResult');
        const tableDiv = document.getElementById('resultTable');
        
        let html = '<div class="preview-table"><table>';
        html += '<thead><tr>';
        html += '<th>帳號</th>';
        html += '<th>扣抵金額</th>';
        html += '<th>剩餘餘額</th>';
        html += '<th>狀態</th>';
        html += '</tr></thead><tbody>';
        
        results.forEach(item => {
            html += `<tr class="${item.success ? 'success' : 'error'}">`;
            html += `<td>${item.account}</td>`;
            html += `<td>${item.deducted || '-'}</td>`;
            html += `<td>${item.newBalance !== undefined ? item.newBalance : '-'}</td>`;
            html += `<td>${item.success ? '✅ 成功' : '❌ ' + (item.error || '失敗')}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        tableDiv.innerHTML = html;
        resultDiv.style.display = 'block';
        
        // 清空輸入框
        document.getElementById('deductionInput').value = '';
        document.getElementById('deductionPreview').style.display = 'none';
        
        // 滾動到結果區
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};


// ========== redpacket.js ==========
// ===== 紅包活動模組 =====
const redpacket = {
    currentEvent: null,
    records: [],
    
    // 載入紅包活動資料
    async load() {
        try {
            // 載入活動設定
            const eventResult = await api.getEvent();
            if (eventResult.success && eventResult.data) {
                this.currentEvent = eventResult.data;
                this.fillForm();
            }
            
            // 載入領取記錄
            const recordResult = await api.getRedPacketRecords(50);
            if (recordResult.success) {
                this.records = recordResult.data;
                this.renderStats();
                this.renderClaimList();
            }
        } catch (error) {
            console.error('載入紅包資料失敗:', error);
            app.showToast('載入失敗', 'error');
        }
    },
    
    // 重新載入
    async refresh() {
        app.showToast('重新載入中...', 'info');
        await this.load();
    },
    
    // 填入表單
    fillForm() {
        if (!this.currentEvent) return;
        
        document.getElementById('eventName').value = this.currentEvent.name || '';
        document.getElementById('eventKeyword').value = this.currentEvent.keyword || '';
        document.getElementById('eventBonus').value = this.currentEvent.bonus || '';
        document.getElementById('eventContent').value = this.currentEvent.content || '';
        document.getElementById('eventClaimedMsg').value = this.currentEvent.claimedMsg || '';
        
        // 時間格式轉換 (YYYY-MM-DD HH:mm:ss -> YYYY-MM-DDTHH:mm)
        if (this.currentEvent.start) {
            const startDate = new Date(this.currentEvent.start);
            document.getElementById('eventStart').value = this.formatDateTimeLocal(startDate);
        }
        
        if (this.currentEvent.end) {
            const endDate = new Date(this.currentEvent.end);
            document.getElementById('eventEnd').value = this.formatDateTimeLocal(endDate);
        }
    },
    
    // 格式化日期時間為 datetime-local 格式
    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    
    // 渲染統計
    renderStats() {
        const eventName = this.currentEvent?.name || '';
        
        // 過濾當前活動的記錄
        const currentEventRecords = this.records.filter(r => r.eventName === eventName);
        
        const claimCount = currentEventRecords.length;
        const totalAmount = currentEventRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
        
        document.getElementById('eventClaimCount').textContent = claimCount + ' 人';
        document.getElementById('eventTotalAmount').textContent = app.formatCurrency(totalAmount);
    },
    
    // 渲染領取名單
    renderClaimList() {
        const container = document.getElementById('claimList');
        
        if (this.records.length === 0) {
            container.innerHTML = '<div class="loading">暫無領取記錄</div>';
            return;
        }
        
        container.innerHTML = this.records.map(record => `
            <div class="claim-item">
                <div class="claim-info">
                    <div class="claim-name">${record.name} - ${record.eventName}</div>
                    <div class="claim-time">${app.formatRelativeTime(record.time)}</div>
                </div>
                <div class="claim-amount">+${record.amount}</div>
            </div>
        `).join('');
    }
};

// 表單提交事件
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('eventName').value,
        keyword: document.getElementById('eventKeyword').value,
        bonus: parseInt(document.getElementById('eventBonus').value),
        content: document.getElementById('eventContent').value,
        claimedMsg: document.getElementById('eventClaimedMsg').value,
        start: document.getElementById('eventStart').value,
        end: document.getElementById('eventEnd').value
    };
    
    // 驗證
    if (!data.name || !data.keyword || !data.bonus || !data.start || !data.end) {
        app.showToast('請填寫所有必填欄位', 'warning');
        return;
    }
    
    // 確認儲存
    if (!confirm('確定要儲存紅包活動設定嗎?')) {
        return;
    }
    
    try {
        const result = await api.updateEvent(data);
        
        if (result.success) {
            app.showToast('儲存成功', 'success');
            redpacket.currentEvent = data;
            await redpacket.load();
        } else {
            app.showToast(result.error || '儲存失敗', 'error');
        }
    } catch (error) {
        console.error('儲存紅包活動失敗:', error);
        app.showToast('儲存失敗', 'error');
    }
});


// ========== autoreply.js ==========
// ===== 自動回應模組 =====
const autoreply = {
    replies: [],
    currentReply: null,
    editMode: false,
    
    // 載入自動回應列表
    async load() {
        const container = document.getElementById('autoReplyList');
        container.innerHTML = '<div class="loading">載入中...</div>';
        
        try {
            const result = await api.getAutoReplies();
            
            if (result.success) {
                this.replies = result.data;
                this.render();
            }
        } catch (error) {
            console.error('載入自動回應失敗:', error);
            container.innerHTML = '<div class="loading">載入失敗</div>';
            app.showToast('載入失敗', 'error');
        }
    },
    
    // 渲染列表
    render() {
        const container = document.getElementById('autoReplyList');
        
        if (this.replies.length === 0) {
            container.innerHTML = '<div class="loading">尚未設定自動回應</div>';
            return;
        }
        
        container.innerHTML = this.replies.map((reply, index) => `
            <div class="reply-card" onclick="autoreply.showEditModal(${index})">
                <div class="reply-header">
                    <div class="reply-keyword">${reply.keyword}</div>
                    <div class="reply-toggle ${reply.status === '啟用' ? 'active' : ''}" 
                         onclick="event.stopPropagation(); autoreply.toggleStatus(${index})">
                    </div>
                </div>
                <div class="reply-content">${reply.content}</div>
            </div>
        `).join('');
    },
    
    // 切換狀態
    async toggleStatus(index) {
        const reply = this.replies[index];
        const newStatus = reply.status === '啟用' ? '停用' : '啟用';
        
        try {
            const data = {
                keyword: reply.keyword,
                content: reply.content,
                status: newStatus,
                startTime: reply.startTime,
                endTime: reply.endTime
            };
            
            const result = await api.saveAutoReply(data);
            
            if (result.success) {
                reply.status = newStatus;
                this.render();
                app.showToast(`已${newStatus}`, 'success');
            }
        } catch (error) {
            console.error('切換狀態失敗:', error);
            app.showToast('操作失敗', 'error');
        }
    },
    
    // 顯示新增 Modal
    showAddModal() {
        this.editMode = false;
        this.currentReply = null;
        
        document.getElementById('replyModalTitle').textContent = '新增自動回應';
        document.getElementById('replyKeyword').value = '';
        document.getElementById('replyContent').value = '';
        document.getElementById('replyStatus').value = '啟用';
        document.getElementById('replyStart').value = '';
        document.getElementById('replyEnd').value = '';
        document.getElementById('deleteReplyBtn').style.display = 'none';
        
        app.showModal('replyModal');
    },
    
    // 顯示編輯 Modal
    showEditModal(index) {
        this.editMode = true;
        this.currentReply = this.replies[index];
        
        document.getElementById('replyModalTitle').textContent = '編輯自動回應';
        document.getElementById('replyKeyword').value = this.currentReply.keyword;
        document.getElementById('replyContent').value = this.currentReply.content;
        document.getElementById('replyStatus').value = this.currentReply.status || '啟用';
        
        // 時間格式轉換
        if (this.currentReply.startTime) {
            const startDate = new Date(this.currentReply.startTime);
            document.getElementById('replyStart').value = this.formatDateTimeLocal(startDate);
        } else {
            document.getElementById('replyStart').value = '';
        }
        
        if (this.currentReply.endTime) {
            const endDate = new Date(this.currentReply.endTime);
            document.getElementById('replyEnd').value = this.formatDateTimeLocal(endDate);
        } else {
            document.getElementById('replyEnd').value = '';
        }
        
        document.getElementById('deleteReplyBtn').style.display = 'block';
        
        app.showModal('replyModal');
    },
    
    // 格式化日期時間
    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    
    // 關閉 Modal
    closeModal() {
        app.hideModal('replyModal');
        this.currentReply = null;
    },
    
    // 儲存自動回應
    async saveReply() {
        const keyword = document.getElementById('replyKeyword').value.trim();
        const content = document.getElementById('replyContent').value.trim();
        const status = document.getElementById('replyStatus').value;
        const startTime = document.getElementById('replyStart').value;
        const endTime = document.getElementById('replyEnd').value;
        
        if (!keyword || !content) {
            app.showToast('請填寫關鍵字和回覆內容', 'warning');
            return;
        }
        
        try {
            const data = {
                keyword: keyword,
                content: content,
                status: status,
                startTime: startTime || null,
                endTime: endTime || null
            };
            
            const result = await api.saveAutoReply(data);
            
            if (result.success) {
                app.showToast('儲存成功', 'success');
                this.closeModal();
                await this.load();
            } else {
                app.showToast(result.error || '儲存失敗', 'error');
            }
        } catch (error) {
            console.error('儲存自動回應失敗:', error);
            app.showToast('儲存失敗', 'error');
        }
    },
    
    // 刪除自動回應
    async deleteReply() {
        if (!this.currentReply) return;
        
        if (!confirm(`確定要刪除「${this.currentReply.keyword}」嗎?`)) {
            return;
        }
        
        try {
            const result = await api.deleteAutoReply(this.currentReply.keyword);
            
            if (result.success) {
                app.showToast('刪除成功', 'success');
                this.closeModal();
                await this.load();
            } else {
                app.showToast(result.error || '刪除失敗', 'error');
            }
        } catch (error) {
            console.error('刪除自動回應失敗:', error);
            app.showToast('刪除失敗', 'error');
        }
    }
};

