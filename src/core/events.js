export function dispatchEvent(el, name, detail = {}) {
  if (!el) return;
  el.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}