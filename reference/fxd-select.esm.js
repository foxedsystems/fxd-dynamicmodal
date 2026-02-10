function parseSelect(selectEl) {
  const options = [];

  selectEl.querySelectorAll('option').forEach((opt) => {
    options.push({
      value: opt.value,
      label: opt.textContent,
      selected: opt.selected,
      disabled: opt.disabled,
      group: opt.parentElement?.tagName === 'OPTGROUP' ? opt.parentElement.label : null,
      element: opt,
    });
  });

  return options;
}

function normalizeOptions(data, selectEl) {
  if (!Array.isArray(data)) return [];

  const selectedValues = selectEl?.multiple
    ? new Set(Array.from(selectEl.selectedOptions).map((opt) => opt.value))
    : new Set([selectEl?.value]);

  return data.map((item) => {
    const value = item.value ?? '';
    const label = item.label ?? String(value);
    const selected = typeof item.selected === 'boolean'
      ? item.selected
      : selectedValues.has(value);

    return {
      value,
      label,
      selected,
      disabled: Boolean(item.disabled),
      group: item.group ?? null,
      element: null,
    };
  });
}

function buildModel(selectEl, options = {}) {
  if (Array.isArray(options.data)) {
    return normalizeOptions(options.data, selectEl);
  }
  return parseSelect(selectEl);
}

function syncSelectWithModel(selectEl, model) {
  const currentGroups = new Map();
  selectEl.innerHTML = '';

  model.forEach((opt) => {
    let parent = selectEl;
    if (opt.group) {
      if (!currentGroups.has(opt.group)) {
        const groupEl = document.createElement('optgroup');
        groupEl.label = opt.group;
        currentGroups.set(opt.group, groupEl);
        selectEl.appendChild(groupEl);
      }
      parent = currentGroups.get(opt.group);
    }

    const optionEl = document.createElement('option');
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    optionEl.disabled = Boolean(opt.disabled);
    optionEl.selected = Boolean(opt.selected);
    parent.appendChild(optionEl);
  });
}

let idCounter = 0;

function createId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function addClasses(el, classString) {
  if (!classString) return;
  classString.split(' ').forEach((c) => {
    if (c) el.classList.add(c);
  });
}

function dispatchEvent(el, name, detail = {}) {
  el.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}

let bootstrapChecked = false;
let bootstrapCheckScheduled = false;

function warnIfMissingBootstrap(major = 5) {
  if (bootstrapChecked || bootstrapCheckScheduled) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const runCheck = () => {
    bootstrapCheckScheduled = false;
    if (bootstrapChecked) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const bsBodyColor = rootStyles.getPropertyValue('--bs-body-color').trim();
    const bsBodyBg = rootStyles.getPropertyValue('--bs-body-bg').trim();
    const hasBootstrap = bsBodyColor.length > 0 || bsBodyBg.length > 0;

    if (!hasBootstrap) {
      // eslint-disable-next-line no-console
      console.warn(
        `fxd-select: Bootstrap ${major}.x styles not detected. ` +
        'The component will still work, but you should provide your own styles.'
      );
    }

    bootstrapChecked = true;
  };

  bootstrapCheckScheduled = true;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(runCheck), { once: true });
  } else {
    requestAnimationFrame(runCheck);
  }
}

function updateButtonLabel(ui, model, options, selectEl) {
  if (typeof options.renderValue === 'function') {
    const rendered = options.renderValue(model, selectEl);
    if (rendered instanceof HTMLElement) {
      ui.button.innerHTML = '';
      ui.button.appendChild(rendered);
      return;
    }
    ui.button.innerHTML = rendered ?? '';
    return;
  }

  const selected = model.filter((opt) => opt.selected);
  if (selected.length === 0) {
    ui.button.textContent = options.placeholder;
    return;
  }

  if (selectEl.multiple) {
    if (options.multiValueStyle === 'pills') {
      const container = document.createElement('span');
      container.className = options.pillContainerClass;

      const max = Math.max(0, options.maxDisplayItems);
      const visibleLimit = max + 1;
      const visibleLabels = selected.slice(0, Math.min(selected.length, visibleLimit));
      visibleLabels.forEach((opt) => {
        const pill = document.createElement('span');
        pill.className = options.pillClass;
        pill.textContent = opt.label;
        container.appendChild(pill);
      });

      const remaining = selected.length - visibleLabels.length;
      if (remaining > 0) {
        const count = document.createElement('span');
        count.className = options.selectionCountClass;
        const tpl = options.selectionCountTemplate;
        count.textContent = typeof tpl === 'function' ? tpl(remaining) : `${remaining} selected`;
        container.appendChild(count);
      }

      ui.button.innerHTML = '';
      ui.button.appendChild(container);
      return;
    }

    if (options.multiValueStyle === 'count') {
      const tpl = options.selectionCountTemplate;
      const text = typeof tpl === 'function' ? tpl(selected.length) : `${selected.length} selected`;
      ui.button.innerHTML = `<span class="${options.selectionCountClass}">${text}</span>`;
      return;
    }

    const max = Math.max(0, options.maxDisplayItems);
    const visibleLimit = max + 1;
    if (selected.length > visibleLimit) {
      const remaining = selected.length - visibleLimit;
      const tpl = options.selectionCountTemplate;
      ui.button.textContent = typeof tpl === 'function' ? tpl(remaining) : `${remaining} selected`;
      return;
    }
    ui.button.textContent = selected.map((opt) => opt.label).join(', ');
    return;
  }

  ui.button.textContent = selected[0].label;
}

