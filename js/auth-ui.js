// ============================================================
// AUTH UI - FIXED LOGOUT & LOGIN
// ============================================================

function showAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
    switchAuthTab(tab);
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    clearAuthErrors();
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'flex';
        if (registerForm) registerForm.style.display = 'none';
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
        setTimeout(() => document.getElementById('loginEmail')?.focus(), 100);
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'flex';
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.add('active');
        setTimeout(() => document.getElementById('registerName')?.focus(), 100);
    }
    clearAuthErrors();
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const eyeId = inputId === 'loginPassword' ? 'eye-login' : 'eye-register';
    const eye = document.getElementById(eyeId);
    if (!input || !eye) return;

    if (input.type === 'password') {
        input.type = 'text';
        eye.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        eye.className = 'fas fa-eye';
    }
}

function clearAuthErrors() {
    ['loginError', 'registerError'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.display = 'none'; el.textContent = ''; }
    });
}

function showAuthError(formType, message) {
    const el = document.getElementById(`${formType}Error`);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
    }
}

// ============================================================
// HANDLE LOGIN
// ============================================================
async function handleLogin() {
    const email = (document.getElementById('loginEmail')?.value || '').trim();
    const password = document.getElementById('loginPassword')?.value || '';
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        showAuthError('login', '⚠️ Email dan password wajib diisi');
        return;
    }

    setButtonLoading(btn, true);
    clearAuthErrors();

    try {
        const result = await ApiService.auth.login(email, password);

        if (result.success) {
            // Semua handling dilakukan di onAuthStateChange
            showToast(`Selamat datang, ${result.data.name}! 👋`);
        } else {
            showAuthError('login', `⚠️ ${result.message}`);
        }
    } catch (error) {
        showAuthError('login', '⚠️ Gagal terhubung. Cek koneksi internet.');
    } finally {
        setButtonLoading(btn, false,
            '<i class="fas fa-sign-in-alt"></i> Login');
    }
}

// ============================================================
// HANDLE REGISTER
// ============================================================
async function handleRegister() {
    const name = (document.getElementById('registerName')?.value || '').trim();
    const email = (document.getElementById('registerEmail')?.value || '').trim();
    const password = document.getElementById('registerPassword')?.value || '';
    const btn = document.getElementById('registerBtn');

    if (!name || !email || !password) {
        showAuthError('register', '⚠️ Semua field wajib diisi');
        return;
    }
    if (name.length < 2) {
        showAuthError('register', '⚠️ Nama minimal 2 karakter');
        return;
    }
    if (password.length < 6) {
        showAuthError('register', '⚠️ Password minimal 6 karakter');
        return;
    }
    if (!/\d/.test(password)) {
        showAuthError('register', '⚠️ Password harus mengandung angka');
        return;
    }

    setButtonLoading(btn, true);
    clearAuthErrors();

    try {
        const result = await ApiService.auth.register(name, email, password);

        if (result.success) {
            showToast(`Selamat datang, ${result.data.name}! 🎉`);
        } else {
            showAuthError('register', `⚠️ ${result.message}`);
        }
    } catch (error) {
        showAuthError('register', '⚠️ Gagal mendaftar. Coba lagi.');
    } finally {
        setButtonLoading(btn, false,
            '<i class="fas fa-user-plus"></i> Daftar Sekarang');
    }
}

// ============================================================
// HANDLE LOGOUT — FIXED
// ============================================================
async function handleLogout() {
    if (!confirm('Yakin ingin logout?')) return;

    try {
        showLoading('Logging out...');
        await ApiService.auth.logout();
        hideLoading();

        // onAuthStateChange akan trigger resetAfterLogout()
        // Tapi kita juga panggil manual untuk memastikan
        showToast('Logout berhasil! Sampai jumpa 👋');

    } catch (error) {
        hideLoading();
        console.error('Logout error:', error);
        showToast('Logout gagal. Coba lagi.', 'warning');
    }
}

function skipLogin() {
    closeAuthModal();
    // Load dari localStorage jika ada
    loadFromStorage();
    showToast('Mode offline: Data hanya tersimpan di browser', 'warning');
}

function setButtonLoading(btn, isLoading, originalHTML = '') {
    if (!btn) return;
    if (isLoading) {
        btn.setAttribute('data-original', btn.innerHTML);
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        btn.disabled = true;
    } else {
        btn.innerHTML = originalHTML || btn.getAttribute('data-original') || 'Submit';
        btn.disabled = false;
    }
}
