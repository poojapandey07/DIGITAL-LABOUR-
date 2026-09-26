/**
 * DIGITAL LABOR CHOWK - MAIN UI & PWA SCRIPT (js/main.js)
 * Header synchronization, slide-out mobile drawer, bottom nav bar,
 * PWA installation prompt, service worker registration, and reusable renderers.
 */

let deferredInstallPrompt = null;

document.addEventListener('DOMContentLoaded', () => {
  initServiceWorker();
  initPWAInstall();
  initHeader();
  initMobileDrawer();
  initMobileBottomNav();
  initFooterActions();
});

/**
 * 1. Register Service Worker for PWA
 */
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const isInsidePages = window.location.pathname.includes('/pages/');
      const swPath = isInsidePages ? '../sw.js' : './sw.js';
      
      navigator.serviceWorker.register(swPath)
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.log('[PWA] Service Worker registration failed:', err);
        });
    });
  }
}

/**
 * 2. PWA Installation Handler
 */
function initPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredInstallPrompt = e;

    // Show custom mobile install banner if present
    const pwaBar = document.getElementById('dlc-pwa-banner');
    if (pwaBar) {
      pwaBar.classList.add('visible');
    }

    const drawerInstallBtn = document.getElementById('drawer-install-btn');
    if (drawerInstallBtn) {
      drawerInstallBtn.style.display = 'flex';
    }
  });

  // Wire install button clicks
  document.addEventListener('click', (e) => {
    if (e.target && (e.target.matches('.btn-install-pwa') || e.target.closest('.btn-install-pwa'))) {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            if (typeof showToast === 'function') {
              showToast('डिजिटल लेबर चौक ऐप इंस्टॉल हो रहा है...', 'success');
            }
          }
          deferredInstallPrompt = null;
          const pwaBar = document.getElementById('dlc-pwa-banner');
          if (pwaBar) pwaBar.classList.remove('visible');
        });
      } else {
        if (typeof showToast === 'function') {
          showToast('यह ब्राउज़र मेन्यू में जाकर "Add to Home Screen" चुनें।', 'info');
        }
      }
    }

    if (e.target && e.target.matches('.pwa-close-btn')) {
      const pwaBar = document.getElementById('dlc-pwa-banner');
      if (pwaBar) pwaBar.classList.remove('visible');
    }
  });
}

/**
 * 3. Initialize Header Session Display & Hamburger Button
 */
function initHeader() {
  const navAuthContainer = document.getElementById('nav-auth-container');
  const session = AuthManager.getSession();
  const isInsidePages = window.location.pathname.includes('/pages/');
  const rootPrefix = isInsidePages ? '../' : './';
  const pagesPrefix = isInsidePages ? '' : 'pages/';

  if (navAuthContainer) {
    if (session) {
      const roleLabel = session.role === 'worker' ? '👷 श्रमिक' : '🏢 नियोक्ता';
      const initial = session.name ? session.name.charAt(0).toUpperCase() : 'U';
      const dashboardLink = session.role === 'worker' 
        ? `${pagesPrefix}worker-dashboard.html` 
        : `${pagesPrefix}post-job.html`;

      navAuthContainer.innerHTML = `
        <a href="${dashboardLink}" class="user-badge" title="Go to Dashboard" style="text-decoration:none;">
          <div class="user-avatar-mini">${initial}</div>
          <div class="user-name-role">
            <span class="name">${escapeHTML(session.name)}</span>
            <span class="role-tag">${roleLabel}</span>
          </div>
        </a>
        <button type="button" id="header-logout-btn" class="btn btn-outline-white btn-sm" title="Logout">
          लॉगआउट
        </button>
      `;

      const logoutBtn = document.getElementById('header-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          AuthManager.logout(`${rootPrefix}index.html`);
        });
      }
    } else {
      navAuthContainer.innerHTML = `
        <a href="${pagesPrefix}worker-login.html" class="btn btn-outline-white btn-sm">
          👷 श्रमिक
        </a>
        <a href="${pagesPrefix}employer-login.html" class="btn btn-accent btn-sm">
          🏢 नियोक्ता
        </a>
      `;
    }
  }

  // Highlight active link in desktop navbar
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.nav-menu .nav-link');
  navLinks.forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (currentPath.endsWith(href) || (href.endsWith('index.html') && (currentPath.endsWith('/') || currentPath.endsWith('index.html')))) {
      link.classList.add('active');
    }
  });

  // Ensure hamburger button exists in navbar
  ensureHamburgerButton();
}

/**
 * 4. Ensure Hamburger Button in Header
 */
