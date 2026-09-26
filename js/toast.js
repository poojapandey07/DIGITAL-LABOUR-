/**
 * DIGITAL LABOR CHOWK - TOAST UTILITY (js/toast.js)
 * Clean, stackable, auto-dismissing notifications for feedback.
 */

function ensureToastContainer() {
  let container = document.getElementById('dlc-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'dlc-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification
 * @param {string} message - Message text to display
 * @param {'success'|'error'|'info'|'warning'} type - Visual theme of toast
 * @param {number} duration - Auto-dismiss timeout in milliseconds (default: 3500ms)
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  // Choose appropriate icon
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  else if (type === 'error') icon = '❌';
  else if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <div class="toast-content">${message}</div>
    <button type="button" class="toast-close-btn" aria-label="Close notification">&times;</button>
  `;

  container.appendChild(toast);

  // Trigger smooth slide-in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Close handler
  const closeToast = () => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, { once: true });
  };

  // Wire up close button
  const closeBtn = toast.querySelector('.toast-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeToast();
    });
  }

  // Also dismiss when tapping the toast body
  toast.addEventListener('click', closeToast);

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(closeToast, duration);
  }

  return toast;
}

// Global window attachment for accessibility across scripts
window.showToast = showToast;
