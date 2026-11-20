/* Contract Review page: Deployment & Official Status modal with custom
   accessible ARIA listboxes, Deanery -> Assignment cascade, Leave Reason
   toggle, focus trap, and zero-page-jump AJAX submission. */

(function () {
  var modal = document.getElementById('contractStatusModal');
  var form = document.getElementById('contractStatusForm');
  if (!modal || !form) return;

  var deaneriesEl = document.getElementById('deaneries-data');
  var deaneries = {};
  if (deaneriesEl) {
    try {
      deaneries = JSON.parse(deaneriesEl.textContent) || {};
    } catch (_e) {
      deaneries = {};
    }
  }

  var clergyNameEl = document.getElementById('contractModalClergyName');
  var clergyIdEl = document.getElementById('contractModalClergyId');
  var fullRecordLink = document.getElementById('contractModalFullRecordLink');
  var errorAlertEl = document.getElementById('contractModalErrorAlert');
  var nextInput = document.getElementById('contractModalNext');
  var yearsInput = document.getElementById('contractYearsService');
  var leaveFieldEl = document.getElementById('contractLeaveReasonField');
  var leaveInput = document.getElementById('contractLeaveReason');
  var retireNoteEl = document.getElementById('contractRetireNote');
  var contractEndInput = document.getElementById('contractEndDate');
  var retirementDateInput = document.getElementById('contractRetirementDate');
  var saveBtn = document.getElementById('contractModalSaveBtn');
  var saveBtnDefaultHtml = saveBtn ? saveBtn.innerHTML : 'Save Changes';

  var lastTriggerBtn = null;
  var openListboxes = [];
  var modalInitialState = { deaneryId: '', assignment: '', contractEnd: '' };

  function localTodayIso() {
    var now = new Date();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    return now.getFullYear() + '-' + m + '-' + d;
  }

  function closeAllListboxes(exceptInstance) {
    openListboxes.forEach(function (inst) {
      if (inst !== exceptInstance && inst.isOpen()) {
        inst.close(false);
      }
    });
  }

  function createListbox(container, onChange) {
    if (!container) return null;
    var hiddenInput = container.querySelector('input[type="hidden"]');
    var trigger = container.querySelector('.edit-select-trigger');
    var textEl = container.querySelector('.edit-select-text');
    var listbox = container.querySelector('.edit-select-listbox');
    if (!hiddenInput || !trigger || !textEl || !listbox) return null;

    var options = Array.from(listbox.querySelectorAll('[role="option"]')).map(function (li) {
      return {
        value: li.getAttribute('data-value') || '',
        label: li.textContent.trim(),
      };
    });
    var isOpen = false;
    var highlightedIndex = -1;
    var typeaheadBuffer = '';
    var typeaheadTimer = null;

    function getOptionElements() {
      return Array.from(listbox.querySelectorAll('[role="option"]'));
    }

    function highlightIndex(idx) {
      var els = getOptionElements();
      if (!els.length) {
        highlightedIndex = -1;
        listbox.removeAttribute('aria-activedescendant');
        return;
      }
      var clamped = Math.max(0, Math.min(idx, els.length - 1));
      highlightedIndex = clamped;
      els.forEach(function (el, i) {
        el.classList.toggle('is-highlighted', i === clamped);
      });
      var active = els[clamped];
      if (active) {
        listbox.setAttribute('aria-activedescendant', active.id);
        if (typeof active.scrollIntoView === 'function') {
          active.scrollIntoView({ block: 'nearest' });
        }
      }
    }

    function renderOptions() {
      listbox.innerHTML = '';
      var currentVal = hiddenInput.value;
      options.forEach(function (opt, idx) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.id = listbox.id + '_opt_' + idx;
        li.className = 'edit-select-option';
        li.setAttribute('data-value', opt.value);
        li.setAttribute('aria-selected', opt.value === currentVal ? 'true' : 'false');
        li.textContent = opt.label;
        listbox.appendChild(li);
      });
    }

    function syncDisplay() {
      var val = hiddenInput.value;
      var matched = options.find(function (o) { return o.value === val; });
      var label = matched ? matched.label : (options[0] ? options[0].label : '');
      textEl.textContent = label;
      textEl.classList.toggle('is-placeholder', val === '');
      getOptionElements().forEach(function (el) {
        el.setAttribute('aria-selected', (el.getAttribute('data-value') || '') === val ? 'true' : 'false');
      });
    }

    function setOptions(nextOptions) {
      options = Array.isArray(nextOptions) ? nextOptions.slice() : [];
      renderOptions();
      syncDisplay();
    }

    function setValue(nextValue, shouldNotify) {
      var targetVal = nextValue == null ? '' : String(nextValue);
      var prevVal = hiddenInput.value;
      hiddenInput.value = targetVal;
      syncDisplay();
      if (shouldNotify && prevVal !== targetVal && typeof onChange === 'function') {
        onChange(targetVal);
      }
    }

    function setDisabled(disabled, placeholderText) {
      var flag = Boolean(disabled);
      trigger.disabled = flag;
      trigger.setAttribute('aria-disabled', flag ? 'true' : 'false');
      if (flag) {
        close(false);
        if (placeholderText) {
          textEl.textContent = placeholderText;
          textEl.classList.add('is-placeholder');
        }
      }
    }

    function open() {
      if (trigger.disabled) return;
      closeAllListboxes(instance);
      isOpen = true;
      listbox.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      var els = getOptionElements();
      var selectedIdx = els.findIndex(function (el) {
        return el.getAttribute('aria-selected') === 'true';
      });
      highlightIndex(selectedIdx >= 0 ? selectedIdx : 0);
      try {
        listbox.focus();
      } catch (_e) {}
      if (typeof listbox.scrollIntoView === 'function') {
        listbox.scrollIntoView({ block: 'nearest' });
      }
    }

    function close(restoreFocus) {
      if (!isOpen) return;
      isOpen = false;
      highlightedIndex = -1;
      listbox.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      listbox.removeAttribute('aria-activedescendant');
      if (restoreFocus) {
        try {
          trigger.focus();
        } catch (_e) {}
      }
    }

    function selectIndex(idx) {
      var els = getOptionElements();
      var chosen = els[idx];
      if (!chosen) return;
      var val = chosen.getAttribute('data-value') || '';
      setValue(val, true);
      close(true);
    }

    trigger.addEventListener('click', function () {
      if (isOpen) close(true);
      else open();
    });

    trigger.addEventListener('keydown', function (e) {
      if (trigger.disabled) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) close(true);
        else open();
      }
    });

    listbox.addEventListener('click', function (e) {
      var optEl = e.target.closest('[role="option"]');
      if (!optEl) return;
      var els = getOptionElements();
      var idx = els.indexOf(optEl);
      if (idx >= 0) selectIndex(idx);
    });

    listbox.addEventListener('keydown', function (e) {
      var els = getOptionElements();
      if (!els.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightIndex(highlightedIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightIndex(highlightedIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        highlightIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        highlightIndex(els.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectIndex(highlightedIndex >= 0 ? highlightedIndex : 0);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close(true);
      } else if (e.key === 'Tab') {
        close(false);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        typeaheadBuffer += e.key.toLowerCase();
        clearTimeout(typeaheadTimer);
        typeaheadTimer = setTimeout(function () {
          typeaheadBuffer = '';
        }, 650);
        var matchIdx = els.findIndex(function (el) {
          return el.textContent.trim().toLowerCase().indexOf(typeaheadBuffer) === 0;
        });
        if (matchIdx >= 0) {
          highlightIndex(matchIdx);
        }
      }
    });

    var instance = {
      isOpen: function () { return isOpen; },
      isSameContainer: function (el) { return el === container; },
      hasValue: function (val) {
        var targetVal = val == null ? '' : String(val);
        return options.some(function (o) { return o.value === targetVal; });
      },
      open: open,
      close: close,
      setOptions: setOptions,
      setValue: setValue,
      getValue: function () { return hiddenInput.value; },
      setDisabled: setDisabled,
    };

    renderOptions();
    syncDisplay();
    openListboxes.push(instance);
    return instance;
  }

  function clearErrors() {
    if (typeof window.applyFormErrors === 'function') {
      window.applyFormErrors(form, {});
    }
    if (errorAlertEl) {
      errorAlertEl.hidden = true;
      errorAlertEl.textContent = '';
    }
  }

  function showGeneralError(msg) {
    if (!errorAlertEl) return;
    errorAlertEl.textContent = msg;
    errorAlertEl.hidden = false;
  }

  function toggleLeaveReasonField() {
    if (!leaveFieldEl || !statusSelect) return;
    var isOnLeave = statusSelect.getValue() === 'On Leave';
    leaveFieldEl.classList.toggle('hidden', !isOnLeave);
  }

  function syncRetirementFieldState(isUserChange) {
    if (!statusSelect) return;
    var isRetired = statusSelect.getValue() === 'Retired';
    var todayIso = localTodayIso();

    if (retireNoteEl) {
      retireNoteEl.hidden = !isRetired;
    }

    if (isRetired) {
      if (deanerySelect) {
        deanerySelect.setValue('', false);
        deanerySelect.setDisabled(true, 'Cleared on retirement');
      }
      if (assignmentSelect) {
        assignmentSelect.setValue('', false);
        assignmentSelect.setDisabled(true, 'Cleared on retirement');
      }
      if (contractEndInput) {
        contractEndInput.value = '';
        contractEndInput.disabled = true;
      }
      if (retirementDateInput && isUserChange && !retirementDateInput.value) {
        retirementDateInput.value = todayIso;
      }
      return;
    }

    if (deanerySelect) {
      deanerySelect.setDisabled(false);
      if (isUserChange && !deanerySelect.getValue() && modalInitialState.deaneryId) {
        deanerySelect.setValue(modalInitialState.deaneryId, false);
      }
    }
    var curDeanery = deanerySelect ? deanerySelect.getValue() : '';
    var preferredAssign = (isUserChange && !assignmentSelect.getValue() && modalInitialState.assignment)
      ? modalInitialState.assignment
      : (assignmentSelect ? assignmentSelect.getValue() : '');
    syncAssignmentOptions(curDeanery, preferredAssign);

    if (contractEndInput) {
      contractEndInput.disabled = false;
      if (isUserChange && !contractEndInput.value && modalInitialState.contractEnd) {
        contractEndInput.value = modalInitialState.contractEnd;
      }
    }
    if (retirementDateInput && isUserChange && retirementDateInput.value && retirementDateInput.value <= todayIso) {
      retirementDateInput.value = '';
    }
  }

  var rankSelect = createListbox(form.querySelector('[data-edit-select="rank"]'));
  var statusSelect = createListbox(form.querySelector('[data-edit-select="status"]'), function () {
    toggleLeaveReasonField();
    syncRetirementFieldState(true);
  });
  var assignmentSelect = createListbox(form.querySelector('[data-edit-select="assignment"]'));
  var deanerySelect = createListbox(form.querySelector('[data-edit-select="deanery"]'), function (deaneryId) {
    syncAssignmentOptions(deaneryId, '');
  });

  function populateDeaneriesOptions() {
    if (!deanerySelect) return;
    var list = [{ value: '', label: 'Select Deanery' }];
    Object.entries(deaneries).forEach(function (entry) {
      list.push({ value: entry[0], label: entry[1].name });
    });
    deanerySelect.setOptions(list);
  }

  function syncAssignmentOptions(deaneryId, preferredAssignment) {
    if (!assignmentSelect) return;
    var existing = (preferredAssignment || '').trim();
    if (deaneryId && deaneries[deaneryId]) {
      var parishes = (deaneries[deaneryId].parishes || []).slice();
      var options = [{ value: '', label: 'Select Parish / Assignment' }];
      parishes.forEach(function (p) {
        options.push({ value: p, label: p });
      });
      if (existing && parishes.indexOf(existing) === -1) {
        options.push({ value: existing, label: existing });
      }
      assignmentSelect.setOptions(options);
      assignmentSelect.setDisabled(false);
      assignmentSelect.setValue(existing && options.some(function (o) { return o.value === existing; }) ? existing : '', false);
      return;
    }

    // Preserve a pre-existing assignment when the record has no deanery assigned yet
    if (existing) {
      assignmentSelect.setOptions([
        { value: '', label: 'Clear assignment' },
        { value: existing, label: existing },
      ]);
      assignmentSelect.setDisabled(false);
      assignmentSelect.setValue(existing, false);
      return;
    }

    assignmentSelect.setOptions([{ value: '', label: 'Select Deanery first' }]);
    assignmentSelect.setValue('', false);
    assignmentSelect.setDisabled(true, 'Select Deanery first');
  }

  function resetSubmitState() {
    function clearFlags() {
      if (typeof window.ednpClearSkeleton === 'function') {
        window.ednpClearSkeleton();
      }
      form.classList.remove('is-submitting');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('is-busy');
        saveBtn.removeAttribute('aria-busy');
        saveBtn.innerHTML = saveBtnDefaultHtml;
      }
    }
    clearFlags();
    // skeleton.js defers .is-busy via setTimeout(..., 0) on submit; clear again after that macrotask.
    setTimeout(clearFlags, 0);
  }

  function openContractModal(triggerBtn) {
    var d = triggerBtn.dataset;
    lastTriggerBtn = triggerBtn;
    clearErrors();
    closeAllListboxes(null);
    resetSubmitState();

    if (clergyNameEl) clergyNameEl.textContent = d.recordName || '';
    if (clergyIdEl) clergyIdEl.textContent = d.recordId || '';
    if (fullRecordLink) fullRecordLink.href = d.recordUrl || '#';
    form.action = d.updateUrl || '';
    if (nextInput) {
      nextInput.value = window.location.pathname + window.location.search;
    }

    var nextRank = (d.rank && rankSelect && rankSelect.hasValue(d.rank)) ? d.rank : 'deacon';
    var nextStatus = (d.status && statusSelect && statusSelect.hasValue(d.status)) ? d.status : 'Active';
    if (rankSelect) rankSelect.setValue(nextRank, false);
    if (yearsInput) yearsInput.value = d.yearsService || '0 years';
    if (statusSelect) statusSelect.setValue(nextStatus, false);
    if (leaveInput) leaveInput.value = d.leaveReason || '';
    toggleLeaveReasonField();

    modalInitialState = {
      deaneryId: d.deaneryId || '',
      assignment: d.assignment || '',
      contractEnd: d.contractEnd || '',
    };

    populateDeaneriesOptions();
    if (deanerySelect) {
      deanerySelect.setDisabled(false);
      deanerySelect.setValue(d.deaneryId || '', false);
    }
    syncAssignmentOptions(d.deaneryId || '', d.assignment || '');

    if (contractEndInput) {
      contractEndInput.disabled = false;
      contractEndInput.value = d.contractEnd || '';
    }
    if (retirementDateInput) retirementDateInput.value = d.retirementDate || '';
    syncRetirementFieldState(false);

    var modalCard = modal.querySelector('.modal');
    if (modalCard) modalCard.scrollTop = 0;

    if (typeof window.openModal === 'function') {
      window.openModal('contractStatusModal');
    } else {
      modal.classList.add('show');
    }

    var rankTrigger = document.getElementById('contractRankTrigger');
    setTimeout(function () {
      if (modalCard) modalCard.scrollTop = 0;
      if (rankTrigger) {
        try {
          rankTrigger.focus();
        } catch (_e) {}
      }
    }, 30);
  }

  function handleModalClosed() {
    closeAllListboxes(null);
    if (lastTriggerBtn && document.body.contains(lastTriggerBtn)) {
      try {
        lastTriggerBtn.focus();
      } catch (_e) {}
    }
    lastTriggerBtn = null;
  }

  document.querySelectorAll('[data-contract-edit]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openContractModal(btn);
    });
  });

  document.addEventListener('click', function (e) {
    var selectBox = e.target.closest('.edit-select');
    openListboxes.forEach(function (inst) {
      if (!inst.isOpen()) return;
      if (!selectBox || !inst.isSameContainer(selectBox)) {
        inst.close(false);
      }
    });

    if (e.target === modal || e.target.closest('[data-close-modal="contractStatusModal"]')) {
      setTimeout(handleModalClosed, 0);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('show')) return;

    if (e.key === 'Escape') {
      var openInst = openListboxes.find(function (inst) { return inst.isOpen(); });
      if (openInst) {
        e.preventDefault();
        openInst.close(true);
        return;
      }
      e.preventDefault();
      if (typeof window.closeModal === 'function') {
        window.closeModal('contractStatusModal');
      } else {
        modal.classList.remove('show');
      }
      handleModalClosed();
      return;
    }

    if (e.key === 'Tab') {
      var focusable = Array.from(
        modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (el) {
        return el.offsetParent !== null && !el.closest('.hidden') && !el.hidden;
      });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (!modal.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearErrors();
    closeAllListboxes(null);

    if (statusSelect && statusSelect.getValue() === 'On Leave' && leaveInput && !leaveInput.value.trim()) {
      resetSubmitState();
      var leaveMsg = 'Leave reason is required when status is On Leave.';
      if (typeof window.applyFormErrors === 'function') {
        window.applyFormErrors(form, { leave_reason: [leaveMsg] });
      }
      if (typeof window.showToast === 'function') {
        window.showToast(leaveMsg, 'error');
      }
      return;
    }

    if (statusSelect && statusSelect.getValue() === 'Retired' && retirementDateInput && retirementDateInput.value && retirementDateInput.value > localTodayIso()) {
      resetSubmitState();
      var retMsg = 'Retirement date cannot be in the future while status is Retired. Keep an active status for a planned retirement date.';
      if (typeof window.applyFormErrors === 'function') {
        window.applyFormErrors(form, { retirement_date: [retMsg] });
      }
      if (typeof window.showToast === 'function') {
        window.showToast(retMsg, 'error');
      }
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.setAttribute('aria-busy', 'true');
      saveBtn.textContent = 'Saving...';
    }

    var didSucceed = false;
    try {
      var res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      var data = (typeof window.parseJsonResponse === 'function')
        ? await window.parseJsonResponse(res)
        : await res.json();

      if (!data || !data.ok) {
        var errMsg = (data && data.error) || 'Please check the form and try again.';
        if (data && data.errors && typeof window.applyFormErrors === 'function') {
          window.applyFormErrors(form, data.errors);
        }
        if (!data || !data.errors || (data.errors.__all__ && data.errors.__all__.length) || !Object.keys(data.errors).length) {
          showGeneralError(errMsg);
        }
        if (typeof window.showToast === 'function') {
          window.showToast(errMsg, 'error');
        }
        return;
      }

      didSucceed = true;
      var okMsg = data.message || 'Deployment and official status updated.';
      try {
        sessionStorage.setItem('ednp_pending_toast', JSON.stringify({
          message: okMsg,
          level: 'success',
        }));
      } catch (_err) {
        if (typeof window.showToast === 'function') {
          window.showToast(okMsg, 'success');
        }
      }
      if (typeof window.closeModal === 'function') {
        window.closeModal('contractStatusModal');
      } else {
        modal.classList.remove('show');
      }
      window.location.reload();
    } catch (_err) {
      showGeneralError('Network error while saving. Please try again.');
      if (typeof window.showToast === 'function') {
        window.showToast('Network error while saving. Please try again.', 'error');
      }
    } finally {
      if (!didSucceed) {
        resetSubmitState();
      }
    }
  });
})();
