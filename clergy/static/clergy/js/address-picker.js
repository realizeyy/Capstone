/* Spacious Philippine Civic Address and Diocesan Parish Picker Dialog
 *
 * Markup:
 *   Civic address:
 *     <input id="myField">
 *     <button type="button" class="ph-picker-btn" data-ph-picker-target="myField">...</button>
 *
 *   Parish of Ordination:
 *     <input id="diaconatePlaceInput">
 *     <button type="button" class="ph-picker-btn" data-ph-picker-target="diaconatePlaceInput" data-picker-mode="parish">...</button>
 */
(function () {
  const SK = '<div class="ph-picker-loading" aria-label="Loading"><span class="sk-line w90"></span><span class="sk-line w70"></span><span class="sk-line w90"></span><span class="sk-line w50"></span></div>';
  const DATA_BASE = '/static/clergy/data/';

  let provincesPromise = null;
  let citiesPromise = null;
  const barangayCache = {};
  let parishesPromise = null;

  function loadProvinces() {
    if (!provincesPromise) {
      provincesPromise = fetch(DATA_BASE + 'provinces.json').then((r) => r.json());
    }
    return provincesPromise;
  }

  function loadCities() {
    if (!citiesPromise) {
      citiesPromise = fetch(DATA_BASE + 'cities.json').then((r) => r.json());
    }
    return citiesPromise;
  }

  function loadBarangays(cityCode) {
    if (!barangayCache[cityCode]) {
      barangayCache[cityCode] = fetch(DATA_BASE + 'barangays/' + cityCode + '.json')
        .then((r) => r.json())
        .catch(() => []);
    }
    return barangayCache[cityCode];
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
        } catch (e) {
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

  function closeAllPickers() {
    document.querySelectorAll('.ph-picker-overlay').forEach((p) => {
      if (p._cleanup) p._cleanup();
      p.remove();
    });
  }

  function openPicker(triggerBtn, targetInput) {
    closeAllPickers();

    const overlay = document.createElement('div');
    overlay.className = 'ph-picker-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="ph-picker-modal">' +
        '<div class="ph-picker-head">' +
          '<div class="ph-picker-head-left">' +
            '<button type="button" class="ph-picker-back" hidden aria-label="Go back"><i class="fa-solid fa-arrow-left"></i></button>' +
            '<div class="ph-picker-title-group">' +
              '<h3 class="ph-picker-title"><i class="fa-solid fa-church" style="color:#2563eb;"></i> <span>Select Location</span></h3>' +
              '<p class="ph-picker-subtitle"></p>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="ph-picker-close" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="ph-picker-filter-wrap" hidden>' +
          '<button type="button" class="ph-filter-scroll-btn left" aria-label="Scroll deaneries left"><i class="fa-solid fa-chevron-left"></i></button>' +
          '<div class="ph-picker-filter-bar"></div>' +
          '<button type="button" class="ph-filter-scroll-btn right" aria-label="Scroll deaneries right"><i class="fa-solid fa-chevron-right"></i></button>' +
        '</div>' +
        '<div class="ph-picker-search-wrap">' +
          '<i class="fa-solid fa-magnifying-glass ph-picker-search-icon"></i>' +
          '<input type="text" class="ph-picker-search" placeholder="Search..." aria-label="Search items">' +
        '</div>' +
        '<div class="ph-picker-count-bar">' +
          '<span class="ph-picker-count-text"></span>' +
        '</div>' +
        '<div class="ph-picker-list" role="listbox">' + SK + '</div>' +
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
    const btnMode = triggerBtn.getAttribute('data-picker-mode');
    const isParishField = btnMode === 'parish' ||
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
      inputId.includes('marriage');

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

    let stage = isParishField ? 'parish' : 'province';
    let selectedProvince = null;
    let selectedCity = null;
    let allParishes = [];
    let selectedDeanery = 'all';

    function setFieldValue(value) {
      targetInput.value = value;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function renderCivicList(items, onPick) {
      searchEl.value = '';
      function drawCivic(rows) {
        countTextEl.textContent = 'Showing ' + rows.length + (rows.length === 1 ? ' result' : ' results');
        if (!rows.length) {
          listEl.innerHTML = '<div class="ph-picker-empty">No results found.</div>';
          return;
        }
        listEl.innerHTML = '';
        rows.forEach((item) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'ph-picker-item ph-picker-civic-item';
          row.setAttribute('role', 'option');

          const iconBox = document.createElement('div');
          iconBox.className = 'ph-parish-icon-box';
          iconBox.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
          row.appendChild(iconBox);

          const infoDiv = document.createElement('div');
          infoDiv.className = 'ph-parish-info';
          const nameSpan = document.createElement('div');
          nameSpan.className = 'ph-parish-title';
          nameSpan.textContent = item.name;
          infoDiv.appendChild(nameSpan);
          row.appendChild(infoDiv);

          const actDiv = document.createElement('div');
          actDiv.className = 'ph-parish-action';
          actDiv.innerHTML = '<span class="ph-parish-select-btn">Select <i class="fa-solid fa-chevron-right"></i></span>';
          row.appendChild(actDiv);

          row.addEventListener('click', () => onPick(item));
          listEl.appendChild(row);
        });
      }
      drawCivic(items);
      searchEl.oninput = () => {
        const q = searchEl.value.trim().toLowerCase();
        const filtered = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
        drawCivic(filtered);
      };
      searchEl.focus();
    }

    function showProvinces(allowSwitchToParish) {
      stage = 'province';
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
        footerLeftEl.innerHTML =
          '<button type="button" class="ph-picker-switch-mode">' +
            '<i class="fa-solid fa-church"></i> Back to Diocesan Parishes' +
          '</button>';
        const switchBtn = footerLeftEl.querySelector('.ph-picker-switch-mode');
        switchBtn.addEventListener('click', () => showParishes());
      } else {
        footerLeftEl.innerHTML = '';
      }

      loadProvinces().then((provinces) => renderCivicList(provinces, pickProvince));
    }

    function pickProvince(province) {
      selectedProvince = province;
      setFieldValue(province.name);
      showCities();
    }

    function showCities() {
      stage = 'city';
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
        const filtered = cities.filter((c) => c.province_code === selectedProvince.code);
        renderCivicList(filtered, pickCity);
      });
    }

    function pickCity(city) {
      selectedCity = city;
      setFieldValue([city.name, selectedProvince.name].join(', '));
      showBarangays();
    }

    function showBarangays() {
      stage = 'barangay';
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
        renderCivicList(names.map((n) => ({ name: n })), pickBarangay);
      });
    }

    function pickBarangay(barangay) {
      setFieldValue([barangay.name, selectedCity.name, selectedProvince.name].join(', '));
      closeAllPickers();
    }

    function showParishes() {
      stage = 'parish';
      titleIcon.className = 'fa-solid fa-church';
      titleSpan.textContent = sacramentContext === 'Parish / Church'
        ? 'Select Parish or Church'
        : 'Select Parish of ' + sacramentContext;
      subtitleEl.textContent = 'Episcopal Diocese of Northern Philippines: 118 Parishes across 8 Deaneries';
      backBtn.hidden = true;
      listEl.innerHTML = SK;
      searchEl.value = '';
      searchEl.placeholder = 'Search by parish name, municipality, or deanery...';

      footerLeftEl.innerHTML =
        '<button type="button" class="ph-picker-switch-mode">' +
          '<i class="fa-solid fa-map-location-dot"></i> Outside Diocese? Use Civic Address' +
        '</button>';
      const switchBtn = footerLeftEl.querySelector('.ph-picker-switch-mode');
      switchBtn.addEventListener('click', () => showProvinces(true));

      loadParishes().then((parishes) => {
        allParishes = parishes;
        buildDeaneryFilters(allParishes);
        renderParishList();
        searchEl.focus();
      });
    }

    function buildDeaneryFilters(parishes) {
      const deaneriesSet = new Map();
      parishes.forEach((p) => {
        if (p.deaneryName && !deaneriesSet.has(p.deaneryName)) {
          deaneriesSet.set(p.deaneryName, p.deaneryId);
        }
      });
      if (deaneriesSet.size <= 1) {
        filterWrapEl.hidden = true;
        return;
      }
      filterWrapEl.hidden = false;
      filterBarEl.innerHTML = '';

      const allCount = parishes.length;
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'ph-filter-pill' + (selectedDeanery === 'all' ? ' active' : '');
      allBtn.textContent = 'All (' + allCount + ')';
      allBtn.addEventListener('click', () => {
        selectedDeanery = 'all';
        updateFilterPillsActive();
        renderParishList();
        allBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        setTimeout(updateScrollButtons, 200);
      });
      filterBarEl.appendChild(allBtn);

      deaneriesSet.forEach((deaneryId, deaneryName) => {
        const count = parishes.filter((p) => p.deaneryName === deaneryName).length;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ph-filter-pill' + (selectedDeanery === deaneryName ? ' active' : '');
        btn.textContent = deaneryName.replace(/\s+Deanery$/i, '') + ' (' + count + ')';
        btn.title = deaneryName;
        btn.addEventListener('click', () => {
          selectedDeanery = deaneryName;
          updateFilterPillsActive();
          renderParishList();
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          setTimeout(updateScrollButtons, 200);
        });
        filterBarEl.appendChild(btn);
      });

      setTimeout(updateScrollButtons, 60);
    }

    function updateFilterPillsActive() {
      filterBarEl.querySelectorAll('.ph-filter-pill').forEach((pill) => {
        const text = pill.textContent.trim().toLowerCase();
        const deaneryLower = selectedDeanery.toLowerCase();
        const isMatch = (selectedDeanery === 'all' && text.startsWith('all')) ||
          (selectedDeanery !== 'all' && (deaneryLower === text || deaneryLower.startsWith(text.split(' ')[0])));
        pill.classList.toggle('active', isMatch);
      });
    }

    function renderParishList() {
      const q = searchEl.value.trim().toLowerCase();
      let filtered = allParishes;

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

      const totalCount = allParishes.length;
      if (selectedDeanery === 'all' && !q) {
        countTextEl.textContent = 'Showing all ' + totalCount + ' parishes in EDNP';
      } else if (q) {
        countTextEl.textContent = 'Found ' + filtered.length + ' matching ' + (filtered.length === 1 ? 'parish' : 'parishes');
      } else {
        countTextEl.textContent = 'Showing ' + filtered.length + ' parishes in ' + selectedDeanery;
      }

      if (!filtered.length) {
        listEl.innerHTML = '<div class="ph-picker-empty">No parishes match your search. You can enter a custom location or switch to civic address.</div>';
        return;
      }

      listEl.innerHTML = '';
      filtered.forEach((p) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'ph-picker-item ph-picker-parish-item';
        row.setAttribute('role', 'option');

        const iconBox = document.createElement('div');
        iconBox.className = 'ph-parish-icon-box';
        iconBox.innerHTML = '<i class="fa-solid fa-church"></i>';
        row.appendChild(iconBox);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'ph-parish-info';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'ph-parish-title';
        titleDiv.textContent = p.name;
        infoDiv.appendChild(titleDiv);

        const subDiv = document.createElement('div');
        subDiv.className = 'ph-parish-sub';

        if (p.place) {
          const placeSpan = document.createElement('span');
          placeSpan.className = 'ph-parish-place';
          placeSpan.innerHTML = '<i class="fa-solid fa-location-dot"></i> ' + escapeText(p.place);
          subDiv.appendChild(placeSpan);
        }

        if (p.deaneryName) {
          const deanerySpan = document.createElement('span');
          deanerySpan.className = 'ph-parish-deanery-tag';
          deanerySpan.textContent = p.deaneryName;
          subDiv.appendChild(deanerySpan);
        }

        infoDiv.appendChild(subDiv);
        row.appendChild(infoDiv);

        const actDiv = document.createElement('div');
        actDiv.className = 'ph-parish-action';
        actDiv.innerHTML = '<span class="ph-parish-select-btn">Select <i class="fa-solid fa-chevron-right"></i></span>';
        row.appendChild(actDiv);

        row.addEventListener('click', () => {
          setFieldValue(p.label);
          closeAllPickers();
        });

        listEl.appendChild(row);
      });
    }

    function escapeText(str) {
      const div = document.createElement('div');
      div.textContent = str || '';
      return div.innerHTML;
    }

    searchEl.oninput = () => {
      if (stage === 'parish') {
        renderParishList();
      }
    };

    backBtn.addEventListener('click', () => {
      if (stage === 'city') showProvinces(isParishField);
      else if (stage === 'barangay') showCities();
    });

    closeBtn.addEventListener('click', closeAllPickers);
    cancelBtn.addEventListener('click', closeAllPickers);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllPickers();
      }
    });

    if (isParishField) {
      showParishes();
    } else {
      showProvinces(false);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPickers();
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-ph-picker-target]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetInput = document.getElementById(btn.getAttribute('data-ph-picker-target'));
        if (targetInput) openPicker(btn, targetInput);
      });
    });
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ph-picker-target]');
    if (btn) {
      e.preventDefault();
      const targetInput = document.getElementById(btn.getAttribute('data-ph-picker-target'));
      if (targetInput) openPicker(btn, targetInput);
    }
  });
})();
