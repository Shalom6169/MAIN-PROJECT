/**
 * Global Scroll Reveal & Cinematic Motion Engine
 * Applies "Apple-style" scroll animations to elements with specific classes.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Console Signature
    console.log('🎬 Initializing Global Cinematic Scroll Engine...');

    // 1. Intersection Observer Configuration
    const observerOptions = {
        threshold: 0.1,    // Trigger when 10% visible
        rootMargin: '0px 0px -50px 0px' // Offset bottom slightly so it triggers before very bottom
    };

    // 2. The Observer
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add visible class to trigger CSS transition
                entry.target.classList.add('visible');

                // Handle Special "Count Up" Elements inside this section
                const counters = entry.target.querySelectorAll('.count-up');
                counters.forEach(counter => animateCounter(counter));

                // Optional: Stop observing once revealed (Performance)
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 3. Target Elements
    // .scroll-section: Main container fade-up
    // .stagger-trigger: Container that triggers children stagger
    // .dashboard-mockup: 3D Tilt elements
    // .blur-reveal-scroll: Elements that unblur
    const targets = document.querySelectorAll('.scroll-section, .stagger-trigger, .dashboard-mockup, .blur-reveal-scroll, .animate-enter');
    targets.forEach(el => scrollObserver.observe(el));

    // 4. Helper: Number Count Up Animation
    function animateCounter(counter) {
        if (counter.classList.contains('counted')) return;
        counter.classList.add('counted');

        const target = +counter.getAttribute('data-target');
        if (isNaN(target)) return;

        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // EaseOutExpo or similar smooth curve
            // (1 - Math.pow(2, -10 * progress))
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const currentVal = Math.floor(ease * target);
            counter.innerText = currentVal;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                counter.innerText = target;
            }
        }
        requestAnimationFrame(step);
    }
});
