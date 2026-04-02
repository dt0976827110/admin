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
