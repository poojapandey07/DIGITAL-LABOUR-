/**
 * DIGITAL LABOUR CHOWK - COMMON UI LOGIC (js/common.js)
 * Purely visual behavior: Location modal, notification bell, active nav highlighting,
 * header drawer toggle, and back-button navigation.
 * STRICT BACKEND SAFETY: Does not alter any fetch, API, auth, or form validation logic.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLocationSelector();
  initNotificationBell();
  initHeaderAvatar();
  initBackButton();
  highlightActiveBottomNav();
  initHeaderMenuToggle();
  initGlobalSearchBar();
});

/**
 * 1. Location Selector Modal & Persistence
 */
function initLocationSelector() {
  const trigger = document.querySelector('.location-dropdown');
  if (!trigger) return;

  // Retrieve stored location or default to New Delhi
  const savedLocation = localStorage.getItem('dlc_selected_city') || 'नई दिल्ली, भारत';
  updateLocationText(savedLocation);

  // Create Location Picker Modal if not present
  let modal = document.getElementById('location-picker-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'location-picker-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box">
        <span class="modal-drag-handle" aria-hidden="true"></span>
        <div class="modal-header">
          <h3 class="modal-title">📍 अपना शहर चुनें (Select Location)</h3>
          <button type="button" class="modal-close-btn" id="close-location-modal" aria-label="Close">&times;</button>
        </div>
        <div class="location-list">
          <button type="button" class="location-item-btn" data-city="नई दिल्ली, भारत">🏛️ नई दिल्ली (New Delhi)</button>
          <button type="button" class="location-item-btn" data-city="नोएडा, उ.प्र.">🏢 नोएडा (Noida)</button>
          <button type="button" class="location-item-btn" data-city="गुरुग्राम, हरियाणा">🏙️ गुरुग्राम (Gurugram)</button>
          <button type="button" class="location-item-btn" data-city="जयपुर, राजस्थान">🏰 जयपुर (Jaipur)</button>
          <button type="button" class="location-item-btn" data-city="लखनऊ, उ.प्र.">🕌 लखनऊ (Lucknow)</button>
          <button type="button" class="location-item-btn" data-city="मुंबई, महाराष्ट्र">🌊 मुंबई (Mumbai)</button>
          <button type="button" class="location-item-btn" data-city="बेंगलुरु, कर्नाटक">💻 बेंगलुरु (Bengaluru)</button>
          <button type="button" class="location-item-btn" data-city="पटना, बिहार">🌾 पटना (Patna)</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('#close-location-modal').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    // City selection
    modal.querySelectorAll('.location-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const city = e.currentTarget.getAttribute('data-city');
        localStorage.setItem('dlc_selected_city', city);
        updateLocationText(city);
        modal.classList.remove('active');
        if (typeof showToast === 'function') {
          showToast(`स्थान बदला गया: ${city}`, 'info');
        }
      });
    });
  }

  // Open modal on click
  trigger.addEventListener('click', () => {
    modal.classList.add('active');
  });
}

function updateLocationText(cityName) {
  const el = document.querySelector('.current-location-text');
  if (el) {
    el.textContent = cityName;
  }
}

/**
 * 2. Notification Bell Popup
 */
function initNotificationBell() {
  const bellBtn = document.querySelector('.header-notif-btn');
  if (!bellBtn) return;

  bellBtn.addEventListener('click', () => {
    if (typeof showToast === 'function') {
      showToast('🔔 आपके क्षेत्र में आज 12 नए काम पोस्ट हुए हैं!', 'info');
    } else {
      alert('🔔 सूचनाएं: आपके क्षेत्र में आज नए काम उपलब्ध हैं।');
    }
  });
}

/**
 * 3. Header Avatar Interaction
 */
function initHeaderAvatar() {
  const avatar = document.querySelector('.header-avatar');
  if (!avatar) return;

  const isInsidePages = window.location.pathname.includes('/pages/');
  const rootPrefix = isInsidePages ? '../' : './';
  const pagesPrefix = isInsidePages ? '' : 'pages/';

  // Sync avatar initial if logged in
  if (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser) {
    const user = AuthManager.getCurrentUser();
    if (user && user.name) {
      avatar.textContent = user.name.charAt(0).toUpperCase();
      avatar.title = `${user.name} (${user.role === 'worker' ? 'श्रमिक' : 'नियोक्ता'})`;
    }
  }

  avatar.addEventListener('click', () => {
    if (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser) {
      const user = AuthManager.getCurrentUser();
      if (user) {
        if (user.role === 'worker') {
          window.location.href = `${pagesPrefix}worker-dashboard.html`;
        } else {
          window.location.href = `${pagesPrefix}post-job.html`;
        }
        return;
      }
    }
    window.location.href = `${pagesPrefix}worker-login.html`;
  });
}

/**
 * 4. Back Arrow Navigation
 */
function initBackButton() {
  const backBtns = document.querySelectorAll('.back-arrow, [data-action="back"]');
  backBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        const isInsidePages = window.location.pathname.includes('/pages/');
        window.location.href = isInsidePages ? '../index.html' : './index.html';
      }
    });
  });
}

/**
 * 5. Active Bottom Nav Highlighting
 */
function highlightActiveBottomNav() {
  const currentPath = window.location.pathname.toLowerCase();
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');

  navItems.forEach(item => {
    item.classList.remove('active');
    const href = (item.getAttribute('href') || '').toLowerCase();
    if (!href) return;

    if (
      currentPath.endsWith(href) ||
      (href.includes('index.html') && (currentPath.endsWith('/') || currentPath.endsWith('index.html')))
    ) {
      item.classList.add('active');
    }
  });
}

/**
 * 6. Header Menu Button (Hamburger Drawer)
 */
function initHeaderMenuToggle() {
  const menuBtn = document.querySelector('.header-menu-btn');
  if (!menuBtn) return;

  menuBtn.addEventListener('click', () => {
    if (typeof openMobileDrawer === 'function') {
      openMobileDrawer();
    } else {
      const drawer = document.getElementById('dlc-mobile-drawer');
      const backdrop = document.getElementById('dlc-drawer-backdrop');
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('visible');
    }
  });
}

/**
 * 7. Global Search Bar Navigation
 */
function initGlobalSearchBar() {
  const searchInputs = document.querySelectorAll('.search-bar-input');
  searchInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = input.value.trim();
        const isInsidePages = window.location.pathname.includes('/pages/');
        const target = isInsidePages ? 'job-search.html' : 'pages/job-search.html';
        window.location.href = `${target}?keyword=${encodeURIComponent(query)}`;
      }
    });
  });
}
