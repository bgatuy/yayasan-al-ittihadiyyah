document.addEventListener('DOMContentLoaded', () => {
  const togglePasswordButton = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('toggle-password-icon');

  if (togglePasswordButton && passwordInput && toggleIcon) {
    togglePasswordButton.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      
      toggleIcon.classList.toggle('fa-eye', !isPassword);
      toggleIcon.classList.toggle('fa-eye-slash', isPassword);
    });
  }
});