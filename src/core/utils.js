export function toSearchParams(params = {}) {
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

export function buildUrl(url, params = {}) {
  const search = toSearchParams(params);
  const query = search.toString();
  if (!query) return url;
  return url + (url.includes('?') ? '&' : '?') + query;
}

export function setContent(container, content, sanitizer = null) {
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

export function isDomElement(value) {
  if (typeof Element === 'undefined') return false;
  return value instanceof Element || value instanceof HTMLElement;
}

export function initTooltips(root, options = {}, bootstrapOverride = null) {
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

export function resolveSizeClass(size) {
  if (!size || size === 'md') return '';
  const normalized = String(size).trim();
  if (!normalized) return '';
  if (normalized.startsWith('modal-')) return normalized;
  if (normalized.startsWith('fullscreen')) return `modal-${normalized}`;
  if (['sm', 'lg', 'xl', 'xxl'].includes(normalized)) return `modal-${normalized}`;
  return normalized;
}

export function addClassTokens(el, classString) {
  if (!el || !classString) return;
  classString.split(' ').forEach((token) => {
    if (token) el.classList.add(token);
  });
}
