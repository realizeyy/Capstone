/* Ember Letters interactive uploader (shared by Registrar & Clergy portals).
   - 3 to 4 year blocks, rendered one year at a time inside an inline modal workspace
   - Custom accessible calendar-year listbox (newest-first, locked once files saved)
   - Sequential quarter unlocking (Q1 -> Q2 -> Q3 -> Q4 -> next year block)
   - Skip quarter option when a past quarter letter is unavailable
   - Search & status filters across years with auto-jump to matching year
   - Instant client-side validation (PDF/JPG/PNG, max 5 MB)
   - Single-concurrency upload queue (1 upload at a time per page)
   - Replace in-flight cancels active request via AbortController
   - beforeunload guard while uploads are queued or in flight */

(function () {
  var configEl = document.getElementById('ember-config-data');
  var container = document.getElementById('emberYearsContainer');
  if (!configEl || !container) return;

  var config = JSON.parse(configEl.textContent);
  var MAX_BYTES = config.max_bytes || (5 * 1024 * 1024);
  var ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i;
  var ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', ''];

  var ACTIVE_YEAR_KEY = 'ednp_ember_active_year_' + window.location.pathname;
  var EMBER_FILTERS_KEY = 'ednp_ember_filters_' + window.location.pathname;

  var blocks = [];
  var nextBlockId = 1;
  var activeBlockIndex = 0;
  var activeFilter = 'all';
  var searchQuery = '';
  var uploadQueue = [];
  var activeJob = null;

  // Custom listbox state
  var isYearMenuOpen = false;
  var highlightedYearIdx = -1;
  var typeaheadBuffer = '';
  var typeaheadTimer = null;

  // DOM references for single-year inline workspace
  var navEl = document.getElementById('emberSectionNav');
  var pillsContainer = document.getElementById('emberNavPills');
  var scrollLeftBtn = document.getElementById('emberNavScrollLeft');
  var scrollRightBtn = document.getElementById('emberNavScrollRight');
  var searchBox = document.getElementById('emberSearchBox');
  var searchInput = document.getElementById('emberSearchInput');
  var searchClearBtn = document.getElementById('emberSearchClear');
  var searchFeedback = document.getElementById('emberSearchFeedback');
  var searchFeedbackText = document.getElementById('emberSearchFeedbackText');
  var searchResetBtn = document.getElementById('emberSearchResetBtn');
  var emptyStateEl = document.getElementById('emberSearchEmpty');
  var emptyStateText = document.getElementById('emberSearchEmptyText');
  var emptyResetBtn = document.getElementById('emberEmptyResetBtn');
  var filterPills = navEl ? Array.prototype.slice.call(navEl.querySelectorAll('[data-ember-filter]')) : [];
  var stepperCountEl = document.getElementById('emberStepperCount');
  var stepperLabelEl = document.getElementById('emberStepperLabel');

  var yearModal = document.getElementById('emberYearModal');
  var yearModalBody = document.getElementById('emberYearBody');
  var modalTitleEl = document.getElementById('emberModalTitle');
  var stepBadgeEl = document.getElementById('emberStepBadge');
  var progressBadgeEl = document.getElementById('emberYearProgressBadge');
  var lockHintEl = document.getElementById('emberYearLockHint');
  var stepIndicatorEl = document.getElementById('emberStepIndicator');
  var prevBtn = document.getElementById('emberPrevBtn');
  var nextBtn = document.getElementById('emberNextBtn');
  var edgePrevBtn = document.getElementById('emberEdgePrevBtn');
  var edgeNextBtn = document.getElementById('emberEdgeNextBtn');
  var removeYearBtn = document.getElementById('emberRemoveYearBtn');
  var addYearBtn = document.getElementById('emberAddYearBtn');
  var footSecondaryEl = document.getElementById('emberFootSecondary');

  var yearPickerEl = document.getElementById('emberYearPicker');
  var yearTriggerBtn = document.getElementById('emberYearTrigger');
  var yearTriggerText = document.getElementById('emberYearTriggerText');
  var yearListboxEl = document.getElementById('emberYearListbox');

  // Detect shared page-level #docSearchInput (used on Clergy my-requirements.html)
  var sharedDocSearch = document.getElementById('docSearchInput');
  var hasExternalSearch = Boolean(sharedDocSearch && !sharedDocSearch.closest('.tab-content'));
  if (hasExternalSearch && searchBox) {
    searchBox.hidden = true;
    searchBox.style.display = 'none';
  }

  function getCsrfToken() {
    var input = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (input && input.value) return input.value;
    var match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function makeEmptyQuarters() {
    var q = {};
    for (var i = 1; i <= 4; i++) {
      q[i] = {
        status: 'empty', // 'empty' | 'skipped' | 'queued' | 'uploading' | 'saved' | 'error'
        letter: null,
        error: '',
        pendingFile: null,
      };
    }
    return q;
  }

  function createBlock(year) {
    return {
      id: nextBlockId++,
      year: year ? Number(year) : null,
      quarters: makeEmptyQuarters(),
    };
  }

  function blockHasSaved(block) {
    for (var q = 1; q <= 4; q++) {
      if (block.quarters[q].status === 'saved' || block.quarters[q].status === 'uploading' || block.quarters[q].status === 'queued') {
        return true;
      }
    }
    return false;
  }

  function blockSavedCount(block) {
    var count = 0;
    for (var q = 1; q <= 4; q++) {
      if (block.quarters[q].status === 'saved') count++;
    }
    return count;
  }

  function initBlocks() {
    var byYear = {};
    var yearsOrder = [];
    (config.letters || []).forEach(function (letter) {
      var y = Number(letter.year);
      if (!byYear[y]) {
        byYear[y] = [];
        yearsOrder.push(y);
      }
      byYear[y].push(letter);
    });

    yearsOrder.sort(function (a, b) { return b - a; });

    yearsOrder.forEach(function (y) {
      var b = createBlock(y);
      byYear[y].forEach(function (letter) {
        var qNum = Number(letter.quarter);
        if (qNum >= 1 && qNum <= 4) {
          b.quarters[qNum].status = 'saved';
          b.quarters[qNum].letter = letter;
        }
      });
      blocks.push(b);
    });

    var lastHasQ4 = blocks.length > 0 && blocks[blocks.length - 1].quarters[4].status === 'saved';
    var targetCount = Math.min(4, Math.max(3, blocks.length + (lastHasQ4 ? 1 : 0)));
    while (blocks.length < targetCount && blocks.length < 4) {
      blocks.push(createBlock(null));
    }
    while (blocks.length > 4 && !blockHasSaved(blocks[blocks.length - 1])) {
      blocks.pop();
    }
  }

  function isQuarterDoneOrSkipped(block, q) {
    var st = block.quarters[q].status;
    if (st === 'saved' || st === 'skipped') return true;
    // On returning records where a later quarter already has a saved file,
    // treat earlier empty quarters as implicitly passed so later ones stay accessible.
    for (var later = q + 1; later <= 4; later++) {
      if (block.quarters[later].status === 'saved') return true;
    }
    return false;
  }

  function isBlockUnlocked(index) {
    if (index === 0) return true;
    var block = blocks[index];
    if (!block) return false;
    if (block.year !== null || blockHasSaved(block)) return true;
    var prev = blocks[index - 1];
    return prev && prev.year !== null && isQuarterDoneOrSkipped(prev, 4);
  }

  function isQuarterUnlocked(block, blockIndex, q) {
    if (!isBlockUnlocked(blockIndex)) return false;
    if (!block.year) return false;
    var st = block.quarters[q].status;
    if (st === 'saved' || st === 'uploading' || st === 'queued' || st === 'error' || st === 'skipped') {
      return true;
    }
    if (q === 1) return true;
    return isQuarterDoneOrSkipped(block, q - 1);
  }

  function ensureNextBlockIfQ4Done(blockIndex) {
    var block = blocks[blockIndex];
    if (blockIndex === blocks.length - 1 && block.year && isQuarterDoneOrSkipped(block, 4) && blocks.length < 4) {
      blocks.push(createBlock(null));
    }
  }

  function computeSummary() {
    var uploaded = 0;
    var yearsMap = {};
    blocks.forEach(function (b) {
      for (var q = 1; q <= 4; q++) {
        if (b.quarters[q].status === 'saved') {
          uploaded++;
          if (b.year) yearsMap[b.year] = true;
        }
      }
    });
    var yearCount = Object.keys(yearsMap).length;
    var target = Math.min(16, Math.max(12, yearCount * 4));
    return { uploaded: uploaded, years: yearCount, target: target };
  }

  function updateSummaryUI(summary) {
    summary = summary || computeSummary();
    var overallEl = document.getElementById('emberOverallText');
    if (overallEl) {
      if (summary.uploaded > 0) {
        overallEl.innerHTML = '<b>' + summary.uploaded + '</b> of <b>' + summary.target + '</b> uploaded (' + summary.years + ' year' + (summary.years === 1 ? '' : 's') + ')';
      } else {
        overallEl.innerHTML = '<b>0</b> of <b>12</b> uploaded';
      }
    }
    document.querySelectorAll('[data-ember-tab-badge]').forEach(function (el) {
      el.textContent = summary.uploaded + '/' + summary.target;
    });
    document.querySelectorAll('[data-ember-card-badge]').forEach(function (el) {
      el.textContent = summary.uploaded + ' of ' + summary.target + ' uploaded';
    });
    document.querySelectorAll('[data-ember-card-detail]').forEach(function (el) {
      if (summary.uploaded > 0) {
        el.innerHTML = '<i class="fa-solid fa-file-lines"></i> ' + summary.uploaded + ' of ' + summary.target + ' quarterly letters uploaded across ' + summary.years + ' year' + (summary.years === 1 ? '' : 's') + '.';
      } else {
        el.textContent = 'No quarterly Ember letters uploaded yet.';
      }
    });
  }

  function updateQueueBadge() {
    var badge = document.getElementById('emberQueueBadge');
    if (!badge) return;
    var totalPending = uploadQueue.length + (activeJob ? 1 : 0);
    if (totalPending > 0) {
      badge.classList.remove('hidden');
      badge.innerHTML = '<span class="ember-spinner"></span> Uploading (' + totalPending + ' remaining)...';
    } else {
      badge.classList.add('hidden');
      badge.textContent = '';
    }
  }

  function validateFile(file) {
    if (!file) return 'Please choose a file.';
    if (!ALLOWED_EXT.test(file.name || '')) {
      return 'Only PDF, JPG and PNG files are allowed.';
    }
    if (file.type && ALLOWED_MIMES.indexOf(file.type.toLowerCase()) === -1) {
      return 'Only PDF, JPG and PNG files are allowed.';
    }
    if (file.size > MAX_BYTES) {
      return 'File is too large: the maximum is 5 MB.';
    }
    return null;
  }

  function findBlock(blockId) {
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].id === blockId) return { block: blocks[i], index: i };
    }
    return null;
  }

  function startUploadSlot(blockId, quarter, file) {
    var found = findBlock(blockId);
    if (!found || !found.block.year) return;
    var block = found.block;
    var qSlot = block.quarters[quarter];

    var err = validateFile(file);
    if (err) {
      qSlot.status = 'error';
      qSlot.error = err;
      qSlot.pendingFile = null;
      if (typeof showToast === 'function') showToast(err, 'error');
      render({ skipAnimate: true });
      return;
    }

    uploadQueue = uploadQueue.filter(function (job) {
      return !(job.blockId === blockId && job.quarter === quarter);
    });

    if (activeJob && activeJob.blockId === blockId && activeJob.quarter === quarter) {
      activeJob.abortedByReplace = true;
      activeJob.controller.abort();
    }

    qSlot.error = '';
    qSlot.pendingFile = file;
    qSlot.status = 'queued';

    uploadQueue.push({
      blockId: blockId,
      year: block.year,
      quarter: quarter,
      file: file,
      prevLetter: qSlot.letter,
    });

    render({ skipAnimate: true });
    processQueue();
  }

  function enqueueUpload(blockId, quarter, file) {
    var found = findBlock(blockId);
    if (!found || !found.block.year) return;
    var block = found.block;
    var qSlot = block.quarters[quarter];

    if (qSlot.letter) {
      var replaceMsg = 'Replace the existing Ember Letter for ' + block.year + ' Q' + quarter + '? Uploading a new file will overwrite the current letter on record.';
      if (typeof window.appConfirm === 'function') {
        window.appConfirm(replaceMsg, {
          title: 'Replace Ember Letter',
          confirmText: 'Replace',
          isReplace: true,
        }).then(function (ok) {
          if (ok) {
            startUploadSlot(blockId, quarter, file);
          } else {
            render({ skipAnimate: true });
          }
        });
        return;
      } else if (!window.confirm(replaceMsg)) {
        render({ skipAnimate: true });
        return;
      }
    }

    startUploadSlot(blockId, quarter, file);
  }

  function processQueue() {
    if (activeJob || uploadQueue.length === 0) {
      updateQueueBadge();
      return;
    }

    var job = uploadQueue.shift();
    var found = findBlock(job.blockId);
    if (!found) {
      processQueue();
      return;
    }

    var block = found.block;
    var qSlot = block.quarters[job.quarter];
    qSlot.status = 'uploading';
    qSlot.error = '';

    var controller = new AbortController();
    activeJob = {
      blockId: job.blockId,
      quarter: job.quarter,
      file: job.file,
      prevLetter: job.prevLetter,
      controller: controller,
      abortedByReplace: false,
    };

    render({ skipAnimate: true });
    updateQueueBadge();

    var formData = new FormData();
    formData.append('year', String(block.year));
    formData.append('quarter', String(job.quarter));
    formData.append('file', job.file);

    fetch(config.upload_url, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCsrfToken(),
      },
      body: formData,
      signal: controller.signal,
      credentials: 'same-origin',
    })
      .then(function (resp) {
        return resp.json().then(function (data) {
          return { status: resp.status, data: data };
        }).catch(function () {
          return { status: resp.status, data: { ok: false, error: 'Upload failed. Please try again.' } };
        });
      })
      .then(function (result) {
        var finishedJob = activeJob;
        activeJob = null;
        if (finishedJob && finishedJob.abortedByReplace) {
          processQueue();
          return;
        }
        if (result.status >= 200 && result.status < 300 && result.data && result.data.ok) {
          qSlot.status = 'saved';
          qSlot.letter = result.data.letter;
          qSlot.pendingFile = null;
          qSlot.error = '';
          ensureNextBlockIfQ4Done(found.index);
          updateSummaryUI(result.data.summary);
          if (typeof showToast === 'function') {
            showToast('Ember Letter (' + block.year + ' Q' + job.quarter + ') saved.');
          }
        } else {
          var errMsg = (result.data && result.data.error) || 'Upload failed: Try again.';
          qSlot.status = 'error';
          qSlot.error = errMsg;
          if (typeof showToast === 'function') showToast(errMsg, 'error');
        }
        render({ skipAnimate: true });
        processQueue();
      })
      .catch(function (err) {
        var finishedJob = activeJob;
        activeJob = null;
        if ((err && err.name === 'AbortError') || (finishedJob && finishedJob.abortedByReplace)) {
          processQueue();
          return;
        }
        qSlot.status = 'error';
        qSlot.error = 'Network error: could not upload file.';
        if (typeof showToast === 'function') showToast(qSlot.error, 'error');
        render({ skipAnimate: true });
        processQueue();
      });
  }

  function handleDelete(blockId, quarter) {
    var found = findBlock(blockId);
    if (!found) return;
    var block = found.block;
    var qSlot = block.quarters[quarter];
    var letter = qSlot.letter;
    if (!letter || !letter.delete_url) return;

    var deleteMsg = 'Remove Ember Letter for ' + block.year + ' Q' + quarter + '? This permanently deletes the uploaded file from this quarter.';
    function doDelete() {
      fetch(letter.delete_url, {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken(),
        },
        credentials: 'same-origin',
      })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
          if (data && data.ok) {
            qSlot.status = 'empty';
            qSlot.letter = null;
            qSlot.pendingFile = null;
            qSlot.error = '';
            updateSummaryUI(data.summary);
            if (typeof showToast === 'function') {
              showToast('Ember Letter (' + block.year + ' Q' + quarter + ') removed.');
            }
            render({ skipAnimate: true });
          } else {
            var msg = (data && data.error) || 'Could not remove Ember Letter.';
            if (typeof showToast === 'function') showToast(msg, 'error');
          }
        })
        .catch(function () {
          if (typeof showToast === 'function') showToast('Network error while removing file.', 'error');
        });
    }

    if (window.appConfirm) {
      window.appConfirm(deleteMsg, {
        title: 'Remove Ember Letter',
        confirmText: 'Remove',
        isDelete: true,
      }).then(function (ok) {
        if (ok) doDelete();
      });
      return;
    } else if (window.confirm(deleteMsg)) {
      doDelete();
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function selectedYearsSet(excludeBlockId) {
    var used = {};
    blocks.forEach(function (b) {
      if (b.id !== excludeBlockId && b.year) {
        used[b.year] = true;
      }
    });
    return used;
  }

  function persistActiveYear() {
    try {
      sessionStorage.setItem(ACTIVE_YEAR_KEY, String(activeBlockIndex));
    } catch (_e) {}
  }

  function persistFilters() {
    try {
      if (activeFilter === 'all' && !searchQuery.trim()) {
        sessionStorage.removeItem(EMBER_FILTERS_KEY);
      } else {
        sessionStorage.setItem(EMBER_FILTERS_KEY, JSON.stringify({
          filter: activeFilter,
          q: searchQuery,
        }));
      }
    } catch (_e) {}
  }

  function getQuarterSearchText(block, blockIdx, q) {
    var qSlot = block.quarters[q];
    var unlocked = isQuarterUnlocked(block, blockIdx, q);
    var parts = [
      'year ' + (blockIdx + 1),
      block.year ? String(block.year) : 'unassigned',
      'q' + q,
      'quarter ' + q,
    ];
    if (!unlocked) {
      parts.push('locked');
    } else if (qSlot.status === 'saved' && qSlot.letter) {
      parts.push('saved uploaded ' + (qSlot.letter.file_name || '') + ' ' + (qSlot.letter.submitted_date || ''));
    } else if (qSlot.status === 'queued') {
      parts.push('waiting queued ' + (qSlot.pendingFile ? qSlot.pendingFile.name : ''));
    } else if (qSlot.status === 'uploading') {
      parts.push('uploading ' + (qSlot.pendingFile ? qSlot.pendingFile.name : ''));
    } else if (qSlot.status === 'error') {
      parts.push('failed error ' + (qSlot.error || ''));
    } else if (qSlot.status === 'skipped') {
      parts.push('skipped');
    } else {
      parts.push('ready empty not uploaded pending');
    }
    return parts.join(' ').toLowerCase();
  }

  function quarterMatchesFilter(block, blockIdx, q) {
    var qSlot = block.quarters[q];
    var st = qSlot.status;

    var statusOk = true;
    if (activeFilter === 'saved') {
      statusOk = (st === 'saved');
    } else if (activeFilter === 'skipped') {
      statusOk = (st === 'skipped');
    } else if (activeFilter === 'incomplete') {
      statusOk = (st !== 'saved' && st !== 'skipped');
    }

    var qStr = searchQuery.trim().toLowerCase();
    var queryOk = true;
    if (qStr) {
      queryOk = getQuarterSearchText(block, blockIdx, q).indexOf(qStr) !== -1;
    }

    return statusOk && queryOk;
  }

  function getBlockMatchCount(block, blockIdx) {
    var count = 0;
    for (var q = 1; q <= 4; q++) {
      if (quarterMatchesFilter(block, blockIdx, q)) count++;
    }
    return count;
  }

  function updateScrollButtons() {
    if (!pillsContainer || !scrollLeftBtn || !scrollRightBtn) return;
    var scrollLeft = pillsContainer.scrollLeft;
    var maxScroll = pillsContainer.scrollWidth - pillsContainer.clientWidth;
    scrollLeftBtn.disabled = scrollLeft <= 3;
    scrollRightBtn.disabled = scrollLeft >= maxScroll - 3;
  }

  function revealYearPillHorizontally(pill, smooth) {
    if (!pill || !pillsContainer || pillsContainer.scrollWidth <= pillsContainer.clientWidth) return;
    var targetLeft = pill.offsetLeft - (pillsContainer.clientWidth / 2) + (pill.offsetWidth / 2);
    var clampedLeft = Math.max(0, Math.min(targetLeft, pillsContainer.scrollWidth - pillsContainer.clientWidth));
    try {
      pillsContainer.scrollTo({ left: clampedLeft, behavior: smooth === false ? 'auto' : 'smooth' });
    } catch (_e) {
      pillsContainer.scrollLeft = clampedLeft;
    }
    setTimeout(updateScrollButtons, 180);
  }

  function closeYearListbox(restoreFocus) {
    if (!yearListboxEl || !yearTriggerBtn) return;
    isYearMenuOpen = false;
    highlightedYearIdx = -1;
    yearListboxEl.hidden = true;
    yearTriggerBtn.setAttribute('aria-expanded', 'false');
    yearTriggerBtn.removeAttribute('aria-activedescendant');
    if (restoreFocus) {
      try { yearTriggerBtn.focus(); } catch (_e) {}
    }
  }

  function highlightOptionIndex(idx) {
    if (!yearListboxEl) return;
    var options = Array.prototype.slice.call(yearListboxEl.querySelectorAll('[role="option"]'));
    if (!options.length) return;
    var clamped = Math.max(0, Math.min(idx, options.length - 1));
    highlightedYearIdx = clamped;
    options.forEach(function (opt, i) {
      opt.classList.toggle('is-highlighted', i === clamped);
    });
    var activeOpt = options[clamped];
    if (activeOpt) {
      yearTriggerBtn.setAttribute('aria-activedescendant', activeOpt.id);
      if (typeof activeOpt.scrollIntoView === 'function') {
        activeOpt.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function openYearListbox() {
    if (!yearListboxEl || !yearTriggerBtn || yearTriggerBtn.disabled) return;
    isYearMenuOpen = true;
    yearListboxEl.hidden = false;
    yearTriggerBtn.setAttribute('aria-expanded', 'true');
    var options = Array.prototype.slice.call(yearListboxEl.querySelectorAll('[role="option"]'));
    var selectedIdx = options.findIndex(function (opt) { return opt.getAttribute('aria-selected') === 'true'; });
    highlightOptionIndex(selectedIdx >= 0 ? selectedIdx : 0);
    try { yearListboxEl.focus(); } catch (_e) {}
  }

  function renderYearListbox(block, blockIdx) {
    if (!yearTriggerBtn || !yearTriggerText || !yearListboxEl) return;
    var blockUnlocked = isBlockUnlocked(blockIdx);
    var hasSaved = blockHasSaved(block);
    var usedYears = selectedYearsSet(block.id);

    var yearChoices = (config.years_choices || []).slice();
    if (block.year && yearChoices.indexOf(block.year) === -1) {
      yearChoices.push(block.year);
      yearChoices.sort(function (a, b) { return b - a; });
    }

    var isDisabled = (!blockUnlocked || hasSaved);
    yearTriggerBtn.disabled = isDisabled;
    yearTriggerBtn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
    yearTriggerText.textContent = block.year ? String(block.year) : 'Select Year...';
    yearTriggerText.classList.toggle('is-placeholder', !block.year);

    if (isDisabled) {
      closeYearListbox(false);
    }

    var optHtml = '';
    var emptySelected = !block.year;
    optHtml += '<li role="option" id="emberYearOpt_none" class="ember-year-option' + (emptySelected ? ' is-selected' : '') + '" data-year="" aria-selected="' + (emptySelected ? 'true' : 'false') + '">Select Year...</li>';

    yearChoices.forEach(function (y) {
      if (usedYears[y] && y !== block.year) return;
      var sel = block.year === y;
      optHtml += '<li role="option" id="emberYearOpt_' + y + '" class="ember-year-option' + (sel ? ' is-selected' : '') + '" data-year="' + y + '" aria-selected="' + (sel ? 'true' : 'false') + '">' + y + '</li>';
    });

    yearListboxEl.innerHTML = optHtml;
  }

  function selectCalendarYear(yearVal) {
    var block = blocks[activeBlockIndex];
    if (!block || !isBlockUnlocked(activeBlockIndex) || blockHasSaved(block)) return;
    block.year = yearVal ? Number(yearVal) : null;
    closeYearListbox(true);
    render({ skipAnimate: true });
  }

  function renderPillsAndNav(filterActive, matchCounts) {
    if (!pillsContainer) return;
    var html = '';
    blocks.forEach(function (block, idx) {
      var unlocked = isBlockUnlocked(idx);
      var savedCount = blockSavedCount(block);
      var isActive = idx === activeBlockIndex;
      var matchCount = matchCounts[idx] || 0;
      var pillClasses = ['doc-nav-pill'];
      if (isActive) pillClasses.push('active');
      if (!unlocked) pillClasses.push('is-locked-pill');
      if (filterActive) {
        pillClasses.push(matchCount > 0 ? 'search-match' : 'search-dimmed');
      }

      var iconClass = !unlocked ? 'fa-lock' : (savedCount === 4 ? 'fa-calendar-check' : 'fa-calendar-days');
      var pillTitle = 'Year ' + (idx + 1) + (block.year ? (' (' + block.year + ')') : '');
      var badgeCls = savedCount === 4 ? 'stage-complete-b' : (savedCount > 0 ? 'abroad-b' : 'pending-b');
      var badgeHtml = savedCount === 4
        ? '<span class="badge stage-complete-b"><i class="fa-solid fa-check" aria-hidden="true"></i> 4/4</span>'
        : '<span class="badge ' + badgeCls + '">' + savedCount + '/4</span>';

      html +=
        '<button type="button" class="' + pillClasses.join(' ') + '" ' +
        'data-ember-year-idx="' + idx + '"' +
        (isActive ? ' aria-current="step"' : '') + '>' +
        '<i class="fa-solid ' + iconClass + '" aria-hidden="true"></i> ' +
        '<span>' + escapeHtml(pillTitle) + '</span> ' +
        badgeHtml +
        '</button>';
    });
    pillsContainer.innerHTML = html;

    var activePill = pillsContainer.querySelector('[data-ember-year-idx="' + activeBlockIndex + '"]');
    if (activePill) {
      revealYearPillHorizontally(activePill, true);
    }
    setTimeout(updateScrollButtons, 60);
  }

  function renderQuarterRow(block, blockIdx, q) {
    var qSlot = block.quarters[q];
    var unlocked = isQuarterUnlocked(block, blockIdx, q);
    var fileInputId = 'emberFile_' + block.id + '_' + q;
    var rowStateClass = !unlocked ? 'state-locked' : ('state-' + qSlot.status);

    var leftInfo = '';
    var rightActions = '';

    if (!unlocked) {
      var reason = !isBlockUnlocked(blockIdx)
        ? ('Complete or skip Year ' + blockIdx + ' Q4 to unlock')
        : (!block.year ? 'Select a calendar year above to unlock Q1' : ('Upload or skip Q' + (q - 1) + ' to unlock'));
      leftInfo = '<div class="ember-q-status-line"><span class="muted"><i class="fa-solid fa-lock" aria-hidden="true"></i> Locked: ' + reason + '</span></div>';
    } else if (qSlot.status === 'saved' && qSlot.letter) {
      var l = qSlot.letter;
      var docLabel = 'Ember Letter ' + (block.year || ('Year ' + (blockIdx + 1))) + ' Q' + q;
      leftInfo =
        '<div class="ember-q-status-line">' +
        '  <span class="badge green active-b"><i class="fa-solid fa-check" aria-hidden="true"></i> Saved</span>' +
        '  <span class="ember-q-filename" title="' + escapeHtml(l.file_name) + '">' + escapeHtml(l.file_name) + '</span>' +
        '</div>' +
        '<div class="ember-q-meta">' + escapeHtml(l.file_size_label) + ' · Submitted ' + escapeHtml(l.submitted_date) + '</div>';

      rightActions =
        '<a class="btn secondary small ember-view-link" href="' + escapeHtml(l.view_url) + '" target="_blank" rel="noopener" data-doc-name="' + escapeHtml(docLabel) + '"><i class="fa-solid fa-eye" aria-hidden="true"></i> View</a>' +
        '<a class="btn secondary small" href="' + escapeHtml(l.download_url) + '" download><i class="fa-solid fa-download" aria-hidden="true"></i> Download</a>' +
        '<button type="button" class="btn secondary small" data-action="pick-file" data-input-id="' + fileInputId + '"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Replace</button>' +
        '<button type="button" class="btn danger small" data-action="delete-quarter" data-block-id="' + block.id + '" data-quarter="' + q + '"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Remove</button>';
    } else if (qSlot.status === 'queued') {
      var qName = qSlot.pendingFile ? qSlot.pendingFile.name : '';
      leftInfo =
        '<div class="ember-q-status-line">' +
        '  <span class="badge blue abroad-b"><i class="fa-solid fa-clock" aria-hidden="true"></i> Waiting...</span>' +
        '  <span class="ember-q-filename">' + escapeHtml(qName) + '</span>' +
        '</div>' +
        '<div class="ember-q-meta">Queued: will upload automatically</div>';

      rightActions =
        '<button type="button" class="btn secondary small" data-action="pick-file" data-input-id="' + fileInputId + '"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Replace</button>';
    } else if (qSlot.status === 'uploading') {
      var uName = qSlot.pendingFile ? qSlot.pendingFile.name : '';
      leftInfo =
        '<div class="ember-q-status-line">' +
        '  <span class="ember-spinner"></span>' +
        '  <b>Uploading...</b>' +
        '  <span class="ember-q-filename">' + escapeHtml(uName) + '</span>' +
        '</div>';

      rightActions =
        '<button type="button" class="btn secondary small" data-action="pick-file" data-input-id="' + fileInputId + '"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Replace</button>';
    } else if (qSlot.status === 'error') {
      leftInfo =
        '<div class="ember-q-status-line">' +
        '  <span class="badge red inactive-b"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> Failed</span>' +
        '  <span class="ember-q-error">' + escapeHtml(qSlot.error || 'Upload failed: Try again.') + '</span>' +
        '</div>';

      rightActions = '';
      if (qSlot.pendingFile) {
        rightActions += '<button type="button" class="btn small" data-action="retry-quarter" data-block-id="' + block.id + '" data-quarter="' + q + '"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Retry</button>';
      }
      rightActions += '<button type="button" class="btn secondary small" data-action="pick-file" data-input-id="' + fileInputId + '"><i class="fa-solid fa-upload" aria-hidden="true"></i> Choose file</button>';
    } else if (qSlot.status === 'skipped') {
      leftInfo =
        '<div class="ember-q-status-line">' +
        '  <span class="badge amber pending-b">Skipped</span>' +
        '  <span class="muted">Quarter skipped: you can still upload a file here any time.</span>' +
        '</div>';

      rightActions =
        '<button type="button" class="btn secondary small" data-action="pick-file" data-input-id="' + fileInputId + '"><i class="fa-solid fa-upload" aria-hidden="true"></i> Upload Q' + q + '</button>';
    } else {
      leftInfo =
        '<div class="ember-q-status-line">' +
        '  <span class="muted">Ready to upload ' + (block.year ? (block.year + ' ') : '') + 'Quarter ' + q + ' (PDF, JPG or PNG, max 5 MB)</span>' +
        '</div>';

      rightActions =
        '<button type="button" class="btn small" data-action="pick-file" data-input-id="' + fileInputId + '"><i class="fa-solid fa-upload" aria-hidden="true"></i> Upload Q' + q + '</button>' +
        '<button type="button" class="btn secondary small" data-action="skip-quarter" data-block-id="' + block.id + '" data-quarter="' + q + '">Skip quarter</button>';
    }

    return (
      '<div class="ember-quarter-row ' + rowStateClass + '" data-block-id="' + block.id + '" data-quarter="' + q + '">' +
      '  <div class="ember-q-left">' +
      '    <span class="ember-q-pill">Q' + q + '</span>' +
      '    <div class="ember-q-info">' + leftInfo + '</div>' +
      '  </div>' +
      '  <div class="ember-q-actions">' +
      '    <input type="file" id="' + fileInputId + '" class="ember-file-input" accept=".pdf,.jpg,.jpeg,.png" data-block-id="' + block.id + '" data-quarter="' + q + '">' +
           rightActions +
      '  </div>' +
      '</div>'
    );
  }

  function render(opts) {
    var options = opts || {};
    if (!blocks.length) return;
    if (activeBlockIndex < 0) activeBlockIndex = 0;
    if (activeBlockIndex >= blocks.length) activeBlockIndex = blocks.length - 1;

    var filterActive = Boolean(searchQuery.trim() || activeFilter !== 'all');
    var matchCounts = blocks.map(function (b, idx) {
      return getBlockMatchCount(b, idx);
    });
    var totalMatches = matchCounts.reduce(function (acc, n) { return acc + n; }, 0);

    if (options.autoJump && filterActive && totalMatches > 0 && matchCounts[activeBlockIndex] === 0) {
      for (var i = 0; i < blocks.length; i++) {
        if (matchCounts[i] > 0) {
          activeBlockIndex = i;
          break;
        }
      }
    }

    persistActiveYear();

    var block = blocks[activeBlockIndex];
    var blockUnlocked = isBlockUnlocked(activeBlockIndex);
    var hasSaved = blockHasSaved(block);
    var savedCount = blockSavedCount(block);
    var canRemoveBlock = (activeBlockIndex === 3 && blocks.length > 3 && !hasSaved);
    var totalYears = blocks.length;
    var currentStep = activeBlockIndex + 1;
    var titleLabel = 'Year ' + currentStep + (block.year ? (': ' + block.year) : '');

    renderPillsAndNav(filterActive, matchCounts);
    renderYearListbox(block, activeBlockIndex);

    // Update modal header
    if (modalTitleEl) {
      var titleSpan = modalTitleEl.querySelector('span');
      if (titleSpan) titleSpan.textContent = titleLabel;
    }
    if (stepBadgeEl) {
      stepBadgeEl.textContent = 'Year ' + currentStep + ' of ' + totalYears;
    }
    if (progressBadgeEl) {
      var pBadgeCls = savedCount === 4 ? 'green active-b' : (savedCount > 0 ? 'blue abroad-b' : 'amber pending-b');
      progressBadgeEl.className = 'badge ' + pBadgeCls;
      progressBadgeEl.textContent = savedCount + '/4 uploaded';
    }
    if (lockHintEl) {
      if (hasSaved) {
        lockHintEl.hidden = false;
        lockHintEl.innerHTML = '<i class="fa-solid fa-lock" aria-hidden="true"></i> Year locked (remove saved files in this year to change its calendar year)';
      } else if (!blockUnlocked) {
        lockHintEl.hidden = false;
        lockHintEl.innerHTML = '<i class="fa-solid fa-lock" aria-hidden="true"></i> Complete or skip Year ' + activeBlockIndex + ' Q4 to unlock';
      } else {
        lockHintEl.hidden = true;
        lockHintEl.textContent = '';
      }
    }
    if (removeYearBtn) {
      removeYearBtn.hidden = !canRemoveBlock;
      removeYearBtn.style.display = canRemoveBlock ? '' : 'none';
      removeYearBtn.setAttribute('data-block-id', String(block.id));
    }

    // Update stepper & footer pagination
    if (stepperCountEl) stepperCountEl.textContent = currentStep + ' / ' + totalYears;
    if (stepperLabelEl) stepperLabelEl.textContent = block.year ? ('Year ' + currentStep + ' (' + block.year + ')') : ('Year ' + currentStep);
    if (stepIndicatorEl) stepIndicatorEl.textContent = currentStep + ' / ' + totalYears;

    var atStart = activeBlockIndex <= 0;
    var atEnd = activeBlockIndex >= totalYears - 1;
    if (prevBtn) prevBtn.disabled = atStart;
    if (nextBtn) nextBtn.disabled = atEnd;
    if (edgePrevBtn) edgePrevBtn.disabled = atStart;
    if (edgeNextBtn) edgeNextBtn.disabled = atEnd;

    // Render active year block's matching quarter rows ONLY (no vertical stacking across years)
    var rowsHtml = '';
    var visibleQuarters = 0;
    for (var q = 1; q <= 4; q++) {
      if (!filterActive || quarterMatchesFilter(block, activeBlockIndex, q)) {
        rowsHtml += renderQuarterRow(block, activeBlockIndex, q);
        visibleQuarters++;
      }
    }

    if (visibleQuarters > 0) {
      container.hidden = false;
      container.innerHTML =
        '<div class="ember-year-block ember-year-block--active' + (blockUnlocked ? '' : ' is-locked-block') + '" data-block-id="' + block.id + '">' +
        '  <div class="ember-quarters">' + rowsHtml + '</div>' +
        '</div>';
      if (emptyStateEl) emptyStateEl.hidden = true;
    } else {
      container.hidden = true;
      container.innerHTML = '';
      if (emptyStateEl) {
        emptyStateEl.hidden = false;
        if (emptyStateText) {
          emptyStateText.textContent = totalMatches > 0
            ? 'No quarters in ' + titleLabel + ' matched your filter. Try another year pill above.'
            : 'No Ember quarters matched your active search or status filter.';
        }
      }
    }

    if (!options.skipAnimate && yearModalBody) {
      yearModalBody.classList.remove('step-entering');
      void yearModalBody.offsetWidth;
      yearModalBody.classList.add('step-entering');
    }

    // Search feedback banner
    if (searchFeedback && searchFeedbackText) {
      if (filterActive) {
        searchFeedback.hidden = false;
        var qLabel = searchQuery.trim() ? (' matching "' + searchQuery.trim() + '"') : '';
        searchFeedbackText.textContent = 'Found ' + totalMatches + ' quarter slot' + (totalMatches === 1 ? '' : 's') + qLabel + ' across ' + totalYears + ' years';
      } else {
        searchFeedback.hidden = true;
      }
    }
    if (searchClearBtn) {
      searchClearBtn.hidden = !searchQuery.trim();
    }

    // Contextual footer secondary action: jump to checklist or continue to next unlocked year
    if (footSecondaryEl) {
      var checklistTabBtn = document.querySelector('.page-tabs [data-tab="checklist"], .page-tabs [data-tab="documents"]');
      if (block.year && isQuarterDoneOrSkipped(block, 4) && activeBlockIndex < totalYears - 1 && !blocks[activeBlockIndex + 1].year) {
        footSecondaryEl.innerHTML = '<button type="button" class="btn small" id="emberContinueNextYearBtn">Continue to Year ' + (activeBlockIndex + 2) + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>';
      } else if (checklistTabBtn) {
        var checklistTabName = checklistTabBtn.getAttribute('data-tab');
        footSecondaryEl.innerHTML = '<button type="button" class="btn small secondary" data-open-tab="' + escapeHtml(checklistTabName) + '"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Back to Checklist</button>';
      } else {
        footSecondaryEl.innerHTML = '';
      }
    }

    updateQueueBadge();

    if (addYearBtn) {
      if (blocks.length >= 4) {
        addYearBtn.classList.add('hidden');
        addYearBtn.disabled = true;
        addYearBtn.style.display = 'none';
      } else {
        addYearBtn.classList.remove('hidden');
        addYearBtn.disabled = false;
        addYearBtn.style.display = '';
      }
    }
  }

  function openYearByIndex(idx, opts) {
    var target = Math.max(0, Math.min(idx, blocks.length - 1));
    if (target === activeBlockIndex && !(opts && opts.force)) return;
    closeYearListbox(false);
    activeBlockIndex = target;
    render(opts || {});
  }

  function stepYear(delta) {
    var nextIdx = activeBlockIndex + delta;
    if (nextIdx >= 0 && nextIdx < blocks.length) {
      openYearByIndex(nextIdx);
    }
  }

  function resetFilters() {
    searchQuery = '';
    activeFilter = 'all';
    if (searchInput) searchInput.value = '';
    if (hasExternalSearch && sharedDocSearch) {
      var tabEmber = document.getElementById('tabEmber');
      if (tabEmber && tabEmber.classList.contains('active')) {
        sharedDocSearch.value = '';
        sharedDocSearch.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    filterPills.forEach(function (b) {
      b.classList.toggle('active', (b.getAttribute('data-ember-filter') || 'all') === 'all');
    });
    persistFilters();
    render({ autoJump: false, skipAnimate: true });
  }

  // Pills click & horizontal scroll
  if (pillsContainer) {
    pillsContainer.addEventListener('click', function (e) {
      var pill = e.target.closest('[data-ember-year-idx]');
      if (!pill) return;
      var idx = Number(pill.getAttribute('data-ember-year-idx'));
      openYearByIndex(idx);
    });
    pillsContainer.addEventListener('scroll', updateScrollButtons, { passive: true });
    pillsContainer.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && pillsContainer.scrollWidth > pillsContainer.clientWidth) {
        e.preventDefault();
        pillsContainer.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  if (scrollLeftBtn && pillsContainer) {
    scrollLeftBtn.addEventListener('click', function () {
      pillsContainer.scrollBy({ left: -220, behavior: 'smooth' });
    });
  }
  if (scrollRightBtn && pillsContainer) {
    scrollRightBtn.addEventListener('click', function () {
      pillsContainer.scrollBy({ left: 220, behavior: 'smooth' });
    });
  }

  // Edge, footer, and "Continue to Year X" navigation
  if (prevBtn) prevBtn.addEventListener('click', function () { stepYear(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { stepYear(1); });
  if (edgePrevBtn) edgePrevBtn.addEventListener('click', function () { stepYear(-1); });
  if (edgeNextBtn) edgeNextBtn.addEventListener('click', function () { stepYear(1); });
  if (footSecondaryEl) {
    footSecondaryEl.addEventListener('click', function (e) {
      if (e.target.closest('#emberContinueNextYearBtn')) {
        stepYear(1);
      }
    });
  }

  // Custom accessible calendar-year listbox interaction
  if (yearTriggerBtn && yearListboxEl) {
    yearTriggerBtn.addEventListener('click', function () {
      if (isYearMenuOpen) closeYearListbox(true);
      else openYearListbox();
    });

    yearTriggerBtn.addEventListener('keydown', function (e) {
      if (yearTriggerBtn.disabled) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openYearListbox();
      }
    });

    yearListboxEl.addEventListener('click', function (e) {
      var opt = e.target.closest('[role="option"]');
      if (!opt) return;
      selectCalendarYear(opt.getAttribute('data-year'));
    });

    yearListboxEl.addEventListener('keydown', function (e) {
      var options = Array.prototype.slice.call(yearListboxEl.querySelectorAll('[role="option"]'));
      if (!options.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightOptionIndex(highlightedYearIdx + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightOptionIndex(highlightedYearIdx - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        highlightOptionIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        highlightOptionIndex(options.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var chosen = options[highlightedYearIdx >= 0 ? highlightedYearIdx : 0];
        if (chosen) selectCalendarYear(chosen.getAttribute('data-year'));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeYearListbox(true);
      } else if (e.key === 'Tab') {
        closeYearListbox(false);
      } else if (/^[0-9]$/.test(e.key)) {
        typeaheadBuffer += e.key;
        clearTimeout(typeaheadTimer);
        typeaheadTimer = setTimeout(function () { typeaheadBuffer = ''; }, 650);
        var matchIdx = options.findIndex(function (opt) {
          return (opt.getAttribute('data-year') || '').indexOf(typeaheadBuffer) === 0;
        });
        if (matchIdx >= 0) highlightOptionIndex(matchIdx);
      }
    });

    document.addEventListener('click', function (e) {
      if (isYearMenuOpen && yearPickerEl && !yearPickerEl.contains(e.target)) {
        closeYearListbox(false);
      }
    });
  }

  // Search & Filter controls
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchQuery = this.value || '';
      persistFilters();
      render({ autoJump: true, skipAnimate: true });
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        this.value = '';
        searchQuery = '';
        persistFilters();
        render({ autoJump: false, skipAnimate: true });
        this.blur();
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', function () {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchQuery = '';
      persistFilters();
      render({ autoJump: false, skipAnimate: true });
    });
  }

  if (searchResetBtn) {
    searchResetBtn.addEventListener('click', resetFilters);
  }
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', resetFilters);
  }

  filterPills.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterPills.forEach(function (b) { b.classList.toggle('active', b === btn); });
      activeFilter = btn.getAttribute('data-ember-filter') || 'all';
      persistFilters();
      render({ autoJump: true, skipAnimate: true });
    });
  });

  // Expose search sync hook for Clergy portal's shared #docSearchInput
  window.ednpEmberSearch = function (query, opts) {
    searchQuery = String(query == null ? '' : query);
    if (searchInput) searchInput.value = searchQuery;
    render({
      autoJump: !(opts && opts.autoJump === false),
      skipAnimate: true,
    });
  };

  window.ednpRefreshEmberNav = function () {
    if (!pillsContainer) return;
    var activePill = pillsContainer.querySelector('[data-ember-year-idx="' + activeBlockIndex + '"]');
    if (activePill) revealYearPillHorizontally(activePill, false);
    updateScrollButtons();
  };

  // Event delegation inside #emberYearsContainer & header Remove Year 4 button
  container.addEventListener('change', function (e) {
    var target = e.target;
    if (target.matches('.ember-file-input')) {
      var fBlockId = Number(target.getAttribute('data-block-id'));
      var quarter = Number(target.getAttribute('data-quarter'));
      var file = target.files && target.files[0];
      if (file) {
        enqueueUpload(fBlockId, quarter, file);
      }
      target.value = '';
    }
  });

  container.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');

    if (action === 'pick-file') {
      var inputId = btn.getAttribute('data-input-id');
      var input = document.getElementById(inputId);
      if (input) input.click();
      return;
    }

    var blockId = Number(btn.getAttribute('data-block-id'));
    var quarter = Number(btn.getAttribute('data-quarter'));
    var found = findBlock(blockId);
    if (!found) return;

    if (action === 'skip-quarter') {
      found.block.quarters[quarter].status = 'skipped';
      ensureNextBlockIfQ4Done(found.index);
      render({ skipAnimate: true });
      return;
    }

    if (action === 'retry-quarter') {
      var pending = found.block.quarters[quarter].pendingFile;
      if (pending) {
        enqueueUpload(blockId, quarter, pending);
      }
      return;
    }

    if (action === 'delete-quarter') {
      handleDelete(blockId, quarter);
      return;
    }
  });

  if (removeYearBtn) {
    removeYearBtn.addEventListener('click', function () {
      var blockId = Number(removeYearBtn.getAttribute('data-block-id'));
      var foundIdx = -1;
      for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx === 3 && blocks.length > 3 && !blockHasSaved(blocks[foundIdx])) {
        blocks.splice(foundIdx, 1);
        activeBlockIndex = Math.min(activeBlockIndex, blocks.length - 1);
        render();
      }
    });
  }

  if (addYearBtn) {
    addYearBtn.addEventListener('click', function () {
      if (blocks.length >= 4) {
        addYearBtn.classList.add('hidden');
        addYearBtn.disabled = true;
        addYearBtn.style.display = 'none';
        return;
      }
      blocks.push(createBlock(null));
      activeBlockIndex = blocks.length - 1;
      render();
    });
  }

  // Keyboard navigation when Ember tab is active
  document.addEventListener('keydown', function (e) {
    var tabEmber = document.getElementById('tabEmber');
    if (!tabEmber || tabEmber.offsetParent === null) return;
    if (isYearMenuOpen || document.querySelector('.modal-bg.show, .modal-bg.active, .ph-picker-overlay')) return;
    var activeEl = document.activeElement;
    if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(activeEl.tagName) !== -1 || activeEl.isContentEditable)) return;

    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      stepYear(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      stepYear(1);
    }
  });

  // Warn before closing tab if uploads are still running or queued
  window.addEventListener('beforeunload', function (e) {
    if (activeJob || uploadQueue.length > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Generic tab switcher fallback if a page uses .page-tabs [data-tab] without record-detail.js
  var pageTabsEl = document.querySelector('.page-tabs[data-active-tab]');
  if (pageTabsEl && typeof window.selectTab !== 'function') {
    var defaultTab = pageTabsEl.getAttribute('data-active-tab') || 'checklist';

    function updateUrlTab(tab, mode) {
      if (mode === 'skip' || !window.history || !window.location) return;
      try {
        var url = new URL(window.location.href);
        var currentParam = url.searchParams.get('tab');
        var target = (tab === defaultTab) ? null : tab;
        var normalizedCurrent = (currentParam === defaultTab || currentParam === null) ? null : currentParam;

        if (target === normalizedCurrent) return;

        if (target === null) {
          url.searchParams.delete('tab');
        } else {
          url.searchParams.set('tab', target);
        }

        var targetPath = url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
        if (mode === 'replace') {
          window.history.replaceState({ tab: tab }, '', targetPath);
        } else {
          window.history.pushState({ tab: tab }, '', targetPath);
        }
      } catch (_e) {}
    }

    window.selectTab = function (tab, historyMode) {
      var targetTab = tab || defaultTab;
      document.querySelectorAll('.tab-content').forEach(function (el) { el.classList.remove('active'); });
      document.querySelectorAll('.page-tabs [data-tab]').forEach(function (btn) { btn.classList.remove('active'); });
      var btn = document.querySelector('.page-tabs [data-tab="' + targetTab + '"]') || document.querySelector('.page-tabs [data-tab]');
      if (!btn) return;
      btn.classList.add('active');
      var actualTab = btn.getAttribute('data-tab') || targetTab;
      var targetId = btn.getAttribute('data-target');
      var panel = targetId ? document.getElementById(targetId) : null;
      if (panel) panel.classList.add('active');

      updateUrlTab(actualTab, historyMode || 'push');
      if (actualTab === 'ember') {
        setTimeout(window.ednpRefreshEmberNav, 30);
      }
    };

    document.querySelectorAll('.page-tabs [data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.selectTab(btn.getAttribute('data-tab'));
      });
    });

    window.addEventListener('popstate', function () {
      try {
        var params = new URLSearchParams(window.location.search);
        var currentTab = params.get('tab') || defaultTab;
        window.selectTab(currentTab, 'skip');
      } catch (_e) {}
    });

    var urlParams = new URLSearchParams(window.location.search);
    var queryTab = urlParams.get('tab');
    var hash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
    var hashTab = (hash === 'ember' || hash === 'tabember') ? 'ember' :
                  (hash === 'checklist' || hash === 'tabchecklist') ? 'checklist' : null;

    var initialTab = queryTab || hashTab || defaultTab;
    window.selectTab(initialTab, 'replace');
  }

  // Refresh scroll buttons whenever Ember tab opens (including record-detail.js pages)
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-tab="ember"], [data-open-tab="ember"]')) {
      setTimeout(window.ednpRefreshEmberNav, 50);
    }
    var tabTrigger = e.target.closest('[data-open-tab]');
    if (!tabTrigger) return;
    e.preventDefault();
    var tabName = tabTrigger.getAttribute('data-open-tab');
    if (typeof window.selectTab === 'function') {
      window.selectTab(tabName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Initialize blocks & restore state
  initBlocks();

  try {
    var initParams = new URLSearchParams(window.location.search || '');
    var emberYearParam = initParams.get('ember_year');
    var initHash = (window.location.hash || '').replace(/^#/, '');
    var targetYearNum = emberYearParam ? Number(emberYearParam) : (initHash.indexOf('ember-year-') === 0 ? Number(initHash.replace('ember-year-', '')) : NaN);
    var matchedYearIdx = -1;
    if (!isNaN(targetYearNum)) {
      for (var bi = 0; bi < blocks.length; bi++) {
        if (blocks[bi].year === targetYearNum) {
          matchedYearIdx = bi;
          break;
        }
      }
    }
    if (matchedYearIdx >= 0) {
      activeBlockIndex = matchedYearIdx;
    } else {
      var savedIdx = Number(sessionStorage.getItem(ACTIVE_YEAR_KEY));
      if (!isNaN(savedIdx) && savedIdx >= 0 && savedIdx < blocks.length) {
        activeBlockIndex = savedIdx;
      }
    }

    var rawFilters = sessionStorage.getItem(EMBER_FILTERS_KEY);
    if (rawFilters) {
      var parsed = JSON.parse(rawFilters);
      if (parsed && ['all', 'saved', 'incomplete', 'skipped'].indexOf(parsed.filter) !== -1) {
        activeFilter = parsed.filter;
        filterPills.forEach(function (b) {
          b.classList.toggle('active', (b.getAttribute('data-ember-filter') || 'all') === activeFilter);
        });
      }
      if (!hasExternalSearch && parsed && parsed.q) {
        searchQuery = String(parsed.q);
        if (searchInput) searchInput.value = searchQuery;
      }
    }
  } catch (_e) {}

  if (hasExternalSearch && sharedDocSearch && sharedDocSearch.value) {
    searchQuery = sharedDocSearch.value;
  }

  render({ skipAnimate: true });
})();
