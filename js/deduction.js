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
