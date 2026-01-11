document.addEventListener('DOMContentLoaded', () => {

    // Intersection Observer for Fade In animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Optional: Parallax for floating stats if mouse moves
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
        heroVisual.addEventListener('mousemove', (e) => {
            const x = (e.clientX - window.innerWidth / 2) / 50;
            const y = (e.clientY - window.innerHeight / 2) / 50;

            const stats = document.querySelectorAll('.float-stat');
            stats.forEach((stat, index) => {
                const factor = index + 1;
                stat.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
            });
        });

        heroVisual.addEventListener('mouseleave', () => {
            const stats = document.querySelectorAll('.float-stat');
            stats.forEach(stat => {
                stat.style.transform = `translate(0, 0)`;
            });
        });
    }

});
