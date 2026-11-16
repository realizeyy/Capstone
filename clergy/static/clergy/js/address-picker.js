/* Spacious Philippine Civic Address, Diocesan Parish, and School / CHED Institution Picker Dialog
 *
 * Markup:
 *   Civic address:
 *     <input id="myField">
 *     <button type="button" class="ph-picker-btn" data-ph-picker-target="myField">...</button>
 *
 *   Parish of Ordination / Sacraments:
 *     <input id="diaconatePlaceInput">
 *     <button type="button" class="ph-picker-btn" data-ph-picker-target="diaconatePlaceInput" data-picker-mode="parish">...</button>
 *
 *   Deployment Parish / Station (populates station_name with parish name and
 *   auto-fills sibling place_name inside the same form):
 *     <input name="station_name" id="depStationInput">
 *     <button type="button" class="ph-picker-btn" data-ph-picker-target="depStationInput" data-picker-mode="parish">...</button>
 *
 *   School / CHED Institution (supports sibling input inside .input-with-action):
 *     <div class="input-with-action">
 *       <input name="edu_institution">
 *       <button type="button" class="ph-picker-btn" data-picker-mode="school">...</button>
 *     </div>
 */
(function () {
  const SK = '<div class="ph-picker-loading" aria-label="Loading"><span class="sk-line w90"></span><span class="sk-line w70"></span><span class="sk-line w90"></span><span class="sk-line w50"></span></div>';
  const DATA_BASE = '/static/clergy/data/';
  const MAX_VISIBLE_ROWS = 200;

  const jsonCache = {};
  let parishesPromise = null;

  function fetchJsonOnce(url, fallback) {
    if (!jsonCache[url]) {
      jsonCache[url] = fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .catch(() => fallback);
    }
    return jsonCache[url];
  }

  function loadProvinces() {
    return fetchJsonOnce(DATA_BASE + 'provinces.json', []);
  }

  function loadCities() {
    return fetchJsonOnce(DATA_BASE + 'cities.json', []);
  }

  function loadBarangays(cityCode) {
    return fetchJsonOnce(DATA_BASE + 'barangays/' + cityCode + '.json', []);
  }

  function loadChedInstitutions() {
    return fetchJsonOnce(DATA_BASE + 'ched_institutions.json', null);
  }

  function loadElementarySchools() {
    return fetchJsonOnce(DATA_BASE + 'elementary_schools.json', null);
  }

  function extractParishes(deaneriesData) {
    const result = [];
    if (!deaneriesData || typeof deaneriesData !== 'object') return result;
    Object.keys(deaneriesData).forEach((deaneryId) => {
      const d = deaneriesData[deaneryId];
      if (!d) return;
      const deaneryName = (d.name || '').trim();
      if (Array.isArray(d.parish_items) && d.parish_items.length) {
        d.parish_items.forEach((p) => {
          result.push({
            id: p.id || null,
            name: p.name || '',
            place: p.place || '',
            label: p.label || (p.place ? (p.name + ' - ' + p.place) : p.name),
            deaneryId: String(deaneryId),
            deaneryName: deaneryName,
          });
        });
      } else if (Array.isArray(d.parishes)) {
        d.parishes.forEach((str) => {
          let name = str;
          let place = '';
          if (str.includes(' - ')) {
            const parts = str.split(' - ');
            name = parts[0].trim();
            place = parts.slice(1).join(' - ').trim();
          } else if (str.includes(', ')) {
            const parts = str.split(', ');
            name = parts[0].trim();
            place = parts.slice(1).join(', ').trim();
          }
          result.push({
            id: null,
            name: name,
            place: place,
            label: str,
            deaneryId: String(deaneryId),
            deaneryName: deaneryName,
          });
        });
      }
    });
    return result;
  }

  function loadParishes() {
    if (!parishesPromise) {
      const el = document.getElementById('deaneries-data');
      if (el && el.textContent) {
        try {
          const parsed = JSON.parse(el.textContent);
          parishesPromise = Promise.resolve(extractParishes(parsed));
        } catch (_e) {
          parishesPromise = null;
        }
      }
      if (!parishesPromise) {
        parishesPromise = fetch('/registrar/api/parishes/')
          .then((r) => r.json())
          .then((data) => extractParishes(data.deaneries || {}))
          .catch(() => []);
      }
    }
    return parishesPromise;
  }

  function resolveTargetInput(btn) {
    if (!btn) return null;
    const targetId = btn.getAttribute('data-ph-picker-target');
    if (targetId) {
      return document.getElementById(targetId);
    }
    const wrap = btn.closest('.input-with-action');
    return wrap ? wrap.querySelector('input, textarea') : null;
  }

  function closeAllPickers(focusEl) {
    let fallbackFocus = null;
    document.querySelectorAll('.ph-picker-overlay').forEach((p) => {
      if (!fallbackFocus && p._returnFocusTo) {
        fallbackFocus = p._returnFocusTo;
      }
      if (p._cleanup) p._cleanup();
      p.remove();
    });
    const nextFocus = focusEl === true ? fallbackFocus : focusEl;
    if (nextFocus && document.contains(nextFocus) && typeof nextFocus.focus === 'function') {
      try {
        nextFocus.focus({ preventScroll: true });
      } catch (_e) {
        nextFocus.focus();
      }
    }
  }

  function setInputValue(inputEl, value) {
    if (!inputEl) return;
    inputEl.value = value;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function openPicker(triggerBtn, targetInput) {
    closeAllPickers();

    const overlay = document.createElement('div');
    overlay.className = 'ph-picker-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'phPickerDialogTitle');
    overlay._returnFocusTo = triggerBtn;
    overlay.innerHTML =
      '<div class="ph-picker-modal">' +
        '<div class="ph-picker-head">' +
          '<div class="ph-picker-head-left">' +
            '<button type="button" class="ph-picker-back" hidden aria-label="Go back"><i class="fa-solid fa-arrow-left"></i></button>' +
            '<div class="ph-picker-title-group">' +
              '<h3 class="ph-picker-title" id="phPickerDialogTitle"><i class="fa-solid fa-church"></i> <span>Select Location</span></h3>' +
              '<p class="ph-picker-subtitle"></p>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="ph-picker-close" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="ph-picker-filter-wrap" hidden>' +
          '<button type="button" class="ph-filter-scroll-btn left" aria-label="Scroll filters left"><i class="fa-solid fa-chevron-left"></i></button>' +
          '<div class="ph-picker-filter-bar"></div>' +
          '<button type="button" class="ph-filter-scroll-btn right" aria-label="Scroll filters right"><i class="fa-solid fa-chevron-right"></i></button>' +
        '</div>' +
        '<div class="ph-picker-search-wrap">' +
          '<i class="fa-solid fa-magnifying-glass ph-picker-search-icon"></i>' +
          '<input type="text" class="ph-picker-search" placeholder="Search..." aria-label="Search items">' +
        '</div>' +
        '<div class="ph-picker-count-bar">' +
          '<span class="ph-picker-count-text"></span>' +
        '</div>' +
        '<div class="ph-picker-list" role="listbox"></div>' +
        '<div class="ph-picker-footer">' +
          '<div class="ph-picker-footer-left"></div>' +
          '<div class="ph-picker-footer-right">' +
            '<button type="button" class="btn secondary ph-picker-cancel-btn">Close</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    const titleSpan = overlay.querySelector('.ph-picker-title span');
    const titleIcon = overlay.querySelector('.ph-picker-title i');
    const subtitleEl = overlay.querySelector('.ph-picker-subtitle');
    const backBtn = overlay.querySelector('.ph-picker-back');
    const closeBtn = overlay.querySelector('.ph-picker-close');
    const cancelBtn = overlay.querySelector('.ph-picker-cancel-btn');
    const filterWrapEl = overlay.querySelector('.ph-picker-filter-wrap');
    const filterBarEl = overlay.querySelector('.ph-picker-filter-bar');
    const scrollLeftBtn = overlay.querySelector('.ph-filter-scroll-btn.left');
    const scrollRightBtn = overlay.querySelector('.ph-filter-scroll-btn.right');
    const searchEl = overlay.querySelector('.ph-picker-search');
    const countTextEl = overlay.querySelector('.ph-picker-count-text');
    const listEl = overlay.querySelector('.ph-picker-list');
    const footerLeftEl = overlay.querySelector('.ph-picker-footer-left');

    listEl.innerHTML = SK;

    function updateScrollButtons() {
      if (!filterBarEl || !scrollLeftBtn || !scrollRightBtn) return;
      const canScroll = filterBarEl.scrollWidth > filterBarEl.clientWidth + 2;
      scrollLeftBtn.hidden = !canScroll;
      scrollRightBtn.hidden = !canScroll;
      if (!canScroll) return;

      const atStart = filterBarEl.scrollLeft <= 4;
      const atEnd = filterBarEl.scrollLeft + filterBarEl.clientWidth >= filterBarEl.scrollWidth - 4;
      scrollLeftBtn.disabled = atStart;
      scrollRightBtn.disabled = atEnd;
      scrollLeftBtn.classList.toggle('disabled', atStart);
      scrollRightBtn.classList.toggle('disabled', atEnd);
    }

    if (scrollLeftBtn && scrollRightBtn) {
      scrollLeftBtn.addEventListener('click', () => {
        filterBarEl.scrollBy({ left: -160, behavior: 'smooth' });
        setTimeout(updateScrollButtons, 220);
      });
      scrollRightBtn.addEventListener('click', () => {
        filterBarEl.scrollBy({ left: 160, behavior: 'smooth' });
        setTimeout(updateScrollButtons, 220);
      });
      filterBarEl.addEventListener('scroll', updateScrollButtons, { passive: true });
      filterBarEl.addEventListener('wheel', (e) => {
        if (filterBarEl.scrollWidth > filterBarEl.clientWidth) {
          e.preventDefault();
          filterBarEl.scrollLeft += e.deltaY;
          updateScrollButtons();
        }
      }, { passive: false });
    }

    const onWindowResize = () => updateScrollButtons();
    window.addEventListener('resize', onWindowResize);
    overlay._cleanup = () => window.removeEventListener('resize', onWindowResize);

    const inputName = (targetInput.getAttribute('name') || '').toLowerCase();
    const inputId = (targetInput.id || '').toLowerCase();
    const btnMode = (triggerBtn.getAttribute('data-picker-mode') || '').toLowerCase();
    const isSchoolMode = btnMode === 'school' || btnMode === 'elementary';
    const isDeploymentStation = inputName === 'station_name';
    const isParishField = !isSchoolMode && (
      btnMode === 'parish' ||
      isDeploymentStation ||
      inputName.includes('diaconate_place') ||
      inputName.includes('ordination_place') ||
      inputName.includes('baptism_place') ||
      inputName.includes('confirmation_place') ||
      inputName.includes('marriage_place') ||
      inputName.includes('baptism') ||
      inputName.includes('confirmation') ||
      inputName.includes('marriage') ||
      inputId.includes('diaconate') ||
      inputId.includes('ordination') ||
      inputId.includes('baptism') ||
      inputId.includes('confirmation') ||
      inputId.includes('marriage')
    );

    let sacramentContext = 'Parish / Church';
    if (inputName.includes('baptism') || inputId.includes('baptism')) {
      sacramentContext = 'Baptism';
    } else if (inputName.includes('confirmation') || inputId.includes('confirmation')) {
      sacramentContext = 'Confirmation';
    } else if (inputName.includes('marriage') || inputId.includes('marriage')) {
      sacramentContext = 'Marriage';
    } else if (inputName.includes('diaconate') || inputId.includes('diaconate')) {
      sacramentContext = 'Diaconate Ordination';
    } else if (inputName.includes('ordination') || inputId.includes('ordination')) {
      sacramentContext = 'Ordination';
    }

    let stage = isSchoolMode ? (btnMode === 'elementary' ? 'elementary' : 'ched') : (isParishField ? 'parish' : 'province');
    let selectedProvince = null;
    let selectedCity = null;
    let selectedDeanery = 'all';
    let selectedChedRegion = 'all';
    let selectedElementaryMuni = 'all';
    let renderToken = 0;

    function createOptionRow(opts) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ph-picker-item ' + (opts.extraClass || 'ph-picker-parish-item');
      row.setAttribute('role', 'option');

      const iconBox = document.createElement('div');
      iconBox.className = 'ph-parish-icon-box';
      const iconEl = document.createElement('i');
      iconEl.className = opts.iconClass || 'fa-solid fa-location-dot';
      iconBox.appendChild(iconEl);
      row.appendChild(iconBox);

      const infoDiv = document.createElement('div');
      infoDiv.className = 'ph-parish-info';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'ph-parish-title';
      titleDiv.textContent = opts.title || '';
      infoDiv.appendChild(titleDiv);

      if (opts.placeText || opts.tagText) {
        const subDiv = document.createElement('div');
        subDiv.className = 'ph-parish-sub';

        if (opts.placeText) {
          const placeSpan = document.createElement('span');
          placeSpan.className = 'ph-parish-place';
          const pinIcon = document.createElement('i');
          pinIcon.className = opts.placeIconClass || 'fa-solid fa-location-dot';
          placeSpan.appendChild(pinIcon);
          placeSpan.appendChild(document.createTextNode(' ' + opts.placeText));
          subDiv.appendChild(placeSpan);
        }

        if (opts.tagText) {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'ph-parish-deanery-tag';
          tagSpan.textContent = opts.tagText;
          subDiv.appendChild(tagSpan);
        }

        infoDiv.appendChild(subDiv);
      }

      row.appendChild(infoDiv);

      const actDiv = document.createElement('div');
      actDiv.className = 'ph-parish-action';
      const selSpan = document.createElement('span');
      selSpan.className = 'ph-parish-select-btn';
      selSpan.textContent = 'Select ';
      const chevIcon = document.createElement('i');
      chevIcon.className = 'fa-solid fa-chevron-right';
      selSpan.appendChild(chevIcon);
      actDiv.appendChild(selSpan);
      row.appendChild(actDiv);

      row.addEventListener('click', opts.onPick);
      return row;
    }

    function setFilterPills(pills, activeValue, onSelect) {
      if (!pills || pills.length <= 1) {
        filterWrapEl.hidden = true;
        filterBarEl.innerHTML = '';
        return;
      }
      filterWrapEl.hidden = false;
      filterBarEl.innerHTML = '';
      filterBarEl.scrollLeft = 0;

      pills.forEach((pillDef) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ph-filter-pill' + (pillDef.value === activeValue ? ' active' : '');
        btn.dataset.filterValue = pillDef.value;
        btn.textContent = pillDef.label;
        if (pillDef.title) btn.title = pillDef.title;
        btn.addEventListener('click', () => {
          filterBarEl.querySelectorAll('.ph-filter-pill').forEach((p) => {
            p.classList.toggle('active', p.dataset.filterValue === pillDef.value);
          });
          onSelect(pillDef.value);
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          setTimeout(updateScrollButtons, 200);
        });
        filterBarEl.appendChild(btn);
      });

      setTimeout(updateScrollButtons, 60);
    }

    function renderOptionList(items, mapRowOptions, emptyMessage, countLabelBuilder) {
      let showAll = false;

      function draw() {
        listEl.scrollTop = 0;
        const total = items.length;
        const limit = showAll ? total : Math.min(total, MAX_VISIBLE_ROWS);
        if (countLabelBuilder) {
          countTextEl.textContent = countLabelBuilder(total, limit);
        } else {
          countTextEl.textContent = 'Showing ' + limit + (limit === 1 ? ' result' : ' results');
        }

        if (!total) {
          listEl.innerHTML = '';
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'ph-picker-empty';
          emptyDiv.textContent = emptyMessage || 'No results found.';
          listEl.appendChild(emptyDiv);
          return;
        }

        const frag = document.createDocumentFragment();
        for (let i = 0; i < limit; i++) {
          frag.appendChild(createOptionRow(mapRowOptions(items[i])));
        }

        if (total > limit) {
          const moreBtn = document.createElement('button');
          moreBtn.type = 'button';
          moreBtn.className = 'btn secondary ph-picker-show-more';
          moreBtn.textContent = 'Show all ' + total + ' matching entries (' + (total - limit) + ' more)';
          moreBtn.addEventListener('click', () => {
            showAll = true;
            draw();
          });
          frag.appendChild(moreBtn);
        }

        listEl.innerHTML = '';
        listEl.appendChild(frag);
      }

      draw();
    }

    function setFooterSwitch(iconClass, text, onClick) {
      footerLeftEl.innerHTML = '';
      if (!text) return;
      const switchBtn = document.createElement('button');
      switchBtn.type = 'button';
      switchBtn.className = 'ph-picker-switch-mode';
      const ic = document.createElement('i');
      ic.className = iconClass;
      switchBtn.appendChild(ic);
      switchBtn.appendChild(document.createTextNode(' ' + text));
      switchBtn.addEventListener('click', onClick);
      footerLeftEl.appendChild(switchBtn);
    }

    function renderCivicList(items, onPick) {
      searchEl.value = '';
      function applyCivicSearch() {
        const q = searchEl.value.trim().toLowerCase();
        const filtered = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
        renderOptionList(
          filtered,
          (item) => ({
            extraClass: 'ph-picker-civic-item',
            iconClass: 'fa-solid fa-location-dot',
            title: item.name,
            onPick: () => onPick(item),
          }),
          'No results found.',
          (total, shown) => (total > shown
            ? 'Showing ' + shown + ' of ' + total + ' results'
            : 'Showing ' + total + (total === 1 ? ' result' : ' results'))
        );
      }
      applyCivicSearch();
      searchEl.oninput = applyCivicSearch;
      searchEl.focus();
    }

    function showProvinces(allowSwitchToParish) {
      stage = 'province';
      const token = ++renderToken;
      titleIcon.className = 'fa-solid fa-map-location-dot';
      titleSpan.textContent = isParishField
        ? ('Outside EDNP (' + sacramentContext + '): Select Province')
        : 'Select Province';
      subtitleEl.textContent = 'Step 1 of 3: Choose province from national registry';
      backBtn.hidden = true;
      filterWrapEl.hidden = true;
      searchEl.placeholder = 'Search province...';
      listEl.innerHTML = SK;

      if (allowSwitchToParish || isParishField) {
        setFooterSwitch('fa-solid fa-church', 'Back to Diocesan Parishes', showParishes);
      } else {
        setFooterSwitch('', '', null);
      }

      loadProvinces().then((provinces) => {
        if (token !== renderToken) return;
        renderCivicList(provinces, pickProvince);
      });
    }

    function pickProvince(province) {
      selectedProvince = province;
      setInputValue(targetInput, province.name);
      showCities();
    }

    function showCities() {
      stage = 'city';
      const token = ++renderToken;
      titleIcon.className = 'fa-solid fa-city';
      titleSpan.textContent = isParishField
        ? ('Outside EDNP (' + sacramentContext + '): Select City / Municipality')
        : 'Select City or Municipality';
      subtitleEl.textContent = 'Step 2 of 3: ' + selectedProvince.name;
      backBtn.hidden = false;
      filterWrapEl.hidden = true;
      searchEl.placeholder = 'Search city or municipality in ' + selectedProvince.name + '...';
      listEl.innerHTML = SK;
      loadCities().then((cities) => {
        if (token !== renderToken) return;
        const filtered = cities.filter((c) => c.province_code === selectedProvince.code);
        renderCivicList(filtered, pickCity);
      });
    }

    function pickCity(city) {
      selectedCity = city;
      setInputValue(targetInput, [city.name, selectedProvince.name].join(', '));
      showBarangays();
    }

    function showBarangays() {
      stage = 'barangay';
      const token = ++renderToken;
      titleIcon.className = 'fa-solid fa-location-dot';
      titleSpan.textContent = isParishField
        ? ('Outside EDNP (' + sacramentContext + '): Select Barangay')
        : 'Select Barangay';
      subtitleEl.textContent = 'Step 3 of 3: ' + selectedCity.name + ', ' + selectedProvince.name;
      backBtn.hidden = false;
      filterWrapEl.hidden = true;
      searchEl.placeholder = 'Search barangay in ' + selectedCity.name + '...';
      listEl.innerHTML = SK;
      loadBarangays(selectedCity.code).then((names) => {
        if (token !== renderToken) return;
        renderCivicList(names.map((n) => ({ name: n })), pickBarangay);
      });
    }

    function pickBarangay(barangay) {
      setInputValue(targetInput, [barangay.name, selectedCity.name, selectedProvince.name].join(', '));
      closeAllPickers(targetInput);
    }

    function showParishes() {
      stage = 'parish';
      const token = ++renderToken;
      titleIcon.className = 'fa-solid fa-church';
      if (isDeploymentStation) {
        titleSpan.textContent = 'Select Parish, Mission, or Station';
      } else {
        titleSpan.textContent = sacramentContext === 'Parish / Church'
          ? 'Select Parish or Church'
          : 'Select Parish of ' + sacramentContext;
      }
      subtitleEl.textContent = 'Episcopal Diocese of Northern Philippines: 118 Parishes across 8 Deaneries';
      backBtn.hidden = true;
      listEl.innerHTML = SK;
      searchEl.value = '';
      searchEl.placeholder = 'Search by parish name, municipality, or deanery...';

      if (isDeploymentStation) {
        setFooterSwitch('', '', null);
      } else {
        setFooterSwitch('fa-solid fa-map-location-dot', 'Outside Diocese? Use Civic Address', () => showProvinces(true));
      }

      loadParishes().then((parishes) => {
        if (token !== renderToken) return;
        const deaneriesMap = new Map();
        parishes.forEach((p) => {
          if (p.deaneryName) {
            deaneriesMap.set(p.deaneryName, (deaneriesMap.get(p.deaneryName) || 0) + 1);
          }
        });
        const pills = [{ value: 'all', label: 'All (' + parishes.length + ')', title: 'All Deaneries' }];
        deaneriesMap.forEach((count, name) => {
          pills.push({
            value: name,
            label: name.replace(/\s+Deanery$/i, '') + ' (' + count + ')',
            title: name,
          });
        });

        function applyParishFilter() {
          const q = searchEl.value.trim().toLowerCase();
          let filtered = parishes;
          if (selectedDeanery !== 'all') {
            filtered = filtered.filter((p) => p.deaneryName === selectedDeanery);
          }
          if (q) {
            filtered = filtered.filter((p) =>
              p.name.toLowerCase().includes(q) ||
              p.place.toLowerCase().includes(q) ||
              p.deaneryName.toLowerCase().includes(q)
            );
          }
          renderOptionList(
            filtered,
            (p) => ({
              iconClass: 'fa-solid fa-church',
              title: p.name,
              placeText: p.place,
              tagText: p.deaneryName,
              onPick: () => {
                if (isDeploymentStation) {
                  setInputValue(targetInput, p.name);
                  const formEl = targetInput.closest('form');
                  const placeInput = formEl ? formEl.querySelector('[name="place_name"]') : null;
                  if (placeInput && (placeInput.value.trim() === '' || placeInput.value === placeInput.dataset.autoPlace)) {
                    if (p.place) {
                      placeInput.dataset.autoPlace = p.place;
                      setInputValue(placeInput, p.place);
                    } else if (placeInput.value === placeInput.dataset.autoPlace) {
                      delete placeInput.dataset.autoPlace;
                      setInputValue(placeInput, '');
                    }
                  }
                } else {
                  setInputValue(targetInput, p.label);
                }
                closeAllPickers(targetInput);
              },
            }),
            isDeploymentStation
              ? 'No parishes match your search. Close to type a custom mission or station name directly.'
              : 'No parishes match your search. You can enter a custom location or switch to civic address.',
            (total, shown) => {
              if (total > shown) return 'Showing ' + shown + ' of ' + total + ' parishes';
              if (selectedDeanery === 'all' && !q) return 'Showing all ' + parishes.length + ' parishes in EDNP';
              if (q) return 'Found ' + total + ' matching ' + (total === 1 ? 'parish' : 'parishes');
              return 'Showing ' + total + ' parishes in ' + selectedDeanery;
            }
          );
        }

        setFilterPills(pills, selectedDeanery, (val) => {
          selectedDeanery = val;
          applyParishFilter();
        });
        applyParishFilter();
        searchEl.oninput = applyParishFilter;
        searchEl.focus();
      });
    }

    function showChedInstitutions() {
      stage = 'ched';
      const token = ++renderToken;
      titleIcon.className = 'fa-solid fa-building-columns';
      titleSpan.textContent = 'Select College, University, or Seminary';
      subtitleEl.textContent = 'CHED Institutions Masterlist: loading catalog...';
      backBtn.hidden = true;
      listEl.innerHTML = SK;
      searchEl.value = '';
      searchEl.placeholder = 'Search by institution name, region, or type...';

      setFooterSwitch('fa-solid fa-school', 'Switch to Elementary Schools (Ilocos Sur)', showElementarySchools);

      loadChedInstitutions().then((data) => {
        if (token !== renderToken) return;
        if (!data || !Array.isArray(data.items) || !Array.isArray(data.regions)) {
          subtitleEl.textContent = 'CHED Institutions Masterlist';
          countTextEl.textContent = '';
          listEl.innerHTML = '<div class="ph-picker-empty">Unable to load CHED institutions right now. You can type the institution name directly in the field.</div>';
          return;
        }

        const regions = data.regions;
        const items = data.items;
        subtitleEl.textContent = 'CHED Institutions Masterlist: ' + items.length.toLocaleString() + ' institutions across ' + regions.length + ' regions';

        const countsByRegion = new Array(regions.length).fill(0);
        items.forEach((it) => {
          if (countsByRegion[it.r] !== undefined) countsByRegion[it.r] += 1;
        });

        const pills = [{ value: 'all', label: 'All (' + items.length + ')', title: 'All Regions' }];
        regions.forEach((regName, idx) => {
          pills.push({
            value: String(idx),
            label: regName + ' (' + countsByRegion[idx] + ')',
            title: regName,
          });
        });

        function applyChedFilter() {
          const q = searchEl.value.trim().toLowerCase();
          let filtered = items;
          if (selectedChedRegion !== 'all') {
            const regIdx = Number(selectedChedRegion);
            filtered = filtered.filter((it) => it.r === regIdx);
          }
          if (q) {
            filtered = filtered.filter((it) =>
              it.n.toLowerCase().includes(q) ||
              (regions[it.r] || '').toLowerCase().includes(q) ||
              (it.t || '').toLowerCase().includes(q)
            );
          }
          renderOptionList(
            filtered,
            (it) => ({
              iconClass: 'fa-solid fa-building-columns',
              title: it.n,
              placeText: regions[it.r] || '',
              placeIconClass: 'fa-solid fa-map-location-dot',
              tagText: it.t || '',
              onPick: () => {
                setInputValue(targetInput, it.n);
                closeAllPickers(targetInput);
              },
            }),
            'No CHED institutions match your search. You can still type the school or seminary name directly in the input.',
            (total, shown) => {
              if (total > shown) {
                return 'Showing first ' + shown + ' of ' + total.toLocaleString() + ' institutions (type to search or select a region)';
              }
              if (q) return 'Found ' + total + ' matching ' + (total === 1 ? 'institution' : 'institutions');
              if (selectedChedRegion === 'all') return 'Showing all ' + total + ' institutions';
              return 'Showing ' + total + ' institutions in ' + (regions[Number(selectedChedRegion)] || '');
            }
          );
        }

        setFilterPills(pills, selectedChedRegion, (val) => {
          selectedChedRegion = val;
          applyChedFilter();
        });
        applyChedFilter();
        searchEl.oninput = applyChedFilter;
        searchEl.focus();
      });
    }

    function showElementarySchools() {
      stage = 'elementary';
      const token = ++renderToken;
      titleIcon.className = 'fa-solid fa-school';
      titleSpan.textContent = 'Select Elementary School';
      subtitleEl.textContent = 'DepEd Elementary Masterlist: loading catalog...';
      backBtn.hidden = true;
      listEl.innerHTML = SK;
      searchEl.value = '';
      searchEl.placeholder = 'Search by school name, municipality, or School ID...';

      setFooterSwitch('fa-solid fa-building-columns', 'Back to CHED Colleges & Seminaries', showChedInstitutions);

      loadElementarySchools().then((data) => {
        if (token !== renderToken) return;
        if (!data || !Array.isArray(data.items) || !Array.isArray(data.municipalities)) {
          subtitleEl.textContent = 'DepEd Elementary Masterlist';
          countTextEl.textContent = '';
          listEl.innerHTML = '<div class="ph-picker-empty">Unable to load elementary schools right now. You can type the school name directly in the field.</div>';
          return;
        }

        const municipalities = data.municipalities;
        const items = data.items;
        const province = data.province || 'Ilocos Sur';
        const region = data.region || 'Region I';
        subtitleEl.textContent = 'DepEd Elementary Masterlist: ' + items.length.toLocaleString() + ' schools in ' + region + ', ' + province + ' (' + municipalities.length + ' municipalities)';

        const countsByMuni = new Array(municipalities.length).fill(0);
        items.forEach((it) => {
          if (countsByMuni[it.m] !== undefined) countsByMuni[it.m] += 1;
        });

        const pills = [{ value: 'all', label: 'All (' + items.length + ')', title: 'All Municipalities' }];
        municipalities.forEach((muniName, idx) => {
          pills.push({
            value: String(idx),
            label: muniName + ' (' + countsByMuni[idx] + ')',
            title: muniName,
          });
        });

        function applyElementaryFilter() {
          const q = searchEl.value.trim().toLowerCase();
          let filtered = items;
          if (selectedElementaryMuni !== 'all') {
            const muniIdx = Number(selectedElementaryMuni);
            filtered = filtered.filter((it) => it.m === muniIdx);
          }
          if (q) {
            filtered = filtered.filter((it) =>
              it.n.toLowerCase().includes(q) ||
              (municipalities[it.m] || '').toLowerCase().includes(q) ||
              (it.id || '').toLowerCase().includes(q) ||
              (it.s || '').toLowerCase().includes(q)
            );
          }
          renderOptionList(
            filtered,
            (it) => {
              const muniName = municipalities[it.m] || '';
              const placeFull = [muniName, province].filter(Boolean).join(', ');
              const tagParts = [];
              if (it.s) tagParts.push(it.s);
              if (it.id) tagParts.push('ID ' + it.id);
              return {
                iconClass: 'fa-solid fa-school',
                title: it.n,
                placeText: placeFull,
                tagText: tagParts.join(' | '),
                onPick: () => {
                  setInputValue(targetInput, it.n);
                  const rowEl = targetInput.closest('tr');
                  const placeInput = rowEl ? rowEl.querySelector('[name="edu_place"]') : null;
                  if (placeInput && placeFull && (placeInput.value.trim() === '' || placeInput.value === placeInput.dataset.autoPlace)) {
                    placeInput.dataset.autoPlace = placeFull;
                    setInputValue(placeInput, placeFull);
                  }
                  closeAllPickers(targetInput);
                },
              };
            },
            'No elementary schools match your search. You can type the school name directly in the input.',
            (total, shown) => {
              if (total > shown) {
                return 'Showing first ' + shown + ' of ' + total + ' schools (type to search or select a municipality)';
              }
              if (q) return 'Found ' + total + ' matching ' + (total === 1 ? 'school' : 'schools');
              if (selectedElementaryMuni === 'all') return 'Showing all ' + total + ' schools in ' + province;
              return 'Showing ' + total + ' schools in ' + (municipalities[Number(selectedElementaryMuni)] || '');
            }
          );
        }

        setFilterPills(pills, selectedElementaryMuni, (val) => {
          selectedElementaryMuni = val;
          applyElementaryFilter();
        });
        applyElementaryFilter();
        searchEl.oninput = applyElementaryFilter;
        searchEl.focus();
      });
    }

    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        const firstOpt = listEl.querySelector('.ph-picker-item');
        if (firstOpt) {
          e.preventDefault();
          firstOpt.focus();
        }
      }
    });

    listEl.addEventListener('keydown', (e) => {
      const options = Array.from(listEl.querySelectorAll('.ph-picker-item'));
      if (!options.length) return;
      const currentIdx = options.indexOf(document.activeElement);
      if (currentIdx === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIdx + 1 < options.length) {
          options[currentIdx + 1].focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIdx > 0) {
          options[currentIdx - 1].focus();
        } else {
          searchEl.focus();
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        options[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        options[options.length - 1].focus();
      }
    });

    backBtn.addEventListener('click', () => {
      if (stage === 'city') showProvinces(isParishField);
      else if (stage === 'barangay') showCities();
    });

    closeBtn.addEventListener('click', () => closeAllPickers(true));
    cancelBtn.addEventListener('click', () => closeAllPickers(true));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllPickers(true);
      }
    });

    if (stage === 'ched') {
      showChedInstitutions();
    } else if (stage === 'elementary') {
      showElementarySchools();
    } else if (isParishField) {
      showParishes();
    } else {
      showProvinces(false);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.querySelector('.ph-picker-overlay')) {
      closeAllPickers(true);
    }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ph-picker-target], .ph-picker-btn');
    if (btn) {
      e.preventDefault();
      const targetInput = resolveTargetInput(btn);
      if (targetInput) openPicker(btn, targetInput);
    }
  });
})();
