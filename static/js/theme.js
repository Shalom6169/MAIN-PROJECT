// theme.js
document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('vs_theme') || 'default';

    if (document.documentElement.getAttribute('data-theme') !== currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Simple toggle logic (if needed for landing page tests)
            // Default app behavior sets specific themes via Settings menu using window.setTheme
            const newTheme = currentTheme === 'light' ? 'default' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('vs_theme', newTheme);
        });
    }

    // --- Scroll Reveal Logic (Landing Page) ---
    const revealElements = document.querySelectorAll('.feature-card, .cta-section');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-active');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });

        revealElements.forEach(el => revealObserver.observe(el));
    }
});
