import { describe, it, expect } from 'vitest';
import { FxdDynamicModal } from '../src/index.js';

describe('FxdDynamicModal', () => {
  it('creates a modal and opens with inline element content', async () => {
    const inline = document.createElement('div');
    inline.id = 'inline-source';
    inline.innerHTML = '<p>Hello modal</p>';
    document.body.appendChild(inline);

    const modal = new FxdDynamicModal({ title: 'Test Modal' });
    await modal.open('#inline-source');

    const content = modal.modalEl.querySelector('.modal-body');
    expect(content.textContent).toContain('Hello modal');
  });

  it('toggles open state via Bootstrap events', async () => {
    const modal = new FxdDynamicModal();
    await modal.open();
    expect(modal.getState().open).toBe(true);
    modal.close();
    expect(modal.getState().open).toBe(false);
  });

  it('runs cancel handler when confirm dialog is dismissed', () => {
    let cancelled = false;
    const modal = new FxdDynamicModal();

    modal.showConfirm({
      title: 'Delete item?',
      message: 'This action cannot be undone.',
      onCancel: () => {
        cancelled = true;
      },
    });

    modal.close();
    expect(cancelled).toBe(true);
  });

  it('runs async confirm action and success hooks', async () => {
    const calls = [];
    const fetchStub = async () => ({
      ok: true,
      status: 200,
      text: async () => '{"status":"ok"}',
    });

    const modal = new FxdDynamicModal();
    modal.showConfirm({
      title: 'Delete item?',
      message: 'This action cannot be undone.',
      onConfirm: () => calls.push('onConfirm'),
      confirmAction: {
        url: '/delete',
        method: 'POST',
        async: true,
        data: { id: 1 },
        fetch: fetchStub,
        onBeforeSend: () => calls.push('onBeforeSend'),
        onSuccess: () => calls.push('onSuccess'),
        onComplete: () => calls.push('onComplete'),
      },
    });

    const confirmBtn = modal.footerEl.querySelector('[data-fxd-role="confirm-submit"]');
    confirmBtn.click();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(calls.join('|')).toBe('onBeforeSend|onSuccess|onComplete|onConfirm');
  });

  it('submits form when confirm action async is false', async () => {
    const originalSubmit = HTMLFormElement.prototype.submit;
    let submittedForm;

    HTMLFormElement.prototype.submit = function submit() {
      submittedForm = this;
    };

    try {
      const modal = new FxdDynamicModal();
      modal.showConfirm({
        title: 'Delete item?',
        message: 'This action cannot be undone.',
        confirmAction: {
          async: false,
          url: '/delete',
          method: 'POST',
          data: { id: 1, param: 99 },
        },
      });

      const confirmBtn = modal.footerEl.querySelector('[data-fxd-role="confirm-submit"]');
      confirmBtn.click();
      await Promise.resolve();

      expect(submittedForm).toBeTruthy();
      expect(submittedForm.method.toLowerCase()).toBe('post');
      expect(submittedForm.action).toContain('/delete');
      expect(Array.from(submittedForm.querySelectorAll('input')).length).toBe(2);
    } finally {
      HTMLFormElement.prototype.submit = originalSubmit;
    }
  });
});
