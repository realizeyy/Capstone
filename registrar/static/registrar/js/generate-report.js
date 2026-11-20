/* Generate Report: bulk selection checkboxes and async report generation with
   a persistent progress indicator and self-calibrating countdown that remains
   visible until the server confirms success or returns an error. */

document.querySelectorAll('[data-picks]').forEach(function (all) {
  var form = document.getElementById(all.dataset.picks);
  var button = form.querySelector('button[type=submit]');
  var label = button.lastElementChild.textContent;
  var picks = document.querySelectorAll('input[name="report_ids"][form="' + form.id + '"]');
  function ticked() {
    return document.querySelectorAll('input[name="report_ids"][form="' + form.id + '"]:checked').length;
  }
  function refresh() {
    var count = ticked();
    button.disabled = count === 0;
    button.lastElementChild.textContent = count ? label + ' (' + count + ')' : label;
    all.checked = count > 0 && count === picks.length;
    all.indeterminate = count > 0 && count < picks.length;
  }
  all.addEventListener('change', function () {
    picks.forEach(function (pick) { pick.checked = all.checked; });
    refresh();
  });
  picks.forEach(function (pick) { pick.addEventListener('change', refresh); });
  if ('confirmPicked' in form.dataset) {
    form.addEventListener('submit', function (event) {
      var count = ticked();
      if (!confirm('Delete ' + count + ' archived report' + (count === 1 ? '' : 's') + ' now? This cannot be undone.')) {
        event.preventDefault();
      }
    });
  }
  refresh();
});

