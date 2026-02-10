import { dispatchEvent } from './events.js';
import { buildUrl, initTooltips, isDomElement, setContent } from './utils.js';
import { loadContent } from './loader.js';
import { applyModalSettings, createModalTemplate } from './render.js';

export class FxdDynamicModal {
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
