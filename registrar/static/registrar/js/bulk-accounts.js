/* Bulk Create Accounts, review step: updates the Create button count,
   transitions the review table into an explicit success or failure result
   view after submission, and allows reopening generated slips before leaving. */
(function () {
  var form = document.getElementById('bulkConfirmForm');
  if (!form) return;
  var btn = document.getElementById('bulkConfirmBtn');
  var selectedSummary = document.getElementById('bulkSelectedSummary');
  var reviewBar = document.getElementById('bulkReviewBar');
  var reviewSentinel = document.getElementById('bulkReviewSentinel');
  var sidebarEl = document.querySelector('.sidebar');
  var reviewSection = document.getElementById('bulkReviewSection');
  var statusBanner = document.getElementById('bulkStatusBanner');
  var statusTitle = document.getElementById('bulkStatusTitle');
  var statusMsg = document.getElementById('bulkStatusMsg');
  var retryEditBtn = document.getElementById('bulkRetryEditBtn');
  var checkRecordsLink = document.getElementById('bulkCheckRecordsLink');
  var editInputForm = document.getElementById('bulkEditInputForm');
  var resultPanel = document.getElementById('bulkResultPanel');
  var resultTitle = document.getElementById('bulkResultTitle');
  var resultSummary = document.getElementById('bulkResultSummary');
  var reopenSlipsBtn = document.getElementById('bulkReopenSlipsBtn');
  var resultRecordsLink = document.getElementById('bulkResultRecordsLink');

  var tokenInvalidated = false;
  var lastBulkSlips = null;
  var lastSuccessToastText = '';
  var totalRows = form.querySelectorAll('.pick').length;

  function refresh() {
    var n = form.querySelectorAll('.pick:checked').length;
    btn.disabled = tokenInvalidated || n === 0;
    btn.lastChild.textContent = ' Create ' + n + ' account' + (n === 1 ? '' : 's') + ' & open slips';
    if (selectedSummary) {
      selectedSummary.textContent = n + ' of ' + totalRows + ' selected';
    }
  }

  function updateStickyMetrics() {
    if (!reviewBar) return;
    var stickyTop = 0;
    if (sidebarEl) {
      var cs = window.getComputedStyle(sidebarEl);
      if (cs.position === 'sticky') {
        stickyTop = Math.max(0, Math.round(sidebarEl.getBoundingClientRect().height));
      }
    }
    reviewBar.style.setProperty('--bulk-sticky-top', stickyTop + 'px');
    if (reviewSentinel) {
      var rect = reviewSentinel.getBoundingClientRect();
      reviewBar.classList.toggle('is-stuck', rect.top < stickyTop);
    }
  }

  if (reviewBar) {
    window.addEventListener('scroll', updateStickyMetrics, { passive: true });
    window.addEventListener('resize', updateStickyMetrics, { passive: true });
    if (sidebarEl && 'ResizeObserver' in window) {
      new ResizeObserver(updateStickyMetrics).observe(sidebarEl);
    }
    updateStickyMetrics();
  }

  form.addEventListener('change', refresh);
  form.addEventListener('submit', function (e) {
    if (!e.defaultPrevented) {
      if (statusBanner) statusBanner.hidden = true;
      btn.disabled = true;
    }
  });

  if (retryEditBtn && editInputForm) {
    retryEditBtn.addEventListener('click', function () {
      editInputForm.submit();
    });
  }

  if (reopenSlipsBtn) {
    reopenSlipsBtn.addEventListener('click', function () {
      if (!lastBulkSlips || typeof window.openSlipsModal !== 'function') return;
      var count = lastBulkSlips.count;
      window.openSlipsModal(lastBulkSlips.content, {
        backLabel: 'Back to Clergy Records',
        backUrl: '/registrar/clergy-records/',
        isHtml: lastBulkSlips.isHtml,
        subtitle: 'Temporary credentials generated. Print slip and hand to clergy.',
        resultMessage: 'Success: ' + count + ' clergy account' + (count === 1 ? '' : 's') + ' created and ' + count + ' login slip' + (count === 1 ? '' : 's') + ' ready to print.',
        stayOnPageOnClose: true,
        skipAutoPrint: true,
        backToastMessage: lastSuccessToastText
      });
    });
  }

  if (resultRecordsLink) {
    resultRecordsLink.addEventListener('click', function () {
      if (lastSuccessToastText) {
        try {
          sessionStorage.setItem('ednp_pending_toast', JSON.stringify({ message: lastSuccessToastText, level: 'success' }));
        } catch (_) {}
      }
    });
  }

  window.ednpOnBulkAccountsSuccess = function (count, content, isHtml) {
    lastBulkSlips = { count: count, content: content, isHtml: isHtml };
    lastSuccessToastText = 'Created ' + count + ' clergy account' + (count === 1 ? '' : 's') + ' successfully.';
    if (statusBanner) statusBanner.hidden = true;
    if (reviewSection) reviewSection.hidden = true;
    if (resultTitle) {
      resultTitle.textContent = count + ' Account' + (count === 1 ? '' : 's') + ' Created Successfully';
    }
    if (resultSummary) {
      resultSummary.textContent = 'Created ' + count + ' clergy record' + (count === 1 ? '' : 's') + ' and portal account' + (count === 1 ? '' : 's') + ', and generated ' + count + ' printable login slip' + (count === 1 ? '' : 's') + '.';
    }
    if (resultPanel) resultPanel.hidden = false;
  };

  window.ednpOnBulkAccountsError = function (message, opts) {
    opts = opts || {};
    if (opts.expired) {
      tokenInvalidated = true;
    }
    if (statusTitle) {
      statusTitle.textContent = opts.isNetwork ? 'Connection Interrupted During Bulk Creation' : 'Bulk Account Creation Failed';
    }
    if (statusMsg) {
      var detail = message || 'Could not create the selected accounts. Please try again.';
      if (opts.isNetwork) {
        detail += ' Check Clergy Records before retrying so accounts are not duplicated.';
      }
      statusMsg.textContent = detail;
    }
    if (checkRecordsLink) {
      checkRecordsLink.hidden = !opts.isNetwork;
    }
    if (statusBanner) {
      statusBanner.hidden = false;
      statusBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try { statusBanner.focus({ preventScroll: true }); } catch (_) {}
    }
    refresh();
  };

  window.addEventListener('pagehide', function () {
    lastBulkSlips = null;
  });

  refresh();
})();
