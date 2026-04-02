// ===== 主應用程式 =====
const app = {
    currentPage: 'dashboard',
    
    // 初始化
    init() {
        // ✅ 永遠顯示登入頁面 (不自動登入)
        this.showLogin();
        
        // 登入表單事件
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        // 會員搜尋事件
        const memberSearch = document.getElementById('memberSearch');
        if (memberSearch) {
            memberSearch.addEventListener('input', (e) => {
                members.search(e.target.value);
            });
        }
    },
    
    // 登入
    async login() {
        const password = document.getElementById('passwordInput').value;
        const errorEl = document.getElementById('loginError');
        const loginBtn = document.getElementById('loginBtn');
        
        if (!password) {
            errorEl.textContent = '請輸入密碼';
            return;
        }
        
        // ✅ 顯示 loading 狀態
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        errorEl.textContent = '';
        
        // ✅ 暫存密碼到 sessionStorage (關閉瀏覽器就清除)
        sessionStorage.setItem(CONFIG.PASSWORD_KEY, password);
        
        try {
            // 測試 API 連線
            const result = await api.getDashboard();
            
            if (result.success) {
                this.showApp();
                this.navigateTo('dashboard');
                this.showToast('登入成功', 'success');
            } else {
                throw new Error('登入失敗');
            }
        } catch (error) {
            console.error('Login error:', error);
            sessionStorage.removeItem(CONFIG.PASSWORD_KEY);
            errorEl.textContent = '密碼錯誤或無法連接伺服器';
            this.showToast('登入失敗', 'error');
            
            // ✅ 移除 loading 狀態
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    },
    
    // 登出
    logout() {
        if (confirm('確定要登出嗎?')) {
            sessionStorage.removeItem(CONFIG.PASSWORD_KEY);
            this.showLogin();
            this.showToast('已登出', 'info');
        }
    },
    
    // 顯示登入頁
    showLogin() {
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        
        if (loginPage) loginPage.classList.add('active');
        if (appContainer) appContainer.style.display = 'none';
        
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) passwordInput.value = '';
    },
    
    // 顯示應用程式
    showApp() {
        console.log('showApp called'); // Debug
        
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        
        if (loginPage) {
            loginPage.classList.remove('active');
            loginPage.style.display = 'none'; // ← 強制隱藏
        }
        
        if (appContainer) {
            appContainer.style.display = 'block'; // ← 強制顯示
        }
        
        console.log('App should be visible now'); // Debug
    },
    
    // 頁面導航
    navigateTo(page) {
        console.log('Navigate to:', page); // Debug
        
        // 隱藏所有頁面
        const allPages = document.querySelectorAll('#appContainer .page');
        allPages.forEach(p => {
            p.classList.remove('active');
        });
        
        // 顯示目標頁面
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // 更新導航按鈕狀態
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navBtn = document.querySelector(`[data-page="${page}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }
        
        // 記錄當前頁面
        this.currentPage = page;
        
        // 載入頁面資料
        this.loadPageData(page);
    },
    
    // 載入頁面資料
    async loadPageData(page) {
        try {
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
        } catch (error) {
            console.error('Load page data error:', error);
        }
    },
    
    // Toast 通知
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast ${type} show`;
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    },
    
    // 顯示 Modal
    showModal(modalId) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById(modalId);
        
        if (overlay) overlay.classList.add('active');
        if (modal) modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    // 隱藏 Modal
    hideModal(modalId) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById(modalId);
        
        if (overlay) overlay.classList.remove('active');
        if (modal) modal.classList.remove('active');
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
const modalOverlay = document.getElementById('modalOverlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', () => {
        document.querySelectorAll('.modal.active').forEach(modal => {
            const modalId = modal.id;
            if (modalId === 'memberModal') {
                members.closeModal();
            } else if (modalId === 'replyModal') {
                autoreply.closeModal();
            }
        });
    });
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...'); // Debug
    app.init();
});
