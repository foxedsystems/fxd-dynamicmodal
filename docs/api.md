# API

[API](./api.md) | [Options](./options.md) | [Events](./events.md) | [Demo](./index.html)

## Constructor

```js
new FxdDynamicModal(options)
```

- `options`: See `docs/options.md`.

## Methods

### `open(source, params, overrideOptions)`
Opens the modal and loads content.

- `source`: DOM element, selector string (like `#id`), or URL string.
- `params`: Query params for remote URL loading.
- `overrideOptions`: Per-call overrides for options like `title`, `size`, or `bgClose`.

### `close()`
Closes the modal.

### `showConfirm(confirmOptions)`
Opens a confirmation dialog with built-in confirm/cancel handling.

- `confirmOptions.message`: Body content for the confirmation prompt.
- `confirmOptions.onConfirm`: Called after a successful confirm.
- `confirmOptions.onCancel`: Called when dismissed/cancelled.
- `confirmOptions.confirmAction`: Optional request config run on confirm.
  - `async: true`: runs a `fetch` request and supports AJAX hooks.
  - `async: false`: submits a hidden form (full-page submit behavior).

### `setTitle(title)`
Updates the modal title.

### `setContent(content)`
Updates the modal body content. Accepts a DOM node or HTML string.

### `setFooter(content)`
Updates the modal footer content. Accepts a DOM node or HTML string.

### `destroy()`
Disposes the Bootstrap instance, removes the modal from the DOM, and cleans up events.

### `getState()`
Returns the internal state object (open, loading, requestId).

## Examples

```js
const modal = new FxdDynamicModal({ title: 'Hello' });
modal.open('#inline');
```

```js
modal.open('/partial/view', { id: 42 }, { size: 'xl' });
```

```js
modal.showConfirm({
  title: 'Delete item?',
  message: 'This action cannot be undone.',
  confirmText: 'Delete',
  confirmVariant: 'btn-danger',
  confirmAction: {
    method: 'POST',
    url: '/items/delete',
    data: { id: 1 },
    async: true,
    onSuccess: () => console.log('deleted'),
  },
  onCancel: () => console.log('cancelled'),
});
```
