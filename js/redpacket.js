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
