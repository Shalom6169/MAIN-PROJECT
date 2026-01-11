// login-interactions.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Elements ---
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const msgBox = document.getElementById('msgBox');
    const loginBtn = document.getElementById('loginBtn');

    // --- Password Toggle Interaction (smooth-fade) ---
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Visual feedback
            togglePasswordBtn.style.opacity = '0.5';
            setTimeout(() => togglePasswordBtn.style.opacity = '1', 200);

            // Toggle Icon or Text status (user JSON didn't specify icon, using text or simple SVG if inserted)
            // Using logic based on current inner text if it's text-based, or class if icon
            if (togglePasswordBtn.innerText.toLowerCase().includes('show')) {
                togglePasswordBtn.innerText = 'Hide';
            } else if (togglePasswordBtn.innerText.toLowerCase().includes('hide')) {
                togglePasswordBtn.innerText = 'Show';
            }
        });
    }

    // --- Magnetic Hover Effect for Login Button ---
    // Simple implementation of magnetic feel
    if (loginBtn) {
        loginBtn.addEventListener('mousemove', (e) => {
            const rect = loginBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Strength of magnet
            loginBtn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.02)`;
        });

        loginBtn.addEventListener('mouseleave', () => {
            loginBtn.style.transform = 'translate(0, 0) scale(1)';
        });
    }

    // --- Input Micro-interactions ---
    [emailInput, passwordInput].forEach(input => {
        if (!input) return;
        input.addEventListener('input', () => {
            input.classList.add('input-typing');
            // Remove after animation to allow re-trigger? 
            // Or just keep style. The JSON said "underline-glow", CSS handles focus/typing states.
        });
    });

    // --- Login Submission Logic (Preserving Functionality) ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            msgBox.textContent = '';
            msgBox.className = 'msg-box';

            // Loading State
            const originalBtnText = loginBtn.innerText;
            loginBtn.innerText = 'Verifying...';
            loginBtn.style.opacity = '0.7';
            loginBtn.disabled = true;

            try {
                const formData = new FormData(loginForm);
                // Assume standard fetch to /api/login or similar, based on previous file viewing
                // Previous file used: fetch('/api/login', { method: 'POST', body: new FormData(form) });

                // MOCKING the fetch if the endpoint doesn't actually exist in the snippets I saw (I saw main.py rendering templates, but I trust previous JS logic was valid)
                // Re-implementing the fetch logic from previous login.html

                const res = await fetch('/api/login', { method: 'POST', body: formData });

                // If endpoint creates 404/405, we might need to handle it. 
                // However, user said "all functionalities should be working", implies backend is ready.

                let data = {};
                try {
                    const txt = await res.text();
                    data = JSON.parse(txt);
                } catch (e) { /* ignore json parse error */ }

                if (!res.ok) {
                    throw new Error(data.detail || data.message || 'Login failed');
                }

                // Success
                msgBox.textContent = 'Success! Redirecting...';
                msgBox.classList.add('msg-success');
                loginBtn.classList.add('login-success-pulse'); // JSON "pulse-glow"

                // Animate Sphere Out
                const sphere = document.getElementById('loginSphere');
                if (sphere) {
                    sphere.classList.add('sphere-exit');
                }

                // Token handling
                const token = data.token || data.access_token;
                if (token) {
                    localStorage.setItem('vs_token', token);
                }

                // Smooth Redirect
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 800);

            } catch (err) {
                // Error handling
                console.error(err);
                msgBox.textContent = err.message || 'Authentication failed';
                msgBox.classList.add('msg-error');

                // Shake Animation
                const card = document.querySelector('.login-card');
                card.classList.remove('shake-anim');
                void card.offsetWidth; // trigger reflow
                card.classList.add('shake-anim');

                // Reset Button
                loginBtn.innerText = originalBtnText;
                loginBtn.style.opacity = '1';
                loginBtn.disabled = false;
            }
        });
    }
});
