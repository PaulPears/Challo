document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Hardcoded credentials
    const validUsername = 'admin';
    const validPassword = 'password';

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === validUsername && password === validPassword) {
            // On success, set a session flag and redirect
            sessionStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'index.html';
        } else {
            // On failure, show an error message
            errorMessage.textContent = 'Invalid ID or password.';
        }
    });
});