function ensureHamburgerButton() {
  const navbar = document.querySelector('.navbar');
  if (!navbar || document.querySelector('.mobile-toggle-btn')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mobile-toggle-btn';
  btn.setAttribute('aria-label', 'Open navigation menu');
  btn.innerHTML = '☰';
  navbar.appendChild(btn);

  btn.addEventListener('click', () => {
    openMobileDrawer();
  });
}

/**
 * 5. Initialize Mobile Slide-out Drawer
 */
function initMobileDrawer() {
  let drawer = document.getElementById('dlc-mobile-drawer');
  let backdrop = document.getElementById('dlc-drawer-backdrop');

  const isInsidePages = window.location.pathname.includes('/pages/');
  const rootPrefix = isInsidePages ? '../' : './';
  const pagesPrefix = isInsidePages ? '' : 'pages/';
  const session = AuthManager.getSession();

  if (!drawer) {
    backdrop = document.createElement('div');
    backdrop.id = 'dlc-drawer-backdrop';
    backdrop.className = 'drawer-backdrop';
    document.body.appendChild(backdrop);

    drawer = document.createElement('aside');
    drawer.id = 'dlc-mobile-drawer';
    drawer.className = 'mobile-drawer';
    document.body.appendChild(drawer);
  }

  // Populate drawer content
  let userSectionHTML = '';
  if (session) {
    const roleLabel = session.role === 'worker' ? '👷 पंजीकृत श्रमिक (Worker)' : '🏢 पंजीकृत नियोक्ता (Employer)';
    userSectionHTML = `
      <div class="drawer-user-card">
        <div class="flex items-center gap-3">
          <div class="user-avatar-mini" style="width:36px; height:36px; font-size:16px;">
            ${session.name ? session.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style="flex:1; overflow:hidden;">
            <div style="font-weight:700; color:#ffffff; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">
              ${escapeHTML(session.name)}
            </div>
            <div style="font-size:11px; color:var(--accent-saffron); font-weight:600;">
              ${roleLabel}
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    userSectionHTML = `
      <div class="drawer-user-card text-center">
        <p style="font-size:12px; color:#cbd5e1; margin-bottom:10px;">पोर्टल में प्रवेश करें (Login/Signup)</p>
        <div class="flex gap-2">
          <a href="${pagesPrefix}worker-login.html" class="btn btn-outline-white btn-sm" style="flex:1;">👷 श्रमिक</a>
          <a href="${pagesPrefix}employer-login.html" class="btn btn-accent btn-sm" style="flex:1;">🏢 नियोक्ता</a>
        </div>
      </div>
    `;
  }

  drawer.innerHTML = `
    <div class="drawer-header">
      <div class="flex items-center gap-2">
        <div class="brand-emblem" style="width:32px; height:32px; font-size:18px;">🏛️</div>
        <span style="font-weight:800; font-size:15px; color:#ffffff;">डिजिटल लेबर चौक</span>
      </div>
      <button type="button" class="drawer-close-btn" id="drawer-close-btn" aria-label="Close menu">&times;</button>
    </div>

    ${userSectionHTML}

    <nav class="drawer-nav">
      <a href="${rootPrefix}index.html" class="drawer-nav-item">
        <span class="drawer-icon">🏠</span>
        <span>होम (Home)</span>
      </a>
      <a href="${pagesPrefix}job-search.html" class="drawer-nav-item">
        <span class="drawer-icon">🔎</span>
        <span>काम खोजें (Search Jobs)</span>
      </a>
      <a href="${session && session.role === 'employer' ? pagesPrefix + 'post-job.html' : pagesPrefix + 'worker-dashboard.html'}" class="drawer-nav-item">
        <span class="drawer-icon">📊</span>
        <span>${session && session.role === 'employer' ? 'नया काम पोस्ट करें' : 'श्रमिक डैशबोर्ड'}</span>
      </a>
      <a href="${pagesPrefix}worker-profile.html" class="drawer-nav-item">
        <span class="drawer-icon">👤</span>
        <span>कारीगर प्रोफाइल (Profile)</span>
      </a>
      <a href="tel:14434" class="drawer-nav-item" style="color:#4ade80;">
        <span class="drawer-icon">📞</span>
        <span>श्रम हेल्पलाइन: 14434</span>
      </a>
    </nav>

    <div class="drawer-footer">
      <button type="button" class="btn btn-accent btn-sm btn-install-pwa" id="drawer-install-btn" style="width:100%;">
        📲 फोन में ऐप इंस्टॉल करें (Install)
      </button>

      ${session ? `
        <button type="button" id="drawer-logout-btn" class="btn btn-outline-white btn-sm" style="width:100%;">
          लॉगआउट (Logout)
        </button>
      ` : ''}

      <div class="text-center text-muted" style="font-size:11px; margin-top:4px;">
        वर्जन: 2.0 (PWA Mobile Ready)
      </div>
    </div>
  `;

  // Close handlers
  const closeBtn = document.getElementById('drawer-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeMobileDrawer);
  if (backdrop) backdrop.addEventListener('click', closeMobileDrawer);

  const drawerLogoutBtn = document.getElementById('drawer-logout-btn');
  if (drawerLogoutBtn) {
    drawerLogoutBtn.addEventListener('click', () => {
      closeMobileDrawer();
      AuthManager.logout(`${rootPrefix}index.html`);
    });
  }
}

function openMobileDrawer() {
  const drawer = document.getElementById('dlc-mobile-drawer');
  const backdrop = document.getElementById('dlc-drawer-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('open');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

function closeMobileDrawer() {
  const drawer = document.getElementById('dlc-mobile-drawer');
  const backdrop = document.getElementById('dlc-drawer-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('open');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * 6. Sync Mobile Bottom Navigation Bar
 */
function initMobileBottomNav() {
  const bottomNav = document.querySelector('.mobile-bottom-nav');
  if (!bottomNav) return;

  const session = AuthManager.getSession();
  const isInsidePages = window.location.pathname.includes('/pages/');
  const rootPrefix = isInsidePages ? '../' : './';
  const pagesPrefix = isInsidePages ? '' : 'pages/';

  // Adjust dashboard link depending on role
  const dashboardItem = document.getElementById('bottom-nav-dashboard');
  if (dashboardItem) {
    if (!session) {
      dashboardItem.href = `${pagesPrefix}worker-login.html`;
      dashboardItem.innerHTML = `<span class="nav-icon">🔑</span><span>लॉगिन</span>`;
    } else if (session.role === 'worker') {
      dashboardItem.href = `${pagesPrefix}worker-dashboard.html`;
      dashboardItem.innerHTML = `<span class="nav-icon">📊</span><span>डैशबोर्ड</span>`;
    } else {
      dashboardItem.href = `${pagesPrefix}post-job.html`;
      dashboardItem.innerHTML = `<span class="nav-icon">📝</span><span>जॉब पोस्ट</span>`;
    }
  }

  // Adjust profile/account link
  const profileItem = document.getElementById('bottom-nav-profile');
  if (profileItem) {
    if (session && session.role === 'worker') {
      profileItem.href = `${pagesPrefix}worker-profile.html`;
      profileItem.innerHTML = `<span class="nav-icon">👤</span><span>प्रोफाइल</span>`;
    } else if (session && session.role === 'employer') {
      profileItem.href = `${pagesPrefix}post-job.html`;
      profileItem.innerHTML = `<span class="nav-icon">🏢</span><span>खाता</span>`;
    } else {
      profileItem.href = `${pagesPrefix}employer-login.html`;
      profileItem.innerHTML = `<span class="nav-icon">🏢</span><span>नियोक्ता</span>`;
    }
  }

  // Highlight current page in bottom nav
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  const bottomLinks = bottomNav.querySelectorAll('.bottom-nav-item');
  bottomLinks.forEach(link => {
    const linkFile = (link.getAttribute('href') || '').split('/').pop();
    if (linkFile === currentFile) {
      link.classList.add('active');
    }
  });
}

/**
 * 7. Footer Actions
 */
function initFooterActions() {
  const resetBtns = document.querySelectorAll('#btn-reset-demo-data, .btn-reset-demo-data');
  resetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('क्या आप डेमो डेटा को रीसेट करना चाहते हैं? (Reset all demo data to default?)')) {
        StorageDB.resetAllData();
        if (typeof showToast === 'function') {
          showToast('डेमो डेटा सफलतापूर्वक रीसेट किया गया (Demo data reset)', 'success');
        }
        setTimeout(() => {
          window.location.reload();
        }, 600);
      }
    });
  });
}

/**
 * 8. Reusable Job Card HTML
 */
function createJobCardHTML(job, hasApplied = false, showApplyBtn = true) {
  const timeText = JobManager.timeAgo(job.postedAt);
  const durationText = JobManager.formatDuration(job.duration);

  let actionButton = '';
  if (showApplyBtn) {
    if (hasApplied) {
      actionButton = `<button class="btn btn-sm btn-outline disabled" disabled>✓ आवेदन किया (Applied)</button>`;
    } else {
      actionButton = `<button class="btn btn-sm btn-accent btn-apply-job" data-job-id="${job.id}">आवेदन करें (Apply)</button>`;
    }
  }

  return `
    <div class="job-card" data-job-id="${job.id}">
      <div class="job-card-header">
        <div>
          <span class="badge badge-saffron mb-2">${escapeHTML(job.category)}</span>
          <h3 class="job-title">${escapeHTML(job.title)}</h3>
        </div>
        <div class="job-wage-tag">
          ₹${job.wage} <span style="font-size:0.75rem; font-weight:normal;">/ ${job.wageType || 'दिन'}</span>
        </div>
      </div>

      <div class="job-meta-grid">
        <span class="job-meta-item">📍 ${escapeHTML(job.location)}</span>
        <span class="job-meta-item">⏱️ ${durationText}</span>
        <span class="job-meta-item">👷 ${job.workersNeeded} मजदूर चाहिए</span>
      </div>

      <p class="job-desc">${escapeHTML(job.description)}</p>

      <div class="job-card-footer">
        <div class="job-employer-name">
          🏢 <span>${escapeHTML(job.employerName || 'नियोक्ता')}</span> • <span class="text-muted">${timeText}</span>
        </div>
        <div>
          ${actionButton}
        </div>
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.createJobCardHTML = createJobCardHTML;
window.escapeHTML = escapeHTML;
window.openMobileDrawer = openMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;
