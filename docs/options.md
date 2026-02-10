# Options

[API](./api.md) | [Options](./options.md) | [Events](./events.md) | [Demo](./index.html)

## Defaults

```js
{
  modalId: 'fxdDynamicModal',
  title: 'Modal Title',
  size: 'md',
  showFooter: true,
  bgClose: true,
  showCloseBtn: true,
  extraModalClass: '',
  footerHtml: null,
  footerButtonText: 'OK',
  loadingHtml: '<div class="d-flex justify-content-center align-items-center">...spinner...</div>',
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
}
```

## Core

- `modalId`: ID for the modal root element.
- `title`: Default modal title.
- `size`: `sm`, `md`, `lg`, `xl`, `xxl`, or `fullscreen` variants.
- `showFooter`: Show or hide the footer container.
- `bgClose`: Allow background click and Escape to close.
- `showCloseBtn`: Show or hide the header close button.
- `extraModalClass`: Extra class tokens for the modal dialog.
- `footerHtml`: Custom footer HTML or node content.
- `footerButtonText`: Default text for the OK button.

## Loading

- `loadingHtml`: HTML shown before content is loaded.
- `errorHtml`: HTML shown on errors.
- `fetch`: Custom fetch function for remote loading.

## Security

- `sanitize`: Function that receives HTML and returns sanitized HTML.
  - Inline HTML is injected via `innerHTML`; scripts will not execute.
  - When loading remote content, providing a sanitizer is recommended.

## Tooltips

- `initTooltips`: Enable or disable Bootstrap tooltip initialization.
- `tooltipOptions`: Options passed to `bootstrap.Tooltip`.

## Hooks

- `onInit`: Called after creation.
- `onOpen`: Called after open.
- `onClose`: Called after close.
- `onLoadStart`: Called before content loads.
- `onLoadEnd`: Called after content loads.
- `onError`: Called on fetch or render errors.
- `onDestroy`: Called after destroy.
