function startLoginCountdown(seconds) {
    const msg = document.getElementById('login-error-message');
    const btn = document.getElementById('btn-login');

    btn.disabled = true;

    let s = seconds;

    const timer = setInterval(() => {
        msg.textContent = `Terlalu banyak percobaan login. Coba lagi dalam ${s} detik.`;
        msg.classList.remove('hidden');

        s--;

        if (s < 0) {
            clearInterval(timer);
            btn.disabled = false;
            btn.textContent = 'Login';
            msg.textContent = '';
            msg.classList.add('hidden');
        }
    }, 1000);
}


document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginErrorMessage = document.getElementById('login-error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btnLogin = document.getElementById('btn-login');

            btnLogin.disabled = true;
            btnLogin.textContent = 'Memproses...';
            loginErrorMessage.classList.add('hidden');

            try {
                await window.Auth.login(email, password);
                window.location.href = '/admin/';
            } catch (error) {
                console.error('Login failed:', error);

                // 🔴 THROTTLE — jalankan countdown
                if (error.retry_after) {
                    startLoginCountdown(error.retry_after);
                    btnLogin.textContent = 'Login';
                    return;
                }

                // ❌ ERROR BIASA
                loginErrorMessage.textContent =
                    error.message || 'Login gagal. Periksa email dan password Anda.';
                loginErrorMessage.classList.remove('hidden');

                btnLogin.disabled = false;
                btnLogin.textContent = 'Login';
            }
        });
    }
});


(function() {
    const TOKEN_KEY = 'admin_auth_token';
    const USER_KEY = 'admin_user_data';

    window.Auth = {
        setAuthToken: (token) => {
            if (token) {
                localStorage.setItem(TOKEN_KEY, token);
            }
        },

        setUserData: (user) => {
            if (user) {
                localStorage.setItem(USER_KEY, JSON.stringify(user));
            }
        },

        getAuthToken: () => {
            return localStorage.getItem(TOKEN_KEY);
        },

        getUserData: () => {
            const user = localStorage.getItem(USER_KEY);
            return user ? JSON.parse(user) : null;
        },

        removeAuthToken: () => {
            localStorage.removeItem(TOKEN_KEY);
        },

        removeUserData: () => {
            localStorage.removeItem(USER_KEY);
        },

        login: async (email, password) => {
            const response = await window.DataStore.login({ email, password });

            if (response.user) {
                // Dev fallback: simpan token jika ada (untuk Live Server)
                if (response.token) {
                    window.Auth.setAuthToken(response.token);
                }
                window.Auth.setUserData(response.user);
                return response;
            }

            throw new Error('Data pengguna tidak diterima dari server.');
        },

        logout: async () => {
            try {
                await window.DataStore.logout();
            } catch (e) {
                // Tetap lanjut logout di client meskipun request gagal
                console.error('Logout failed:', e);
            } finally {
                window.Auth.removeAuthToken();
                window.Auth.removeUserData();
                window.location.href = '/admin/login.html';
            }
        },
    };
})();
