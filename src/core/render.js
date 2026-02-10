import { addClassTokens, resolveSizeClass, setContent } from './utils.js';

export function createModalTemplate(modalId, options) {
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

export function applyModalSettings(ui, settings) {
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