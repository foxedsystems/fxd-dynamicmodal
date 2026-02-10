(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FxdDynamicModal = {}));
})(this, (function (exports) { 'use strict';

  function dispatchEvent(el, name, detail = {}) {
    if (!el) return;
    el.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
  }

  function toSearchParams(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item === undefined || item === null) return;
          search.append(key, String(item));
        });
        return;
      }
      search.set(key, String(value));
    });
    return search;
  }

  function buildUrl(url, params = {}) {
    const search = toSearchParams(params);
    const query = search.toString();
    if (!query) return url;
    return url + (url.includes('?') ? '&' : '?') + query;
  }

  function setContent(container, content, sanitizer = null) {
    if (!container) return;
    container.innerHTML = '';

    if (typeof Node !== 'undefined' && content instanceof Node) {
      const node = content.cloneNode(true);
      container.appendChild(node);
      return;
    }

    const html = content == null ? '' : String(content);
    container.innerHTML = typeof sanitizer === 'function' ? sanitizer(html) : html;
  }

  function isDomElement(value) {
    if (typeof Element === 'undefined') return false;
    return value instanceof Element || value instanceof HTMLElement;
  }

  function initTooltips(root, options = {}, bootstrapOverride = null) {
    if (!root) return;
    if (typeof window === 'undefined') return;
    const bs = bootstrapOverride || window.bootstrap;
    if (!bs || !bs.Tooltip) return;

    const triggers = Array.from(root.querySelectorAll('[data-bs-toggle="tooltip"]'));
    return triggers.map((el) => {
      // eslint-disable-next-line no-new
      return new bs.Tooltip(el, options);
    });
  }

  function resolveSizeClass(size) {
    if (!size || size === 'md') return '';
    const normalized = String(size).trim();
    if (!normalized) return '';
    if (normalized.startsWith('modal-')) return normalized;
    if (normalized.startsWith('fullscreen')) return `modal-${normalized}`;
    if (['sm', 'lg', 'xl', 'xxl'].includes(normalized)) return `modal-${normalized}`;
    return normalized;
  }

  function addClassTokens(el, classString) {
    if (!el || !classString) return;
    classString.split(' ').forEach((token) => {
      if (token) el.classList.add(token);
    });
  }

  async function loadContent(url, fetchFn, signal) {
    const response = await fetchFn(url, { signal });
    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    return response.text();
  }

  function createModalTemplate(modalId, options) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = modalId;
    modal.tabIndex = -1;
    modal.setAttribute('aria-hidden', 'true');

    const titleId = `${modalId}-title`;
    const contentId = `${modalId}-content`;

    modal.setAttribute('aria-labelledby', titleId);
    modal.setAttribute('aria-describedby', contentId);

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h5');
    title.className = 'modal-title';
    title.id = titleId;
    title.dataset.fxdRole = 'title';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'modal');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.dataset.fxdRole = 'close';

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';
    body.id = contentId;
    body.dataset.fxdRole = 'content';

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.dataset.fxdRole = 'footer';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'btn btn-secondary';
    okBtn.textContent = options.footerButtonText || 'OK';
    okBtn.setAttribute('data-bs-dismiss', 'modal');
    footer.appendChild(okBtn);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    dialog.appendChild(content);
    modal.appendChild(dialog);

    setContent(body, options.loadingHtml || '');

    return {
      modal,
      dialog,
      title,
      body,
      footer,
      closeBtn,
    };
  }

  function applyModalSettings(ui, settings) {
    const sizeClass = resolveSizeClass(settings.size);
    ui.dialog.className = 'modal-dialog modal-dialog-centered';
    if (sizeClass) ui.dialog.classList.add(sizeClass);
    addClassTokens(ui.dialog, settings.extraModalClass);

    ui.title.textContent = settings.title ?? '';

    ui.footer.style.display = settings.showFooter ? 'flex' : 'none';
    ui.closeBtn.style.display = settings.showCloseBtn ? 'inline-block' : 'none';

    if (settings.footerHtml) {
      setContent(ui.footer, settings.footerHtml, settings.sanitize);
    }
  }

  class FxdDynamicModal {
    constructor(options = {}) {
      this.options = { ...FxdDynamicModal.defaults, ...options };
      this.state = {
        open: false,
        loading: false,
        requestId: 0,
      };

      this._ensureBootstrap();
      this._mount();
      this._bindBootstrapEvents();

      dispatchEvent(this.modalEl, 'fxd:init', { modal: this });
      this.options.onInit?.(this);
    }

    _ensureBootstrap() {
      const bs = this.options.bootstrap || (typeof window !== 'undefined' ? window.bootstrap : null);
      if (!bs || !bs.Modal) {
        throw new Error('FxdDynamicModal requires Bootstrap 5 Modal to be available.');
      }
      this.bootstrap = bs;
    }

    _mount() {
      const existing = document.getElementById(this.options.modalId);

      if (existing) {
        this.modalEl = existing;
        this.dialogEl = existing.querySelector('.modal-dialog');
        this.titleEl = existing.querySelector('[data-fxd-role="title"]') || existing.querySelector('.modal-title');
        this.bodyEl = existing.querySelector('[data-fxd-role="content"]') || existing.querySelector('.modal-body');
        this.footerEl = existing.querySelector('[data-fxd-role="footer"]') || existing.querySelector('.modal-footer');
        this.closeBtnEl = existing.querySelector('[data-fxd-role="close"]') || existing.querySelector('.btn-close');

        if (!this.dialogEl || !this.titleEl || !this.bodyEl || !this.footerEl || !this.closeBtnEl) {
          throw new Error('FxdDynamicModal found an existing modal but required elements are missing.');
        }
      } else {
        const ui = createModalTemplate(this.options.modalId, this.options);
        document.body.appendChild(ui.modal);
        this.modalEl = ui.modal;
        this.dialogEl = ui.dialog;
        this.titleEl = ui.title;
        this.bodyEl = ui.body;
        this.footerEl = ui.footer;
        this.closeBtnEl = ui.closeBtn;
      }
    }

    _bindBootstrapEvents() {
      this._onShown = () => {
        this.state.open = true;
        dispatchEvent(this.modalEl, 'fxd:open', { modal: this });
        this.options.onOpen?.(this);
      };

      this._onHidden = () => {
        this.state.open = false;
        dispatchEvent(this.modalEl, 'fxd:close', { modal: this });
        this.options.onClose?.(this);
      };

      this.modalEl.addEventListener('shown.bs.modal', this._onShown);
      this.modalEl.addEventListener('hidden.bs.modal', this._onHidden);
    }

    _ensureInstance(settings) {
      const backdrop = settings.bgClose ? true : 'static';
      const keyboard = Boolean(settings.bgClose);

      if (!this.modalInstance || this.bsOptions?.backdrop !== backdrop || this.bsOptions?.keyboard !== keyboard) {
        this.modalInstance?.dispose();
        this.modalInstance = new this.bootstrap.Modal(this.modalEl, { backdrop, keyboard });
        this.bsOptions = { backdrop, keyboard };
      }
    }

    _startLoading(source) {
      this.state.loading = true;
      dispatchEvent(this.modalEl, 'fxd:loadstart', { modal: this, source });
      this.options.onLoadStart?.(this, source);
    }

    _endLoading(source) {
      this.state.loading = false;
      dispatchEvent(this.modalEl, 'fxd:loadend', { modal: this, source });
      this.options.onLoadEnd?.(this, source);
    }

    _handleError(error, source) {
      this.state.loading = false;
      dispatchEvent(this.modalEl, 'fxd:error', { modal: this, source, error });
      this.options.onError?.(error, this, source);
      if (this.options.errorHtml) {
        setContent(this.bodyEl, this.options.errorHtml, this.options.sanitize);
      }
    }

    setTitle(title) {
      this.titleEl.textContent = title ?? '';
    }

    setContent(content) {
      setContent(this.bodyEl, content, this.options.sanitize);
    }

    setFooter(content) {
      if (!this.footerEl) return;
      setContent(this.footerEl, content, this.options.sanitize);
    }

    async open(source = null, params = {}, overrideOptions = {}) {
      const settings = { ...this.options, ...overrideOptions };

      applyModalSettings(
        {
          dialog: this.dialogEl,
          title: this.titleEl,
          footer: this.footerEl,
          closeBtn: this.closeBtnEl,
        },
        settings
      );

      if (settings.loadingHtml) {
        setContent(this.bodyEl, settings.loadingHtml, settings.sanitize);
      }

      this._ensureInstance(settings);
      this.modalInstance.show();

      if (!source) return null;

      if (typeof source === 'string' && source.trim().startsWith('#')) {
        const el = document.querySelector(source.trim());
        if (!el) {
          this._handleError(new Error('Element not found'), source);
          return null;
        }
        this._startLoading(source);
        setContent(this.bodyEl, el.innerHTML, settings.sanitize);
        this._endLoading(source);
        return null;
      }

      if (isDomElement(source)) {
        this._startLoading(source);
        setContent(this.bodyEl, source, settings.sanitize);
        this._endLoading(source);
        return null;
      }

      if (typeof source === 'string') {
        const url = buildUrl(source, params);
        const requestId = ++this.state.requestId;
        if (this.abortController) this.abortController.abort();
        this.abortController = new AbortController();

        this._startLoading(url);

        try {
          const fetchFn = settings.fetch || fetch;
          const html = await loadContent(url, fetchFn, this.abortController.signal);
          if (requestId !== this.state.requestId) return null;

          setContent(this.bodyEl, html, settings.sanitize);
          if (settings.initTooltips) {
            this._disposeTooltips();
            this._tooltips = initTooltips(this.bodyEl, settings.tooltipOptions || {}, this.bootstrap) || [];
          }
          this._endLoading(url);
        } catch (error) {
          if (error?.name === 'AbortError') return null;
          this._handleError(error, url);
        }
        return null;
      }

      this._handleError(new Error('Unsupported source type'), source);
      return null;
    }

    close() {
      this.modalInstance?.hide();
    }

    _disposeTooltips() {
      if (!this._tooltips || this._tooltips.length === 0) return;
      this._tooltips.forEach((tooltip) => tooltip?.dispose?.());
      this._tooltips = [];
    }

    destroy() {
      this.abortController?.abort();
      this._disposeTooltips();
      this.modalInstance?.dispose();
      this.modalEl.removeEventListener('shown.bs.modal', this._onShown);
      this.modalEl.removeEventListener('hidden.bs.modal', this._onHidden);
      dispatchEvent(this.modalEl, 'fxd:destroy', { modal: this });
      this.options.onDestroy?.(this);
      this.modalEl.remove();
    }

    getState() {
      return { ...this.state };
    }
  }

  FxdDynamicModal.defaults = {
    modalId: 'fxdDynamicModal',
    title: 'Modal Title',
    size: 'md',
    showFooter: true,
    bgClose: true,
    showCloseBtn: true,
    extraModalClass: '',
    footerHtml: null,
    footerButtonText: 'OK',
    loadingHtml: '<div class="d-flex justify-content-center align-items-center">' +
      '<div class="spinner-border" role="status">' +
      '<span class="visually-hidden">Loading...</span>' +
      '</div></div>',
    errorHtml: '<p class="text-danger mb-0">Error loading content</p>',
    sanitize: null,
    fetch: null,
    initTooltips: true,
    tooltipOptions: { html: true },
    bootstrap: null,
    onInit: null,
    onOpen: null,
    onClose: null,
    onLoadStart: null,
    onLoadEnd: null,
    onError: null,
    onDestroy: null,
  };

  exports.FxdDynamicModal = FxdDynamicModal;

}));
//# sourceMappingURL=fxd-dynamicmodal.umd.js.map
