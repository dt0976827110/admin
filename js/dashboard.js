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
