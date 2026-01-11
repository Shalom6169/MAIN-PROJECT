/**
 * Shared UI Interaction Logic
 * Handles Toasts, Modals, and Common Button Actions
 */

// --- Toast Notifications ---
function showToast(message, type = 'success') {
    // Create container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    let icon = '';
    if (type === 'success') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    if (type === 'error') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    if (type === 'info') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    // Add to container
    container.appendChild(toast);

    // Animation entry
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    // Remove after delay
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Modal Logic ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// --- Global Animation Logic ---
// --- Global Animation Logic ---
function initAnimations() {
    // Count Up Animation
    const counters = document.querySelectorAll('.count-up');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 1500; // ms
        const increment = target / (duration / 16);

        // Skip if already processed or invalid
        if (!target) return;

        let current = 0;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.innerText = Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target;
            }
        };
        updateCounter();
    });
}

// --- Global Profile Logic ---
window.loadUserProfile = async () => {
    console.log("Global Profile Sync: Initiating...");
    // Check if we are on the login/landing page to avoid unnecessary calls
    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') return;

    const token = localStorage.getItem("vs_token");
    if (!token) {
        console.warn("Global Profile Sync: No token found.");
        return;
    }

    try {
        const res = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            if (data.ok) {
                console.log("Global Profile Sync: Success", data.username);

                const updateUI = () => {
                    // Update Sidebar Name
                    const nameEls = document.querySelectorAll('.sidebar-username');
                    nameEls.forEach(el => el.innerText = data.username);

                    // Update Avatars
                    const initials = data.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const avatarEls = document.querySelectorAll('.sidebar-avatar');
                    avatarEls.forEach(el => el.innerText = initials);

                    console.log(`Global Profile Sync: Updated ${nameEls.length} names and ${avatarEls.length} avatars.`);
                };

                updateUI();
                // Backup Retry (in case of slow DOM)
                setTimeout(updateUI, 500);
            }
        } else if (res.status === 401) {
            console.warn("Global Profile Sync: Unauthorized, clearing token.");
            localStorage.removeItem("vs_token");
        }
    } catch (e) {
        console.error("Global Profile Sync: Error", e);
    }
};

const domInit = () => {
    initAnimations();
    window.loadUserProfile();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', domInit);
} else {
    domInit();
}
