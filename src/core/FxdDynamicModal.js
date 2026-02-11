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
    const selectorSource = typeof source === 'string' ? source.trim() : '';
    const isSelectorSource = Boolean(selectorSource && selectorSource.startsWith('#'));
    const isElementSource = isDomElement(source);
    const isRemoteSource = typeof source === 'string' && !isSelectorSource;

    applyModalSettings(
      {
        dialog: this.dialogEl,
        title: this.titleEl,
        footer: this.footerEl,
        closeBtn: this.closeBtnEl,
      },
      settings
    );

    if (isRemoteSource && settings.loadingHtml) {
      setContent(this.bodyEl, settings.loadingHtml, settings.sanitize);
    }

    this._ensureInstance(settings);
    if (!source) {
      this.modalInstance.show();
      return null;
    }

    if (isSelectorSource) {
      const el = document.querySelector(selectorSource);
      if (!el) {
        this._handleError(new Error('Element not found'), source);
        this.modalInstance.show();
        return null;
      }
      this._startLoading(source);
      setContent(this.bodyEl, el.innerHTML, settings.sanitize);
      this._endLoading(source);
      this.modalInstance.show();
      this.modalInstance.handleUpdate?.();
      return null;
    }

    if (isElementSource) {
      this._startLoading(source);
      setContent(this.bodyEl, source, settings.sanitize);
      this._endLoading(source);
      this.modalInstance.show();
      this.modalInstance.handleUpdate?.();
      return null;
    }

    this.modalInstance.show();

    if (isRemoteSource) {
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
        this.modalInstance.handleUpdate?.();
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

  showConfirm(confirmOptions = {}) {
    const options = {
      ...FxdDynamicModal.confirmDefaults,
      ...confirmOptions,
    };
    const settings = {
      ...this.options,
      ...options,
      showFooter: true,
      footerHtml: null,
    };

    this._clearConfirmState();

    applyModalSettings(
      {
        dialog: this.dialogEl,
        title: this.titleEl,
        footer: this.footerEl,
        closeBtn: this.closeBtnEl,
      },
      settings
    );

    setContent(this.bodyEl, options.message || '', settings.sanitize);

    this.footerEl.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = `btn ${options.cancelVariant}`;
    cancelBtn.textContent = options.cancelText;
    cancelBtn.setAttribute('data-bs-dismiss', 'modal');
    cancelBtn.dataset.fxdRole = 'confirm-cancel';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = `btn ${options.confirmVariant}`;
    confirmBtn.textContent = options.confirmText;
    confirmBtn.dataset.fxdRole = 'confirm-submit';

    this.footerEl.appendChild(cancelBtn);
    this.footerEl.appendChild(confirmBtn);

    let completed = false;
    const onHidden = () => {
      if (completed) return;
      completed = true;
      this._clearConfirmState();
      options.onCancel?.({ modal: this });
    };

    const onConfirmClick = async (event) => {
      event.preventDefault();
      if (completed) return;

      const originalText = confirmBtn.textContent;
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      confirmBtn.textContent = options.confirmLoadingText;

      try {
        if (options.confirmAction) {
          await this._executeConfirmAction(options.confirmAction);
        }
        options.onConfirm?.({ modal: this });
        completed = true;
        this._clearConfirmState();
        this.close();
      } catch (error) {
        options.onError?.(error, { modal: this });
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        confirmBtn.textContent = originalText;
      }
    };

    confirmBtn.addEventListener('click', onConfirmClick);
    this.modalEl.addEventListener('hidden.bs.modal', onHidden);

    this._confirmCleanup = () => {
      confirmBtn.removeEventListener('click', onConfirmClick);
      this.modalEl.removeEventListener('hidden.bs.modal', onHidden);
      this._confirmCleanup = null;
    };

    this._ensureInstance(settings);
    this.modalInstance.show();

    return this;
  }

  _clearConfirmState() {
    this._confirmCleanup?.();
  }

  async _executeConfirmAction(confirmAction) {
    const action = {
      method: 'POST',
      data: {},
      async: true,
      headers: {},
      ...confirmAction,
    };
    const method = String(action.method || 'POST').toUpperCase();
    const context = { modal: this, action };

    if (!action.url) {
      throw new Error('confirmAction.url is required.');
    }

    const beforeResult = action.onBeforeSend?.(context);
    if (beforeResult === false) {
      throw new Error('confirmAction cancelled by onBeforeSend.');
    }

    if (!action.async) {
      this._submitConfirmForm(action.url, method, action.data);
      return null;
    }

    const fetchFn = action.fetch || this.options.fetch || fetch;
    const isGet = method === 'GET';
    const headers = { ...action.headers };
    let url = action.url;
    let body;

    if (isGet) {
      url = buildUrl(url, action.data || {});
    } else {
      const search = new URLSearchParams();
      Object.entries(action.data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        search.append(key, String(value));
      });
      body = search.toString();
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
      }
    }

    let response;
    let responseData = null;

    try {
      response = await fetchFn(url, {
        method,
        headers,
        body,
      });

      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }

      if (!response.ok) {
        throw new Error(`confirmAction request failed with status ${response.status}.`);
      }

      action.onSuccess?.(responseData, response, context);
      return responseData;
    } catch (error) {
      action.onError?.(error, response, context);
      throw error;
    } finally {
      action.onComplete?.(context);
    }
  }

  _submitConfirmForm(url, method, data = {}) {
    const form = document.createElement('form');
    form.method = method;
    form.action = url;
    form.style.display = 'none';

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item === undefined || item === null) return;
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(item);
          form.appendChild(input);
        });
        return;
      }

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();
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

FxdDynamicModal.confirmDefaults = {
  title: 'Confirm Action',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmVariant: 'btn-danger',
  cancelVariant: 'btn-outline-secondary',
  confirmLoadingText: 'Working...',
  size: 'sm',
  bgClose: false,
  showCloseBtn: true,
  onConfirm: null,
  onCancel: null,
  onError: null,
  confirmAction: null,
};
