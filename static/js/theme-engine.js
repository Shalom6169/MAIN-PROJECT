/**
 * Global Cinematic Background & Interaction Engine v2.0
 * "Liquid Plasma / Aurora Mesh" + "Atmospheric Fog"
 * Optimized for Desktop & Raspberry Pi (Auto-Scaling)
 */

class CinematicEngine {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.time = 0;
        this.frameId = null;
        this.isLowPerformance = false;
        this.fpsMetrics = { lastTime: performance.now(), frames: 0 };

        // Mode Flags
        this.landingMode = false; // Disables mouse parallax, slows animation

        // Configuration & State
        this.currentTheme = 'calm';
        this.blobs = [];
        this.fogLayers = []; // New Fog System
        this.particles = [];
        this.shockwaves = [];

        // Cursor
        this.cursor = { x: -100, y: -100, targetX: -100, targetY: -100 };
        this.trail = [];

        // Theme Configuration (HSLA Palettes)
        this.themes = {
            'calm': { // Ocean/Calm
                hue1: 210, hue2: 190, sat: '70%',
                bgGradient: ['#0f172a', '#020617'],
                speed: 0.002, blobCount: 6, opacity: 0.4
            },
            'neon_dark': { // Cyberpunk Purple/Green
                hue1: 280, hue2: 140, sat: '90%',
                bgGradient: ['#1a0b2e', '#050a14'],
                speed: 0.004, blobCount: 8, opacity: 0.5
            },
            'ocean': { // Deep Blue
                hue1: 200, hue2: 240, sat: '80%',
                bgGradient: ['#021024', '#052e3e'],
                speed: 0.002, blobCount: 7, opacity: 0.5
            },
            'sunset': { // Warm Solar Nebula
                hue1: 10, hue2: 40, sat: '85%',
                bgGradient: ['#2e0b0b', '#1a0505'],
                speed: 0.003, blobCount: 7, opacity: 0.45
            },
            'professional': { // clean white/grey pattern
                hue1: 210, hue2: 0, sat: '0%', // Monochrome
                bgGradient: ['#ffffff', '#f1f5f9'], // White to Slate-100
                speed: 0.003, blobCount: 6, opacity: 0.15 // Faster speed + more blobs
            },
            'dark_glow': { // Radar Energy
                hue1: 160, hue2: 180, sat: '90%',
                bgGradient: ['#001a10', '#000000'],
                speed: 0.003, blobCount: 6, opacity: 0.4
            },
            'critical': { // Red Alert (Pulsing Plasma)
                hue1: 0, hue2: 340, sat: '95%',
                bgGradient: ['#2b0505', '#000000'],
                speed: 0.015, blobCount: 10, opacity: 0.6
            }
        };

        // Fallback or alias
        this.themes['normal'] = this.themes['neon_dark'];
        this.themes['warning'] = this.themes['sunset'];
        this.themes['default'] = this.themes['calm'];

