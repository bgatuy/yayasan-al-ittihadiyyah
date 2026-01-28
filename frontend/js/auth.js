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
                // Redirect ke halaman admin setelah login berhasil
                window.location.href = '/admin/';
            } catch (error) {
                console.error('Login failed:', error);
                loginErrorMessage.textContent = error.message || 'Login gagal. Periksa email dan password Anda.';
                loginErrorMessage.classList.remove('hidden');
                btnLogin.disabled = false;
                btnLogin.textContent = 'Login';
            }
        });
    }
});

(function() {
    const TOKEN_KEY = 'admin_auth_token';

    window.Auth = {
        setAuthToken: (token) => {
            localStorage.setItem(TOKEN_KEY, token);
        },

        getAuthToken: () => {
            return localStorage.getItem(TOKEN_KEY);
        },

        removeAuthToken: () => {
            localStorage.removeItem(TOKEN_KEY);
        },

        // Fungsi untuk login ke backend
        login: async (email, password) => {
            try {
                const response = await window.DataStore.login({ email, password });
                if (response.token) {
                    window.Auth.setAuthToken(response.token);
                    return response;
                } else {
                    throw new Error('Token tidak diterima dari server.');
                }
            } catch (error) {
                throw error; // Lempar error agar bisa ditangkap di form login
            }
        },

        // Fungsi untuk logout
        logout: () => {
            window.Auth.removeAuthToken();
            // Opsional: panggil API logout di backend jika ada
            window.location.href = '/admin/login.html';
        },
    };
})();