function render(selectEl, model, options, existingUi = null) {
  const ui = existingUi || {};

  if (!existingUi) {
    ui.wrapper = document.createElement('div');
    ui.wrapper.className = 'dropdown fxd-select';
    addClasses(ui.wrapper, options.wrapperClass);

    ui.control = document.createElement('div');
    ui.control.className = 'd-flex align-items-center gap-1';

    ui.button = document.createElement('button');
    ui.button.type = 'button';
    ui.button.className = options.buttonClass;
    ui.button.setAttribute('role', 'combobox');
    ui.button.setAttribute('aria-haspopup', 'listbox');
    ui.button.setAttribute('aria-expanded', 'false');

    ui.control.appendChild(ui.button);

    if (options.clearable && !selectEl.multiple) {
      ui.clearButton = document.createElement('button');
      ui.clearButton.type = 'button';
      ui.clearButton.className = options.clearButtonClass;
      ui.clearButton.setAttribute('aria-label', options.clearButtonLabel);
      ui.clearButton.textContent = options.clearButtonText;
      ui.control.appendChild(ui.clearButton);
    }

    ui.menu = document.createElement('div');
    ui.menu.className = options.menuClass;

    ui.wrapper.appendChild(ui.control);
    ui.wrapper.appendChild(ui.menu);

    selectEl.parentNode.insertBefore(ui.wrapper, selectEl.nextSibling);
  } else {
    ui.menu.innerHTML = '';
  }

  ui.list = document.createElement('div');
  ui.list.id = ui.list.id || createId('fxd-list');
  ui.list.setAttribute('role', 'listbox');

  ui.button.setAttribute('aria-controls', ui.list.id);

  if (options.searchable) {
    const searchWrapper = document.createElement('div');
    const searchContainer = document.createElement('div');
    const searchInput = document.createElement('input');

    searchContainer.className = 'form-control form-control-sm w-auto d-flex flex-fill align-items-center p-1 m-1';
    searchInput.className = 'form-control p-0 border-0 rounded-0 shadow-none';
    searchInput.placeholder = options.filterPlaceholder;
    searchInput.setAttribute('aria-label', options.filterPlaceholder);

    searchContainer.appendChild(searchInput);

    if (options.searchClearable) {
      const searchClear = document.createElement('button');
      searchClear.type = 'button';
      searchClear.className = `fxd-search-clear ${options.searchClearButtonClass}`;
      searchClear.setAttribute('aria-label', options.searchClearAriaLabel);
      searchClear.textContent = options.searchClearIcon;
      searchContainer.appendChild(searchClear);
      ui.searchClearButton = searchClear;
    }

    if (ui.clearButton && ui.clearButton.parentNode && ui.clearButton.parentNode !== ui.control) {
      ui.clearButton.parentNode.removeChild(ui.clearButton);
      ui.control.appendChild(ui.clearButton);
    }

    searchWrapper.appendChild(searchContainer);
    ui.menu.appendChild(searchWrapper);

    ui.searchInput = searchInput;

    if (options.showDivider) {
      const divider = document.createElement('hr');
      divider.className = 'm-0';
      ui.menu.appendChild(divider);
    }

    ui.noResults = document.createElement('div');
    ui.noResults.className = 'no-result text-muted px-2 small d-none';
    ui.noResults.textContent = options.noResultsText;
    ui.menu.appendChild(ui.noResults);
  }

  if (options.maxHeight && options.maxHeight !== 'auto') {
    ui.list.style.overflowY = 'auto';
    ui.list.style.maxHeight = options.maxHeight;
  }

  ui.menu.appendChild(ui.list);

  ui.optionButtons = [];

  let currentGroup = null;
  model.forEach((opt) => {
    if (opt.group && opt.group !== currentGroup) {
      const header = document.createElement('div');
      header.className = 'dropdown-header';
      header.textContent = opt.group;
      header.dataset.group = opt.group;
      ui.list.appendChild(header);
      currentGroup = opt.group;
    }

    if (!opt.group) {
      currentGroup = null;
    }

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dropdown-item fxd-item';
    item.textContent = opt.label;
    item.dataset.value = opt.value;
    item.dataset.group = opt.group || '';
    item.disabled = opt.disabled;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
    item.id = createId('fxd-opt');

    if (options.renderOption) {
      const rendered = options.renderOption(opt, { selected: opt.selected, disabled: opt.disabled });
      if (rendered instanceof HTMLElement) {
        item.innerHTML = '';
        item.appendChild(rendered);
      } else if (typeof rendered === 'string') {
        item.innerHTML = rendered;
      }
    }

    if (opt.selected) {
      item.classList.add('is-selected');
    }

    if (options.showCheckmark && opt.value !== '') {
      const check = document.createElement('span');
      check.className = options.checkmarkClass;
      check.setAttribute('aria-hidden', 'true');
      check.textContent = options.checkmarkText;
      item.appendChild(check);
    }

    ui.optionButtons.push(item);
    ui.list.appendChild(item);
  });

  updateButtonLabel(ui, model, options, selectEl);

  const isDisabled = selectEl.disabled;
  ui.button.disabled = isDisabled;
  if (ui.clearButton) ui.clearButton.disabled = isDisabled;
  if (ui.searchInput) ui.searchInput.disabled = isDisabled;
  if (ui.searchClearButton) ui.searchClearButton.disabled = isDisabled;

  return ui;
}

