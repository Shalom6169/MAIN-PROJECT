(function () {
    // Theme Loader
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('vs_theme', theme);
    }

    // Load saved theme
    let savedTheme = localStorage.getItem('vs_theme');

    // If no theme is saved, default to 'dark_glow' for new users (optional)
    if (!savedTheme) {
        savedTheme = 'dark_glow';
        // localStorage.setItem('vs_theme', savedTheme); // Don't force save, let session handle
    }

    if (savedTheme) {
        applyTheme(savedTheme);
    }

    // Expose to window for Settings page
    window.setTheme = applyTheme;
})();
