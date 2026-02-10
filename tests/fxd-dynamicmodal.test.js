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
});