        // Bindings
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    /**
     * Set Landing Mode (Slower, No Mouse Parallax)
     */
    setLandingMode(enabled) {
        this.landingMode = enabled;
        console.log(`CinematicEngine: Landing Mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    init() {
        console.log('🚀 Initializing Cinematic Engine v2.0 ...');

        // 1. Setup Canvas
        this.canvas = document.getElementById('bg-canvas');
        if (!this.canvas) {
            console.error('Moving background canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize for BG

        // 2. Initial Config
        this.handleResize();
        window.addEventListener('resize', this.handleResize);

        // 3. Setup Listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mousedown', this.handleClick); // Use mousedown for instant reaction
        this.createCursorElement();

        // 4. Sync Initial Theme & Watch for Changes
        const initialTheme = document.documentElement.getAttribute('data-theme') || 'calm';
        this.setTheme(initialTheme);

        // Observer for dynamic attribute changes (Settings / Toggle)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme');
                    console.log('CinematicEngine: Theme changed to', newTheme);
                    this.setTheme(newTheme);
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });

        // 5. Initialize Fog Layers for Atmosphere
        this.initFogLayers();

        // 6. Start Loop
        this.startLoop();
    }

    startLoop() {
        if (!this.frameId) this.animate();
    }

    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.initBlobs(); // Re-center blobs
    }

    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            this.initBlobs();
        }
    }

    initFogLayers() {
        this.fogLayers = [
            { y: 0.2, speed: 0.05, density: 0.4, offset: 0 },
            { y: 0.5, speed: 0.03, density: 0.3, offset: 100 },
            { y: 0.8, speed: 0.07, density: 0.2, offset: 200 }
        ];
    }

    initBlobs() {
        const theme = this.themes[this.currentTheme];
        const count = this.isLowPerformance ? Math.max(3, Math.floor(theme.blobCount / 2)) : theme.blobCount;

        this.blobs = [];
        for (let i = 0; i < count; i++) {
            this.blobs.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 300 + 200,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                hueOffset: Math.random() * 40 // Variance
            });
        }
    }

    handleMouseMove(e) {
        // In Landing Mode, we ignore mouse influence on the background blobs (Parallax disabled)
        // But we still track cursor for the Orb/Trail effects
        this.cursor.targetX = e.clientX;
        this.cursor.targetY = e.clientY;
    }

    createCursorElement() {
        const cursorContainer = document.createElement('div');
        cursorContainer.id = 'cursor-layer';
        cursorContainer.innerHTML = `
            <div class="cursor-orb" id="cursor-orb"></div>
        `;
        document.body.appendChild(cursorContainer);
        this.domCursor = document.getElementById('cursor-orb');
    }

    handleClick(e) {
        // Add shockwave interactively
        this.shockwaves.push({
            x: e.clientX,
            y: e.clientY,
            radius: 0,
            alpha: 1
        });

        // Liquid distortion effect
        const cursorLayer = document.getElementById('cursor-layer');
        if (cursorLayer) {
            cursorLayer.style.transform = 'scale(0.98)';
            setTimeout(() => cursorLayer.style.transform = 'scale(1)', 150);
        }
    }

    updateFPS() {
        const now = performance.now();
        this.fpsMetrics.frames++;

        if (now - this.fpsMetrics.lastTime >= 1000) {
            const fps = this.fpsMetrics.frames;
            this.fpsMetrics.frames = 0;
            this.fpsMetrics.lastTime = now;

            // Auto-Performance Tuner
            if (fps < 20 && !this.isLowPerformance) {
                console.warn("Low FPS detected. Reducing quality.");
                this.isLowPerformance = true;
                this.initBlobs(); // Reset with fewer blobs
            }
        }
    }

    /**
     * Core Render Loop
     */
    // Helper: Lerp
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    // Helper: Lerp Hex Color
    lerpColor(a, b, amount) {
        const ah = parseInt(a.replace(/#/g, ''), 16),
            ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
            bh = parseInt(b.replace(/#/g, ''), 16),
            br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
            rr = ar + amount * (br - ar),
            rg = ag + amount * (bg - ag),
            rb = ab + amount * (bb - ab);
        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + (rb | 0)).toString(16).slice(1);
    }

    animate() {
        this.updateFPS();
        this.time += 0.01;

        // --- NEW: Smooth Interpolation ---
        const target = this.themes[this.currentTheme];

        // Initialize renderConfig if missing
        if (!this.renderConfig) {
            // Deep copy initial state
            this.renderConfig = JSON.parse(JSON.stringify(target));
        }

        // Lerp factors (Adjust for smoothness speed)
        const lerpSpeed = 0.03; // Smooth drift 

        // Lerp Scalar Values
        this.renderConfig.hue1 = this.lerp(this.renderConfig.hue1, target.hue1, lerpSpeed);
        this.renderConfig.hue2 = this.lerp(this.renderConfig.hue2, target.hue2, lerpSpeed);
        this.renderConfig.speed = this.lerp(this.renderConfig.speed, target.speed, lerpSpeed);
        this.renderConfig.opacity = this.lerp(this.renderConfig.opacity, target.opacity, lerpSpeed);

        // Lerp Gradients (Color A and B)
        this.renderConfig.bgGradient[0] = this.lerpColor(this.renderConfig.bgGradient[0], target.bgGradient[0], lerpSpeed);
        this.renderConfig.bgGradient[1] = this.lerpColor(this.renderConfig.bgGradient[1], target.bgGradient[1], lerpSpeed);

        const theme = this.renderConfig; // Use interpolated values for drawing
        // ---------------------------------

        // 1. Draw Background Gradient
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, theme.bgGradient[0]);
        bgGrad.addColorStop(1, theme.bgGradient[1]);
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2. Render Fog Layers (Horizontal Drift)
        // Only render heavy fog if not low performance
        if (!this.isLowPerformance) {
            this.renderFog(theme); // Pass interpolated theme
        }

        // 3. Render Plasma Blobs (Additive Blending)
        this.ctx.globalCompositeOperation = 'lighten';

        // Speed Multiplier (Slower in Landing Mode)
        const speedMult = this.landingMode ? 0.3 : 1.0;

        this.blobs.forEach((blob, i) => {
            // Movement logic (Standard Speed)
            blob.x += blob.vx * theme.speed * 100 * speedMult;
            blob.y += blob.vy * theme.speed * 100 * speedMult;

            // Bounce off edges (softly)
            if (blob.x < -blob.radius) blob.vx = Math.abs(blob.vx);
            if (blob.x > this.width + blob.radius) blob.vx = -Math.abs(blob.vx);
            if (blob.y < -blob.radius) blob.vy = Math.abs(blob.vy);
            if (blob.y > this.height + blob.radius) blob.vy = -Math.abs(blob.vy);

            // Mouse Parallax (Disabled Globally per user request)
            let parallaxX = 0;
            let parallaxY = 0;
            // if (!this.landingMode && this.cursor.targetX > 0) {
            //     parallaxX = (this.cursor.targetX - this.width / 2) * 0.02 * ((i % 3) + 1);
            //     parallaxY = (this.cursor.targetY - this.height / 2) * 0.02 * ((i % 3) + 1);
            // }

            // Draw Blob
            const radial = this.ctx.createRadialGradient(
                blob.x + parallaxX, blob.y + parallaxY, 0,
                blob.x + parallaxX, blob.y + parallaxY, blob.radius
            );

            // Color Morphing
            const hue = (theme.hue1 + Math.sin(this.time * 0.5 + i) * 20 + blob.hueOffset) % 360;
            radial.addColorStop(0, `hsla(${hue}, ${theme.sat}, 60%, ${theme.opacity})`);
            radial.addColorStop(1, `hsla(${hue}, ${theme.sat}, 20%, 0)`);

            this.ctx.fillStyle = radial;
            this.ctx.beginPath();
            this.ctx.arc(blob.x + parallaxX, blob.y + parallaxY, blob.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 4. Render Shockwaves (Interactive Ripple)
        this.shockwaves.forEach((wave, index) => {
            wave.radius += 5;
            wave.alpha -= 0.02;

            if (wave.alpha <= 0) {
                this.shockwaves.splice(index, 1);
            } else {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${wave.alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });

        // 5. Render Noise Overlay (Subtle Grain) - Optional
        // Skipping heavily per-pixel noise for Performance, using simple overlay logic if needed
        // For Raspberry Pi, avoid per-pixel loop.

        // Reset Composite
        this.ctx.globalCompositeOperation = 'source-over';

        // 6. Update Cursor Orb Element (DOM layer for sharpness)
        this.updateCursorDOM(theme);

        this.frameId = requestAnimationFrame(this.animate);
    }

    renderFog(theme) {
        this.ctx.globalCompositeOperation = 'screen'; // Soft overlay

        this.fogLayers.forEach((layer, i) => {
            // Move fog
            layer.offset += layer.speed * (this.landingMode ? 0.5 : 1.0);

            const yPos = layer.y * this.height;
            const fogGrad = this.ctx.createLinearGradient(0, yPos - 100, 0, yPos + 100);

            // Dynamic color based on theme
            const color = `hsla(${theme.hue2}, 30%, 70%, 0.08)`;
            const transparent = `hsla(${theme.hue2}, 30%, 70%, 0)`;

            fogGrad.addColorStop(0, transparent);
            fogGrad.addColorStop(0.5, color); // Middle stripe
            fogGrad.addColorStop(1, transparent);

            this.ctx.fillStyle = fogGrad;

            // Sine wave horizontal drift
            const xShift = Math.sin(this.time * 0.2 + i) * 100;

            this.ctx.fillRect(0 + xShift, yPos - 100, this.width, 200);
        });
    }

    updateCursorDOM(theme) {
        // Smooth Lerp
        const dx = this.cursor.targetX - this.cursor.x;
        const dy = this.cursor.targetY - this.cursor.y;
        this.cursor.x += dx * 0.15;
        this.cursor.y += dy * 0.15;

        if (this.domCursor) {
            this.domCursor.style.left = `${this.cursor.x}px`;
            this.domCursor.style.top = `${this.cursor.y}px`;
            // Update glow color to match theme
            document.documentElement.style.setProperty('--glow-color', `hsla(${theme.hue1}, 100%, 70%, 0.8)`);
        }
    }
}

// Instantiate and Export
window.themeEngine = new CinematicEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.themeEngine.init());
} else {
    window.themeEngine.init();
}
