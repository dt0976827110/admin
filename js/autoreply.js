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
