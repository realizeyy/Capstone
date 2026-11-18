/* The Print and Back buttons on the printable record and report pages. */
document.querySelectorAll('[data-print-page]').forEach(function (button) {
  button.addEventListener('click', function () { window.print(); });
});

document.querySelectorAll('[data-back-page]').forEach(function (button) {
  button.addEventListener('click', function (e) {
    e.preventDefault();
    var fallback = button.getAttribute('data-back-url') || '/';
    // If opened in a new tab/window, close it directly so user returns to the portal tab
    try {
      window.close();
    } catch (err) {}

    // Fallback if browser security prevents closing: navigate back or to fallback URL
    setTimeout(function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = fallback;
      }
    }, 120);
  });
});

// Toggle between full record (with attachment status) and personal info only on Clergy Personal Record.
(function () {
  var scopeButtons = document.querySelectorAll('[data-print-scope]');
  if (!scopeButtons.length) return;

  var attachmentsSection = document.getElementById('attachments-section');
  var downloadLink = document.querySelector('[data-download-record]');

  function syncScopeUI(mode) {
    var showAttachments = mode !== 'personal';
    scopeButtons.forEach(function (btn) {
      var isCurrent = btn.getAttribute('data-print-scope') === mode;
      btn.classList.toggle('is-selected', isCurrent);
      btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
    });
    if (attachmentsSection) {
      attachmentsSection.hidden = !showAttachments;
    }
    if (downloadLink) {
      var base = downloadLink.getAttribute('data-download-base') || downloadLink.getAttribute('href').split('?')[0];
      downloadLink.setAttribute('href', showAttachments ? base : base + '?include_attachments=0');
    }
  }

  scopeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mode = btn.getAttribute('data-print-scope');
      var targetUrl = btn.getAttribute('data-scope-url');
      if (mode === 'include' && !attachmentsSection) {
        if (targetUrl) window.location.replace(targetUrl);
        return;
      }
      syncScopeUI(mode);
      if (targetUrl && window.history && typeof window.history.replaceState === 'function') {
        try {
          window.history.replaceState(null, '', targetUrl);
        } catch (err) {}
      }
    });
  });
})();