function defaultFilter(query, option) {
  if (!query) return true;
  return option.label.toLowerCase().includes(query.toLowerCase());
}

function applyFilter(listEl, query, filterFn) {
  const groupState = new Map();
  let hidden = 0;
  let visible = 0;

  Array.from(listEl.children).forEach((item) => {
    if (item.classList.contains('dropdown-header')) {
      groupState.set(item.dataset.group || '', { header: item, visible: 0 });
      return;
    }

    if (!item.matches('button.dropdown-item')) return;

    const option = { label: item.textContent };
    const show = filterFn(query, option);
    item.classList.toggle('d-none', !show);
    if (!show) hidden += 1;
    if (show) visible += 1;

    const groupKey = item.dataset.group || '';
    if (groupState.has(groupKey) && show) {
      groupState.get(groupKey).visible += 1;
    }
  });

  groupState.forEach(({ header, visible }) => {
    header.classList.toggle('d-none', visible === 0);
  });

  return { hidden, visible };
}

function bindEvents(fxd) {
  const { selectEl, ui, options, state } = fxd;

  const getVisibleOptions = () => (
    Array.from(ui.list.querySelectorAll('button.dropdown-item')).filter(
      (item) => !item.classList.contains('d-none') && !item.disabled
    )
  );

  const setFocusedIndex = (index) => {
    const optionsList = getVisibleOptions();
    if (optionsList.length === 0) {
      state.focusedIndex = -1;
      ui.button.removeAttribute('aria-activedescendant');
      return;
    }

    const clamped = Math.max(0, Math.min(index, optionsList.length - 1));
    optionsList.forEach((item) => item.classList.remove('active'));

    const focused = optionsList[clamped];
    focused.classList.add('active');
    focused.scrollIntoView({ block: 'nearest' });

    state.focusedIndex = clamped;
    ui.button.setAttribute('aria-activedescendant', focused.id);
  };

  const focusSelectedOrFirst = () => {
    const optionsList = getVisibleOptions();
    if (optionsList.length === 0) return;

    const selectedIndex = optionsList.findIndex(
      (item) => item.getAttribute('aria-selected') === 'true'
    );

    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const onButtonClick = (e) => {
    if (selectEl.disabled) return;
    e.preventDefault();
    fxd.toggle();
    if (fxd.state.open) {
      focusSelectedOrFirst();
      ui.searchInput?.select();
    }
  };

  const onDocumentClick = (e) => {
    if (!ui.wrapper.contains(e.target)) {
      fxd.close();
    }
  };

  const onItemClick = (e) => {
    const item = e.target.closest('button.dropdown-item');
    if (!item) return;
    if (selectEl.disabled || item.disabled) return;
    if (selectEl.multiple) {
      e.preventDefault();
      e.stopPropagation();
      const option = Array.from(selectEl.options).find((opt) => opt.value === item.dataset.value);
      if (option) {
        option.selected = !option.selected;
      }
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      requestAnimationFrame(() => fxd.open());
    } else {
      selectEl.value = item.dataset.value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      fxd.close();
      ui.button.focus();
    }
  };

  const onItemHover = (e) => {
    const item = e.target.closest('button.dropdown-item');
    if (!item) return;

    const optionsList = getVisibleOptions();
    const idx = optionsList.indexOf(item);
    if (idx >= 0) setFocusedIndex(idx);
  };

  const onSelectChange = () => {
    fxd.refresh();
    dispatchEvent(selectEl, 'fxd:change');
  };

  let loadTimer = null;
  const runLoad = async (query) => {
    const data = await options.load?.(query);
    if (!Array.isArray(data)) return;
    const model = normalizeOptions(data, selectEl);
    syncSelectWithModel(selectEl, model);
    fxd.model = model;
    fxd.refresh();
    if (fxd.ui.searchInput) {
      fxd.ui.searchInput.value = query;
    }
  };

  const onFilterInput = (e) => {
    const query = e.target.value;
    fxd.state.query = query;

    if (options.load) {
      if (loadTimer) clearTimeout(loadTimer);
      loadTimer = setTimeout(() => runLoad(query), options.loadDebounce);
      return;
    }

    const filterFn = options.filter || defaultFilter;
    const result = applyFilter(ui.list, query, filterFn);

    if (ui.noResults) {
      ui.noResults.classList.toggle('d-none', result.visible > 0);
    }

    focusSelectedOrFirst();
  };

  const onKeyDown = (e) => {
    if (selectEl.disabled) return;
    const key = e.key;
    const openKeys = ['ArrowDown', 'ArrowUp', 'Enter', ' '];
    const navKeys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

    if (!fxd.state.open && openKeys.includes(key)) {
      e.preventDefault();
      fxd.open();
      focusSelectedOrFirst();
      ui.searchInput?.select();
      return;
    }

    if (!fxd.state.open) return;

    if (key === 'Escape') {
      e.preventDefault();
      fxd.close();
      ui.button.focus();
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      const optionsList = getVisibleOptions();
      const focused = optionsList[state.focusedIndex];
      if (focused) {
        focused.click();
      }
      return;
    }

    if (key === ' ') {
      e.preventDefault();
      const optionsList = getVisibleOptions();
      const focused = optionsList[state.focusedIndex];
      if (focused) {
        focused.click();
      }
      return;
    }

    if (navKeys.includes(key)) {
      e.preventDefault();
      const optionsList = getVisibleOptions();
      if (optionsList.length === 0) return;

      if (key === 'Home') {
        setFocusedIndex(0);
        return;
      }

      if (key === 'End') {
        setFocusedIndex(optionsList.length - 1);
        return;
      }

      const delta = key === 'ArrowDown' ? 1 : -1;
      setFocusedIndex(state.focusedIndex + delta);
    }
  };

  const onClearClick = (e) => {
    e.preventDefault();
    fxd.clear();
  };

  const onSearchClearClick = () => {
    if (!ui.searchInput) return;
    ui.searchInput.value = '';
    ui.searchInput.dispatchEvent(new Event('input'));
    ui.searchInput.select();
  };

  ui.button.addEventListener('click', onButtonClick);
  ui.list.addEventListener('click', onItemClick);
  ui.list.addEventListener('mousemove', onItemHover);
  document.addEventListener('click', onDocumentClick);
  selectEl.addEventListener('change', onSelectChange);
  ui.searchInput?.addEventListener('input', onFilterInput);
  ui.searchClearButton?.addEventListener('click', onSearchClearClick);
  ui.wrapper.addEventListener('keydown', onKeyDown);
  ui.clearButton?.addEventListener('click', onClearClick);

  return () => {
    ui.button.removeEventListener('click', onButtonClick);
    ui.list.removeEventListener('click', onItemClick);
    ui.list.removeEventListener('mousemove', onItemHover);
    document.removeEventListener('click', onDocumentClick);
    selectEl.removeEventListener('change', onSelectChange);
    ui.searchInput?.removeEventListener('input', onFilterInput);
    ui.searchClearButton?.removeEventListener('click', onSearchClearClick);
    ui.wrapper.removeEventListener('keydown', onKeyDown);
    ui.clearButton?.removeEventListener('click', onClearClick);
  };
}

class FxdSelect {
  constructor(selectEl, options = {}) {
    if (!selectEl || selectEl.tagName !== 'SELECT') {
      throw new Error('FxdSelect requires a <select> element');
    }

    this.selectEl = selectEl;
    this.options = { ...FxdSelect.defaults, ...options };
    this.state = {
      open: false,
      query: '',
      focusedIndex: -1,
    };

    this.model = buildModel(this.selectEl, this.options);
    this.ui = render(this.selectEl, this.model, this.options);
    this.cleanup = bindEvents(this);

    this.selectEl.classList.add('d-none');

    if (this.options.warnOnMissingBootstrap) {
      warnIfMissingBootstrap(this.options.bootstrapMajor);
    }

    dispatchEvent(this.selectEl, 'fxd:init');
  }

  _syncOpenState(open) {
    this.state.open = open;
    if (open) {
      this.ui.wrapper.classList.add('show');
      this.ui.menu.classList.add('show');
      this.ui.button.setAttribute('aria-expanded', 'true');
    } else {
      this.ui.wrapper.classList.remove('show');
      this.ui.menu.classList.remove('show');
      this.ui.button.setAttribute('aria-expanded', 'false');
      this.ui.button.removeAttribute('aria-activedescendant');
      this.state.focusedIndex = -1;
    }
  }

  open() {
    if (this.state.open) return;
    this._syncOpenState(true);
    dispatchEvent(this.selectEl, 'fxd:open');
  }

  close() {
    if (!this.state.open) return;
    this._syncOpenState(false);
    dispatchEvent(this.selectEl, 'fxd:close');
  }

  toggle() {
    if (this.state.open) this.close();
    else this.open();
  }

  refresh() {
    const wasOpen = this.state.open;
    this.cleanup?.();
    this.model = buildModel(this.selectEl, this.options);
    this.ui = render(this.selectEl, this.model, this.options, this.ui);
    this.cleanup = bindEvents(this);
    this._syncOpenState(wasOpen);
    if (this.ui.searchInput && this.state.query) {
      this.ui.searchInput.value = this.state.query;
      this.ui.searchInput.dispatchEvent(new Event('input'));
    }
    dispatchEvent(this.selectEl, 'fxd:refresh');
  }

  destroy() {
    this.cleanup?.();
    this.ui.wrapper.remove();
    this.selectEl.classList.remove('d-none');
    dispatchEvent(this.selectEl, 'fxd:destroy');
  }

  getValue() {
    return this.selectEl.value;
  }

  setValue(value) {
    this.selectEl.value = value;
    this.selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  clear() {
    if (this.selectEl.multiple) {
      Array.from(this.selectEl.options).forEach((opt) => {
        opt.selected = false;
      });
    } else {
      this.selectEl.value = '';
    }
    this.selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

FxdSelect.defaults = {
  searchable: true,
  clearable: false,
  maxHeight: '12em',
  placeholder: 'Select...',
  noResultsText: 'No entries found',
  buttonClass: 'form-select text-start',
  wrapperClass: '',
  menuClass: 'dropdown-menu p-0',
  filterPlaceholder: 'Search',
  showDivider: true,
  renderOption: null,
  renderValue: null,
  data: null,
  load: null,
  loadDebounce: 250,
  maxDisplayItems: 3,
  multiValueStyle: 'pills',
  selectionCountClass: 'badge bg-secondary',
  selectionCountTemplate: (count) => `${count} selected`,
  pillClass: 'badge text-bg-light border',
  pillContainerClass: 'fxd-pills',
  clearButtonClass: 'btn btn-outline-secondary btn-sm',
  clearButtonLabel: 'Clear selection',
  clearButtonText: '×',
  searchClearable: true,
  searchClearButtonClass: 'btn btn-link btn-sm text-decoration-none',
  searchClearIcon: '×',
  searchClearAriaLabel: 'Clear search',
  warnOnMissingBootstrap: true,
  bootstrapMajor: 5,
  showCheckmark: true,
  checkmarkText: '✓',
  checkmarkClass: 'fxd-checkmark',
  filter: null,
};

export { FxdSelect };
//# sourceMappingURL=fxd-select.esm.js.map
