/* Interactive skeleton loading: when the user follows an in-site link, the
   page body is swapped for a shimmering placeholder until the next page
   arrives; submitting a form puts its button into a busy state. */
(function () {
  var SKIP_PATH = /\/(download|view|preview|database)\//;

  var bar = null;
  function progress(on) {
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'sk-progress';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
    }
    bar.classList.toggle('on', on);
  }

  function line(w, cls) { return '<span class="sk-line ' + (w || '') + ' ' + (cls || '') + '"></span>'; }

  function rows(n) {
    var out = '';
    for (var i = 0; i < n; i++) {
      out += '<div class="sk-row">' + line('w90') + line('w70') + line('w50') + '<span class="sk-btn"></span></div>';
    }
    return out;
  }

  function buildSkeleton(withCards) {
    var wrap = document.createElement('div');
    wrap.className = 'sk-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    var html = '<div class="sk-status"><span class="sk-spinner"></span>Loading…</div>';
    if (withCards) {
      html += '<div class="sk-cards">' +
        '<div class="sk-card">' + line('w50') + line('w30', 'lg') + line('w70') + '</div>' +
        '<div class="sk-card">' + line('w50') + line('w30', 'lg') + line('w70') + '</div></div>';
    }
    html += '<div class="sk-panel">' + line('w30', 'lg') + line('w50') + '<div class="sk-rows">' + rows(6) + '</div></div>';
    wrap.innerHTML = html;
    return wrap;
  }

  function showSkeleton(link) {
    var main = document.querySelector('main');
    if (!main || main.classList.contains('is-loading')) return;
    var path = link ? link.getAttribute('href') : '';
    var withCards = /\/dashboard\/?$/.test(path);
    progress(true);
    if (link) link.classList.add('is-pending');
    main.classList.add('is-loading');
    main.appendChild(buildSkeleton(withCards));
    window.scrollTo(0, 0);
  }

  var skeletonTimer = null;

  function clearSkeleton() {
    if (skeletonTimer) {
      clearTimeout(skeletonTimer);
      skeletonTimer = null;
    }
    progress(false);
    document.querySelectorAll('.is-pending').forEach(function (n) { n.classList.remove('is-pending'); });
    document.querySelectorAll('.is-submitting').forEach(function (f) { f.classList.remove('is-submitting'); });
    document.querySelectorAll('.is-busy, [aria-busy="true"]').forEach(function (b) {
      b.classList.remove('is-busy');
      b.removeAttribute('aria-busy');
    });
    var main = document.querySelector('main');
    if (!main) return;
    main.classList.remove('is-loading');
    main.querySelectorAll('.sk-wrap').forEach(function (n) { n.remove(); });
  }
  window.ednpClearSkeleton = clearSkeleton;

  function isAsyncManagedForm(form) {
    if (!form) return false;
    var action = (form.getAttribute && form.getAttribute('action')) || '';
    return form.classList.contains('slip-form') ||
           form.classList.contains('doc-card-upload') ||
           Boolean(form.closest && form.closest('#quickUploadModal')) ||
           form.id === 'linkAccountForm' ||
           form.id === 'resetAccountForm' ||
           form.id === 'bulkConfirmForm' ||
           form.id === 'createRecordForm' ||
           form.dataset.asyncSubmit === 'true' ||
           /\/clergy-records\/([^/]+\/)?(create|link-account|reset-account)/.test(action) ||
           /\/account-security\/(\d+\/)?reset\//.test(action);
  }

  /* Custom Centered In-App Confirmation Modal */
  function ensureConfirmModal() {
    var modal = document.getElementById('ednpConfirmModal');
    if (modal) return modal;

    // Inject fallback scoped styles into head so styling is 100% immune to asset cache lag
    if (!document.getElementById('ednpConfirmStyles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'ednpConfirmStyles';
      styleEl.textContent =
        '#ednpConfirmModal{z-index:99999!important;display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:center;justify-content:center;overscroll-behavior:contain;}' +
        '#ednpConfirmModal.show{display:flex!important;animation:modalBackdropFadeIn .18s cubic-bezier(.16,1,.3,1) both;}' +
        '#ednpConfirmModal .ednp-confirm-card{width:min(440px,calc(100vw - 32px))!important;max-width:440px!important;background:#fff!important;border:1px solid #e2e8f0!important;border-radius:16px!important;box-shadow:0 24px 48px -12px rgba(15,23,42,.25),0 0 0 1px rgba(15,23,42,.08)!important;padding:24px!important;display:flex!important;flex-direction:column!important;box-sizing:border-box!important;overscroll-behavior:contain;animation:modalBoxEnter .22s cubic-bezier(.16,1,.3,1) both!important;}' +
        '#ednpConfirmModal .ednp-confirm-topbar{display:flex!important;align-items:center!important;justify-content:space-between!important;margin-bottom:16px!important;}' +
        '#ednpConfirmModal .ednp-confirm-icon{width:48px!important;height:48px!important;border-radius:12px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:20px!important;flex-shrink:0!important;}' +
        '#ednpConfirmModal .ednp-confirm-icon.replace{background:#eff6ff!important;color:#2563eb!important;border:1px solid #bfdbfe!important;box-shadow:0 0 0 4px #f0f9ff!important;}' +
        '#ednpConfirmModal .ednp-confirm-icon.danger{background:#fef2f2!important;color:#dc2626!important;border:1px solid #fecaca!important;box-shadow:0 0 0 4px #fff1f2!important;}' +
        '#ednpConfirmModal .ednp-confirm-icon.warning{background:#fffbeb!important;color:#d97706!important;border:1px solid #fde68a!important;box-shadow:0 0 0 4px #fefce8!important;}' +
        '#ednpConfirmModal .ednp-confirm-icon.neutral{background:#f1f5f9!important;color:#475569!important;border:1px solid #cbd5e1!important;box-shadow:0 0 0 4px #f8fafc!important;}' +
        '#ednpConfirmModal .ednp-confirm-close{width:32px!important;height:32px!important;border:none!important;background:transparent!important;border-radius:8px!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#94a3b8!important;cursor:pointer!important;font-size:16px!important;transition:all .15s ease!important;}' +
        '#ednpConfirmModal .ednp-confirm-close:hover{background:#f1f5f9!important;color:#334155!important;}' +
        '#ednpConfirmModal .ednp-confirm-title{margin:0 0 8px 0!important;font-size:18px!important;font-weight:700!important;color:#0f172a!important;line-height:1.3!important;}' +
        '#ednpConfirmModal .ednp-confirm-lead{margin:0 0 14px 0!important;font-size:14.5px!important;line-height:1.55!important;color:#334155!important;}' +
        '#ednpConfirmModal .ednp-confirm-callout{display:flex!important;align-items:flex-start!important;gap:10px!important;padding:12px 14px!important;border-radius:10px!important;font-size:14px!important;line-height:1.45!important;margin-bottom:20px!important;}' +
        '#ednpConfirmModal .ednp-confirm-callout.ednp-callout-warn{background:#fffbeb!important;border:1px solid #fef08a!important;color:#92400e!important;}' +
        '#ednpConfirmModal .ednp-confirm-callout.ednp-callout-danger{background:#fef2f2!important;border:1px solid #fecaca!important;color:#991b1b!important;}' +
        '#ednpConfirmModal .ednp-confirm-callout i{font-size:15px!important;margin-top:2px!important;flex-shrink:0!important;}' +
        '#ednpConfirmModal .ednp-confirm-actions{display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:10px!important;margin-top:4px!important;padding-top:16px!important;border-top:1px solid #f1f5f9!important;}' +
        '#ednpConfirmModal .ednp-confirm-actions .btn{min-width:100px!important;padding:10px 18px!important;border-radius:8px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;box-sizing:border-box!important;}' +
        '#ednpConfirmModal .ednp-confirm-actions .btn.secondary{background:#fff!important;border:1px solid #cbd5e1!important;color:#334155!important;}' +
        '#ednpConfirmModal .ednp-confirm-actions .btn.secondary:hover{background:#f8fafc!important;border-color:#94a3b8!important;}' +
        '#ednpConfirmModal .ednp-confirm-actions .btn:not(.secondary):not(.danger){background:#2563eb!important;border:1px solid #1d4ed8!important;color:#fff!important;}' +
        '#ednpConfirmModal .ednp-confirm-actions .btn:not(.secondary):not(.danger):hover{background:#1d4ed8!important;}' +
        '#ednpConfirmModal .ednp-confirm-actions .btn.danger{background:#dc2626!important;border:1px solid #b91c1c!important;color:#fff!important;}' +
        '#ednpConfirmModal .ednp-confirm-actions .btn.danger:hover{background:#b91c1c!important;}';
      document.head.appendChild(styleEl);
    }

    modal = document.createElement('div');
    modal.id = 'ednpConfirmModal';
    modal.className = 'modal-bg';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'ednpConfirmTitle');
    modal.setAttribute('aria-describedby', 'ednpConfirmMsg');
    modal.innerHTML =
      '<div class="modal ednp-confirm-card">' +
        '<div class="ednp-confirm-topbar">' +
          '<div class="ednp-confirm-icon" id="ednpConfirmIcon">' +
            '<i class="fa-solid fa-rotate"></i>' +
          '</div>' +
          '<button type="button" class="ednp-confirm-close" id="ednpConfirmCloseBtn" aria-label="Close dialog">' +
            '<i class="fa-solid fa-xmark"></i>' +
          '</button>' +
        '</div>' +
        '<div class="ednp-confirm-content">' +
          '<h3 id="ednpConfirmTitle" class="ednp-confirm-title">Confirm Action</h3>' +
          '<div id="ednpConfirmMsg"></div>' +
        '</div>' +
        '<div class="ednp-confirm-actions">' +
          '<button type="button" class="btn secondary" id="ednpConfirmCancelBtn">Cancel</button>' +
          '<button type="button" class="btn" id="ednpConfirmOkBtn">Confirm</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }

  function formatConfirmBody(msg, isReplace, isDelete, isLogout) {
    if (!msg) return '';
    var qIdx = msg.indexOf('?');
    if (qIdx !== -1) {
      var question = msg.slice(0, qIdx + 1).trim();
      var consequence = msg.slice(qIdx + 1).trim();

      // Highlight target subject if present
      var formattedQ = question.replace(/(for\s+)([^?]+)/i, '$1<strong style="color:#0f172a;font-weight:600;">$2</strong>');
      var html = '<p class="ednp-confirm-lead">' + formattedQ + '</p>';
      if (consequence) {
        var calloutClass = (isDelete || isLogout) ? 'ednp-callout-danger' : 'ednp-callout-warn';
        var calloutIcon = (isDelete || isLogout) ? 'fa-triangle-exclamation' : 'fa-circle-info';
        html += '<div class="ednp-confirm-callout ' + calloutClass + '">' +
          '<i class="fa-solid ' + calloutIcon + '"></i>' +
          '<span>' + consequence + '</span>' +
        '</div>';
      }
      return html;
    }
    return '<p class="ednp-confirm-lead">' + msg + '</p>';
  }

  window.appConfirm = function (message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var modal = ensureConfirmModal();
      var titleEl = document.getElementById('ednpConfirmTitle');
      var msgEl = document.getElementById('ednpConfirmMsg');
      var iconEl = document.getElementById('ednpConfirmIcon');
      var okBtn = document.getElementById('ednpConfirmOkBtn');
      var cancelBtn = document.getElementById('ednpConfirmCancelBtn');
      var closeBtn = document.getElementById('ednpConfirmCloseBtn');

      var isLogout = opts.isLogout || /log\s*out|sign\s*out/i.test(message);
      var isReplace = opts.isReplace || /replace|overwrite/i.test(message);
      var isDelete = opts.isDelete || /delete|remove|archive|reset|revoke/i.test(message);

      var title = opts.title || (isLogout ? 'Confirm Logout' : (isReplace ? 'Confirm Replacement' : (isDelete ? 'Confirm Action' : 'Please Confirm')));
      titleEl.textContent = title;
      msgEl.innerHTML = formatConfirmBody(message, isReplace, isDelete, isLogout);

      if (isLogout) {
        iconEl.className = 'ednp-confirm-icon danger';
        iconEl.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
        okBtn.className = 'btn danger';
        okBtn.textContent = opts.confirmText || 'Log Out';
        cancelBtn.textContent = opts.cancelText || 'Stay Logged In';
      } else if (isReplace) {
        iconEl.className = 'ednp-confirm-icon replace';
        iconEl.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        okBtn.className = 'btn';
        okBtn.textContent = opts.confirmText || 'Replace Document';
        cancelBtn.textContent = opts.cancelText || 'Cancel';
      } else if (isDelete) {
        iconEl.className = 'ednp-confirm-icon danger';
        iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        okBtn.className = 'btn danger';
        var defText = /archive/i.test(message) ? 'Archive Record' : (/reset/i.test(message) ? 'Reset Password' : 'Delete');
        okBtn.textContent = opts.confirmText || defText;
        cancelBtn.textContent = opts.cancelText || 'Cancel';
      } else {
        iconEl.className = 'ednp-confirm-icon neutral';
        iconEl.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
        okBtn.className = 'btn';
        okBtn.textContent = opts.confirmText || 'Confirm';
        cancelBtn.textContent = opts.cancelText || 'Cancel';
      }

      function close(result) {
        modal.classList.remove('show');
        if (typeof window.syncBodyScrollLock === 'function') {
          window.syncBodyScrollLock();
        } else {
          document.body.classList.remove('modal-open');
        }
        cleanup();
        resolve(result);
      }

      function onOk() { close(true); }
      function onCancel() { close(false); }
      function onKey(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close(false);
        }
      }
      function onBackdrop(e) {
        if (e.target === modal) {
          close(false);
        }
      }
      function onWheel(e) {
        if (e.target === modal) {
          e.preventDefault();
        }
      }

      function cleanup() {
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        if (closeBtn) closeBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdrop);
        modal.removeEventListener('wheel', onWheel);
        document.removeEventListener('keydown', onKey);
      }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      if (closeBtn) closeBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);
      modal.addEventListener('wheel', onWheel, { passive: false });
      document.addEventListener('keydown', onKey);

      modal.classList.add('show');
      if (typeof window.syncBodyScrollLock === 'function') {
        window.syncBodyScrollLock();
      } else {
        document.body.classList.add('modal-open');
      }
      cancelBtn.focus();
    });
  };

  document.addEventListener('click', function (e) {
    // 1. Explicit intercept for logout triggers in capture phase
    var logoutTrigger = e.target.closest && e.target.closest('.nav-logout, a[href*="logout"]');
    if (logoutTrigger) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var logoutMsg = logoutTrigger.getAttribute('data-confirm') ||
                      (logoutTrigger.dataset && logoutTrigger.dataset.confirm) ||
                      'Log out of your EDNP session? Any unsaved edits will be lost.';
      window.appConfirm(logoutMsg, {
        title: 'Confirm Logout',
        confirmText: 'Log Out',
        cancelText: 'Stay Logged In',
        isLogout: true
      }).then(function (ok) {
        if (ok && logoutTrigger.href) {
          window.location.href = logoutTrigger.href;
        }
      });
      return;
    }

    // 2. Generic data-confirm for buttons and links
    var trigger = e.target.closest && e.target.closest('[data-confirm]');
    if (trigger && (trigger.tagName === 'A' || (trigger.tagName === 'BUTTON' && trigger.type === 'button'))) {
      var msg = trigger.getAttribute('data-confirm') || (trigger.dataset && trigger.dataset.confirm);
      if (msg) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var isDel = /delete|remove|archive|reset|revoke/i.test(msg);
        var isRep = /replace|overwrite/i.test(msg);
        window.appConfirm(msg, { isDelete: isDel, isReplace: isRep }).then(function (confirmed) {
          if (!confirmed) return;
          if (trigger.tagName === 'A' && trigger.href) {
            window.location.href = trigger.href;
          }
        });
        return;
      }
    }

    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    if (a.origin !== location.origin || SKIP_PATH.test(a.pathname)) return;
    if (a.pathname === location.pathname && a.search === location.search) return;
    showSkeleton(a);
  }, true);

  document.addEventListener('submit', function (e) {
    if (e.defaultPrevented) return;
    var form = e.target;

    if (form._isConfirmed) {
      delete form._isConfirmed;
    } else {
      var submitter = e.submitter;
      var confirmMsg = (submitter && (submitter.getAttribute('data-confirm') || (submitter.dataset && submitter.dataset.confirm))) ||
                       (form.dataset && form.dataset.confirm) ||
                       (form.getAttribute && form.getAttribute('data-confirm'));

      if (confirmMsg) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.appConfirm(confirmMsg).then(function (ok) {
          if (!ok) return;
          form._isConfirmed = true;
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit(submitter || undefined);
          } else {
            form.submit();
          }
        });
        return;
      }
    }

    if (form.target && form.target !== '_self') return;
    if (form.classList.contains('is-submitting')) {
      e.preventDefault();
      return;
    }
    form.classList.add('is-submitting');
    var btn = e.submitter || form.querySelector('button[type=submit],button:not([type]),input[type=submit]');
    progress(true);
    var asyncManaged = isAsyncManagedForm(form);
    if (skeletonTimer) {
      clearTimeout(skeletonTimer);
      skeletonTimer = null;
    }
    // Async fetch forms clear skeleton explicitly when their request finishes;
    // standard POSTs (which may return a file download without navigating) keep a 60s safety fallback.
    if (!asyncManaged) {
      skeletonTimer = setTimeout(clearSkeleton, 60000);
      if (typeof showToast === 'function') {
        showToast(form.querySelector('input[type=file]') ? 'Uploading...' : 'Working on it...', 'working');
      }
    }
    if (btn) {
      btn.setAttribute('aria-busy', 'true');
      // Defer so the button's own value is still submitted
      setTimeout(function () { btn.classList.add('is-busy'); }, 0);
    }
  }, true);

  // Icon-only nav on phones: keep every link labelled for hover/screen readers
  document.querySelectorAll('.sidebar .nav a').forEach(function (a) {
    var label = (a.textContent || '').replace(/\s+/g, ' ').replace(/\d+\/\d+|\d+$/, '').trim();
    if (label) { a.title = label; a.setAttribute('aria-label', label); }
  });

  // Universal password visibility toggle
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-toggle-password]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var wrap = btn.closest('.pwd-input-wrap') || btn.parentElement;
    var input = wrap ? wrap.querySelector('input') : null;
    if (!input) return;
    var isShowing = input.type === 'text';
    input.type = isShowing ? 'password' : 'text';
    btn.setAttribute('aria-label', isShowing ? 'Show password' : 'Hide password');
    btn.title = isShowing ? 'Show password' : 'Hide password';
    var icon = btn.querySelector('i');
    if (icon) {
      icon.className = isShowing ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    }
    try {
      if (document.activeElement === input) {
        var pos = input.value.length;
        input.setSelectionRange(pos, pos);
      }
    } catch (_) {}
  });

  // Back/forward cache restores the old page with the skeleton still on it
  window.addEventListener('pageshow', clearSkeleton);
})();
