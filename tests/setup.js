class ModalStub {
  constructor(el, options = {}) {
    this.el = el;
    this.options = options;
  }

  show() {
    this.el.dispatchEvent(new Event('shown.bs.modal'));
  }

  hide() {
    this.el.dispatchEvent(new Event('hidden.bs.modal'));
  }

  dispose() {}
}

class TooltipStub {
  constructor() {}
}

globalThis.bootstrap = {
  Modal: ModalStub,
  Tooltip: TooltipStub,
};