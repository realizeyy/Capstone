/* Record detail page: the Personal Information / Documents / Ember Letters
   tab switcher, and initializing the Deanery -> Assignment cascade with this
   record's existing values (the shared populateDeaneries/updateParishOptions/
   toggleLeaveReason helpers come from clergy-records.js). The tab shown
   first is the tab bar's data-active-tab. */

function updateTabUrl(tab, defaultTab, mode) {
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

function selectTab(tab, historyMode) {
  var map = {
    personal: { content: 'tabPersonal', btn: 'tabBtnPersonal' },
    documents: { content: 'tabDocuments', btn: 'tabBtnDocuments' },
    ember: { content: 'tabEmber', btn: 'tabBtnEmber' },
  };
  var validTab = map[tab] ? tab : 'personal';
  var chosen = map[validTab];
  document.querySelectorAll('.tab-content').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('.page-tabs button').forEach(function (el) { el.classList.remove('active'); });
  var contentEl = document.getElementById(chosen.content);
  var btnEl = document.getElementById(chosen.btn);
  if (contentEl) contentEl.classList.add('active');
  if (btnEl) btnEl.classList.add('active');
  var topSaveBtn = document.getElementById('topSaveRecordBtn');
  if (topSaveBtn) {
    topSaveBtn.style.display = (validTab === 'personal') ? '' : 'none';
  }

  updateTabUrl(validTab, 'personal', historyMode || 'push');
  if (validTab === 'ember' && typeof window.ednpRefreshEmberNav === 'function') {
    setTimeout(window.ednpRefreshEmberNav, 30);
  }
}

window.selectTab = selectTab;

function initRecordDetailTabs(activeTab) {
  var urlParams = new URLSearchParams(window.location.search);
  var queryTab = urlParams.get('tab');
  var hash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
  var hashTab = (hash === 'documents' || hash === 'tabdocuments') ? 'documents' :
                (hash === 'ember' || hash === 'tabember') ? 'ember' :
                (hash === 'personal' || hash === 'tabpersonal') ? 'personal' : null;

  var initialTab = queryTab || hashTab || activeTab || 'personal';
  selectTab(initialTab, 'replace');

  window.addEventListener('popstate', function () {
    try {
      var params = new URLSearchParams(window.location.search);
      var currentTab = params.get('tab') || 'personal';
      selectTab(currentTab, 'skip');
    } catch (_e) {}
  });

  var recordDataEl = document.getElementById('record-data');
  if (!recordDataEl) return;
  var recordData = JSON.parse(recordDataEl.textContent);
  populateDeaneries('editDeanery');
  if (recordData.deanery_id) {
    document.getElementById('editDeanery').value = String(recordData.deanery_id);
  }
  updateParishOptions('editDeanery', 'editAssignment');

  var assignmentSelect = document.getElementById('editAssignment');
  if (recordData.assignment) {
    var hasOption = Array.from(assignmentSelect.options).some(function (o) { return o.value === recordData.assignment; });
    if (!hasOption) {
      var opt = document.createElement('option');
      opt.value = recordData.assignment;
      opt.textContent = recordData.assignment;
      assignmentSelect.appendChild(opt);
    }
    assignmentSelect.value = recordData.assignment;
  }

  toggleLeaveReason('editStatus', 'editLeaveReasonField');
}

document.querySelectorAll('.page-tabs [data-tab]').forEach(function (button) {
  button.addEventListener('click', function () { selectTab(button.dataset.tab); });
});

initRecordDetailTabs(document.querySelector('[data-active-tab]').dataset.activeTab);