(function () {
  var form = document.getElementById('generateReportForm');
  var select = document.getElementById('reportTypeSelect');
  var submitBtn = document.getElementById('reportGenerateBtn');
  var estimateHint = document.getElementById('reportEstimateHint');
  var alertBox = document.getElementById('reportGenerateAlert');
  var alertText = document.getElementById('reportGenerateAlertText');
  var alertDismiss = document.getElementById('reportGenerateAlertDismiss');
  var modal = document.getElementById('reportProgressModal');
  var card = document.getElementById('reportProgressCard');

  if (!form || !select || !submitBtn || !modal) return;

  var eyebrowEl = document.getElementById('reportProgressEyebrow');
  var titleEl = document.getElementById('reportProgressTitle');
  var scopeEl = document.getElementById('reportProgressScope');
  var countdownValEl = document.getElementById('reportProgressCountdownValue');
  var countdownLabelEl = document.getElementById('reportProgressCountdownLabel');
  var stageEl = document.getElementById('reportProgressStage');
  var percentEl = document.getElementById('reportProgressPercent');
  var trackEl = document.getElementById('reportProgressTrack');
  var fillEl = document.getElementById('reportProgressFill');
  var elapsedEl = document.getElementById('reportProgressElapsed');
  var subhintEl = document.getElementById('reportProgressSubhint');
  var noticeTextEl = document.getElementById('reportProgressNoticeText');
  var liveEl = document.getElementById('reportProgressLive');
  var stepEls = Array.prototype.slice.call(document.querySelectorAll('#reportProgressSteps .report-progress-step'));

  var STAGE_COPY = [
    'Verifying selection and gathering clergy records...',
    'Computing summary totals and structuring report sections...',
    'Laying out diocesan letterhead and rendering PDF pages...',
    'Finalizing and saving PDF snapshot...'
  ];
  var DEFAULT_NOTICE = 'Keep this page open while the PDF renders. This indicator stays active until the report is saved.';
  var OVERTIME_NOTICE = 'Still rendering PDF pages. Larger diocesan reports can take 30 to 60 seconds; please keep this page open.';
  var COMPLETE_NOTICE = 'Report generated and saved. Loading the updated report list now.';
  var STORAGE_PREFIX = 'ednp_report_est_v1_';
  var NEW_REPORT_KEY = 'ednp_new_report_id';

  var config = { clergy_count: 0, estimates: {}, titles: {}, redirect_url: window.location.pathname };
  var configNode = document.getElementById('reportProgressConfig');
  if (configNode) {
    try {
      var parsed = JSON.parse(configNode.textContent || '{}');
      if (parsed && typeof parsed === 'object') {
        config = parsed;
      }
    } catch (_err) {}
  }

  var isGenerating = false;
  var tickHandle = null;
  var redirectHandle = null;
  var startedAt = 0;
  var estimatedSec = 10;
  var currentStep = -1;
  var announcedOvertime = false;

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function padTwo(n) {
    return n < 10 ? '0' + String(n) : String(n);
  }

  function formatClock(totalSeconds) {
    var sec = Math.max(0, Math.floor(totalSeconds));
    var mins = Math.floor(sec / 60);
    var rem = sec % 60;
    return String(mins) + ':' + padTwo(rem);
  }

  function formatShortDuration(totalSeconds) {
    var sec = Math.max(1, Math.ceil(totalSeconds));
    if (sec < 60) {
      return String(sec) + 's';
    }
    var mins = Math.floor(sec / 60);
    var rem = sec % 60;
    return String(mins) + 'm ' + padTwo(rem) + 's';
  }

  function getServerBaseline(reportType) {
    var estimates = config.estimates || {};
    var val = Number(estimates[reportType]);
    if (Number.isFinite(val) && val >= 4) {
      return Math.round(val);
    }
    return 10;
  }

  function getEstimatedSeconds(reportType) {
    var baseline = getServerBaseline(reportType);
    var currentCount = Number(config.clergy_count || 0);
    try {
      var raw = localStorage.getItem(STORAGE_PREFIX + reportType);
      if (raw) {
        var saved = JSON.parse(raw);
        var savedSec = Number(saved && saved.seconds);
        var savedCount = Number(saved && saved.clergyCount);
        var diff = Math.abs(savedCount - currentCount);
        var withinDrift = diff <= 10 || (currentCount > 0 && diff / currentCount <= 0.25);
        if (Number.isFinite(savedSec) && savedSec >= 3 && savedSec <= 300 && withinDrift) {
          return Math.max(4, Math.min(300, Math.round(savedSec)));
        }
      }
    } catch (_err) {}
    return baseline;
  }

  function saveCalibratedEstimate(reportType, observedSeconds) {
    var observed = Number(observedSeconds);
    if (!reportType || !Number.isFinite(observed) || observed <= 0) return;
    var currentCount = Number(config.clergy_count || 0);
    var blended = observed;
    try {
      var raw = localStorage.getItem(STORAGE_PREFIX + reportType);
      if (raw) {
        var prev = JSON.parse(raw);
        var prevSec = Number(prev && prev.seconds);
        if (Number.isFinite(prevSec) && prevSec > 0) {
          blended = observed * 0.65 + prevSec * 0.35;
        }
      }
      var stored = Math.max(4, Math.min(300, Math.ceil(blended) + 1));
      localStorage.setItem(
        STORAGE_PREFIX + reportType,
        JSON.stringify({ seconds: stored, clergyCount: currentCount })
      );
    } catch (_err) {}
  }

  function getReportTitle(reportType) {
    if (config.titles && config.titles[reportType]) {
      return config.titles[reportType];
    }
    var selectedOpt = select.options[select.selectedIndex];
    return (selectedOpt && selectedOpt.textContent) ? selectedOpt.textContent.trim() : 'PDF Report';
  }

  function updateEstimateHint() {
    if (!estimateHint) return;
    var reportType = select.value;
    if (!reportType) {
      estimateHint.hidden = true;
      estimateHint.textContent = '';
      return;
    }
    var est = getEstimatedSeconds(reportType);
    var count = Number(config.clergy_count || 0);
    var scopePart = count > 0
      ? (' for ' + String(count) + ' clergy ' + (count === 1 ? 'record' : 'records'))
      : '';
    estimateHint.textContent = 'Estimated generation time: about ' + formatShortDuration(est) + scopePart + '.';
    estimateHint.hidden = false;
  }

  function showInlineAlert(message) {
    if (!alertBox || !alertText) return;
    alertText.textContent = message;
    alertBox.hidden = false;
    try {
      alertBox.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
      alertBox.focus({ preventScroll: true });
    } catch (_err) {}
  }

  function hideInlineAlert() {
    if (!alertBox || !alertText) return;
    alertBox.hidden = true;
    alertText.textContent = '';
  }

  function announcePolite(message) {
    if (!liveEl) return;
    liveEl.textContent = '';
    setTimeout(function () {
      liveEl.textContent = message;
    }, 20);
  }

  function setActiveStep(stepIdx) {
    if (stepIdx === currentStep) return;
    currentStep = stepIdx;
    stepEls.forEach(function (el, idx) {
      el.classList.toggle('is-done', idx < stepIdx);
      el.classList.toggle('is-active', idx === stepIdx);
    });
    if (stageEl && STAGE_COPY[stepIdx]) {
      stageEl.textContent = STAGE_COPY[stepIdx];
      announcePolite(STAGE_COPY[stepIdx]);
    }
  }

  function markAllStepsDone() {
    currentStep = stepEls.length;
    stepEls.forEach(function (el) {
      el.classList.remove('is-active');
      el.classList.add('is-done');
    });
  }

  function setProgressBar(percent, valueText) {
    var clamped = Math.max(0, Math.min(100, Math.round(percent)));
    if (fillEl) fillEl.style.width = String(clamped) + '%';
    if (percentEl) percentEl.textContent = String(clamped) + '%';
    if (trackEl) {
      trackEl.setAttribute('aria-valuenow', String(clamped));
      if (valueText) {
        trackEl.setAttribute('aria-valuetext', valueText);
      }
    }
  }

  function setFormBusy(busy) {
    form.classList.toggle('is-submitting', busy);
    select.disabled = busy;
    submitBtn.disabled = busy;
    if (busy) {
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.classList.add('is-busy');
    } else {
      submitBtn.removeAttribute('aria-busy');
      submitBtn.classList.remove('is-busy');
    }
  }

  function clearTick() {
    if (tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
  }

  function handleBeforeUnload(event) {
    if (!isGenerating) return;
    event.preventDefault();
    event.returnValue = '';
  }

  function renderTick() {
    var elapsedSec = Math.max(0, (Date.now() - startedAt) / 1000);
    var ratio = estimatedSec > 0 ? (elapsedSec / estimatedSec) : 1;
    var pct;
    if (ratio <= 1) {
      pct = 4 + 87 * (1 - Math.pow(1 - ratio, 1.55));
    } else {
      var overtimeSec = elapsedSec - estimatedSec;
      var decay = Math.max(12, estimatedSec * 0.6);
      pct = 91 + 6 * (1 - Math.exp(-overtimeSec / decay));
    }
    var displayPct = Math.min(97, Math.floor(pct));
    var remainingSec = Math.ceil(estimatedSec - elapsedSec);

    if (elapsedEl) {
      elapsedEl.textContent = 'Elapsed: ' + formatClock(elapsedSec);
    }

    var stepIdx = 0;
    if (displayPct >= 88) {
      stepIdx = 3;
    } else if (displayPct >= 34) {
      stepIdx = 2;
    } else if (displayPct >= 16) {
      stepIdx = 1;
    }
    setActiveStep(stepIdx);

    if (remainingSec > 0) {
      modal.classList.remove('is-overtime');
      if (countdownValEl) countdownValEl.textContent = '~' + formatShortDuration(remainingSec);
      if (countdownLabelEl) countdownLabelEl.textContent = 'est. remaining';
      setProgressBar(displayPct, String(displayPct) + ' percent, ' + (STAGE_COPY[stepIdx] || 'generating report'));
    } else {
      modal.classList.add('is-overtime');
      if (countdownValEl) countdownValEl.textContent = 'Wrapping up';
      if (countdownLabelEl) countdownLabelEl.textContent = 'taking longer than usual';
      if (subhintEl) subhintEl.textContent = 'Still rendering multi-page PDF...';
      if (noticeTextEl) noticeTextEl.textContent = OVERTIME_NOTICE;
      setProgressBar(displayPct, String(displayPct) + ' percent, still rendering PDF pages');
      if (!announcedOvertime) {
        announcedOvertime = true;
        announcePolite('Report generation is taking slightly longer than estimated and is still in progress.');
      }
    }
  }

  function openProgressModal(reportType, reportTitle, estSeconds) {
    clearTick();
    if (redirectHandle) {
      clearTimeout(redirectHandle);
      redirectHandle = null;
    }

    startedAt = Date.now();
    estimatedSec = estSeconds;
    currentStep = -1;
    announcedOvertime = false;

    modal.classList.remove('is-overtime', 'is-complete');
    if (eyebrowEl) eyebrowEl.textContent = 'Generating PDF Report';
    if (titleEl) titleEl.textContent = reportTitle;
    if (scopeEl) {
      var count = Number(config.clergy_count || 0);
      scopeEl.textContent = count > 0
        ? ('Official diocesan PDF snapshot covering ' + String(count) + ' clergy ' + (count === 1 ? 'record' : 'records') + '.')
        : 'Official diocesan PDF snapshot.';
    }
    if (countdownValEl) countdownValEl.textContent = '~' + formatShortDuration(estSeconds);
    if (countdownLabelEl) countdownLabelEl.textContent = 'est. remaining';
    if (elapsedEl) elapsedEl.textContent = 'Elapsed: ' + formatClock(0);
    if (subhintEl) subhintEl.textContent = 'Typically about ' + formatShortDuration(estSeconds);
    if (noticeTextEl) noticeTextEl.textContent = DEFAULT_NOTICE;

    setProgressBar(4, '4 percent, starting report generation');
    setActiveStep(0);

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (card) {
      try { card.focus(); } catch (_err) {}
    }

    renderTick();
    tickHandle = setInterval(renderTick, 200);
  }

  function closeProgressModal() {
    clearTick();
    modal.classList.remove('show', 'is-overtime', 'is-complete');
    modal.setAttribute('aria-hidden', 'true');
    if (typeof window.syncBodyScrollLock === 'function') {
      window.syncBodyScrollLock();
    } else {
      document.body.classList.remove('modal-open');
    }
  }

  function showCompleteAndRedirect(reportTitle, observedSec, data) {
    clearTick();
    isGenerating = false;
    window.removeEventListener('beforeunload', handleBeforeUnload);

    var finalSec = Math.max(1, Math.round(observedSec));
    modal.classList.remove('is-overtime');
    modal.classList.add('is-complete');
    if (eyebrowEl) eyebrowEl.textContent = 'Report Saved';
    if (countdownValEl) countdownValEl.textContent = 'Done';
    if (countdownLabelEl) countdownLabelEl.textContent = 'in ' + formatShortDuration(finalSec);
    if (stageEl) stageEl.textContent = reportTitle + ' is ready. Refreshing report list...';
    if (elapsedEl) elapsedEl.textContent = 'Elapsed: ' + formatClock(observedSec);
    if (subhintEl) subhintEl.textContent = 'Saved to Generated Reports';
    if (noticeTextEl) noticeTextEl.textContent = COMPLETE_NOTICE;

    markAllStepsDone();
    setProgressBar(100, '100 percent, ' + reportTitle + ' generated');
    announcePolite(reportTitle + ' generated and saved. Loading updated report list.');

    try {
      sessionStorage.setItem('ednp_pending_toast', JSON.stringify({
        message: (data && data.message) || (reportTitle + ' generated.'),
        level: 'success'
      }));
      if (data && data.report && data.report.id) {
        sessionStorage.setItem(NEW_REPORT_KEY, String(data.report.id));
      }
    } catch (_err) {}

    var targetUrl = (data && data.redirect_url) || config.redirect_url || window.location.pathname;
    var beat = prefersReducedMotion() ? 250 : 650;
    redirectHandle = setTimeout(function () {
      window.location.assign(targetUrl);
    }, beat);
  }

  function recoverWithError(message) {
    isGenerating = false;
    window.removeEventListener('beforeunload', handleBeforeUnload);
    closeProgressModal();
    setFormBusy(false);
    if (typeof window.ednpClearSkeleton === 'function') {
      window.ednpClearSkeleton();
    }
    showInlineAlert(message);
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'error');
    }
  }

  async function parseResponseBody(res) {
    if (res.redirected) {
      return {
        ok: false,
        redirected: true,
        url: res.url,
        message: 'Your session has expired. Please sign in again and retry.'
      };
    }
    var contentType = res.headers.get('content-type') || '';
    if (contentType.indexOf('application/json') !== -1) {
      try {
        return await res.json();
      } catch (_err) {
        return { ok: false, message: 'Could not read the server response. Refresh Generated Reports to verify.' };
      }
    }
    if (res.status === 403) {
      return { ok: false, message: 'Your session expired or the security token is invalid. Please refresh the page and try again.' };
    }
    return {
      ok: false,
      message: 'Could not generate the report (server returned ' + String(res.status) + '). Please try again.'
    };
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (isGenerating) return;

    var reportType = select.value;
    if (!reportType) {
      showInlineAlert('Please choose a report type first.');
      select.focus();
      if (typeof window.ednpClearSkeleton === 'function') {
        window.ednpClearSkeleton();
      }
      return;
    }

    hideInlineAlert();
    if (typeof window.hideToast === 'function') {
      window.hideToast();
    }

    var reportTitle = getReportTitle(reportType);
    var estSeconds = getEstimatedSeconds(reportType);
    var formData = new FormData(form);

    isGenerating = true;
    setFormBusy(true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    openProgressModal(reportType, reportTitle, estSeconds);

    fetch(form.getAttribute('action') || window.location.href, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      }
    })
      .then(async function (res) {
        var data = await parseResponseBody(res);
        if (data && data.redirected) {
          recoverWithError(data.message);
          if (data.url && data.url.indexOf('/login') !== -1) {
            window.location.assign(data.url);
          }
          return;
        }
        if (res.ok && data && data.ok) {
          var clientElapsed = Math.max(0.2, (Date.now() - startedAt) / 1000);
          var observed = Number(data.duration_seconds);
          var durationForCalibration = (Number.isFinite(observed) && observed > 0) ? observed : clientElapsed;
          saveCalibratedEstimate(reportType, durationForCalibration);
          showCompleteAndRedirect(reportTitle, clientElapsed, data);
          return;
        }
        var errMsg = (data && (data.message || data.error)) || 'Could not generate the report. Please try again.';
        recoverWithError(errMsg);
      })
      .catch(function () {
        recoverWithError('Connection interrupted while generating the report. Refresh Generated Reports below to check if it completed before retrying.');
      });
  });

  select.addEventListener('change', function () {
    hideInlineAlert();
    updateEstimateHint();
  });

  if (alertDismiss) {
    alertDismiss.addEventListener('click', function () {
      hideInlineAlert();
      select.focus();
    });
  }

  // Keep keyboard focus inside the modal while a report is actively generating
  document.addEventListener('keydown', function (event) {
    if (!modal.classList.contains('show')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (isGenerating) {
        announcePolite('Report generation is in progress. Please wait until the PDF is saved.');
      }
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      if (card) card.focus();
    }
  });

  // Highlight newly generated report row after page refresh
  try {
    var freshId = sessionStorage.getItem(NEW_REPORT_KEY);
    if (freshId) {
      sessionStorage.removeItem(NEW_REPORT_KEY);
      var freshRow = document.querySelector('tr[data-report-id="' + freshId.replace(/"/g, '') + '"]');
      if (freshRow) {
        freshRow.classList.add('report-row-fresh');
      }
    }
  } catch (_err) {}

  // Reset state cleanly if restored from browser back/forward cache
  window.addEventListener('pageshow', function () {
    if (!isGenerating) {
      closeProgressModal();
      setFormBusy(false);
    }
  });

  updateEstimateHint();
})();
