# fxd-dynamicmodal

[![CI](https://github.com/foxedsystems/fxd-dynamicmodal/actions/workflows/ci.yml/badge.svg)](https://github.com/foxedsystems/fxd-dynamicmodal/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A lightweight Bootstrap 5 modal manager for loading inline or remote content with a clean API and lifecycle events.

## Overview

fxd-dynamicmodal provides a small, modular wrapper around Bootstrap 5 modals. It can load content from DOM elements or fetch remote HTML, handle loading states, and emit useful events for integration and customization.

## Basic Usage

```html
<button id="open">Open modal</button>

<script type="module">
  import { FxdDynamicModal } from './dist/fxd-dynamicmodal.esm.js';

  const modal = new FxdDynamicModal({
    title: 'Welcome',
    size: 'lg',
  });

  document.querySelector('#open').addEventListener('click', () => {
    modal.open('#inline-content');
  });
</script>
```

## Confirmation Dialog

```js
const modal = new FxdDynamicModal();

modal.showConfirm({
  title: 'Delete item?',
  message: 'This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmVariant: 'btn-danger',
  size: 'sm',
  bgClose: false,
  confirmAction: {
    method: 'POST',
    url: '/items/delete',
    data: { id: 1 },
    async: true,
    onBeforeSend: ({ action }) => console.log(action.url),
    onSuccess: (data) => console.log('deleted', data),
    onError: (error) => console.error(error),
    onComplete: () => console.log('request done'),
  },
  onCancel: () => console.log('cancelled'),
});
```

Set `confirmAction.async: false` to submit a hidden form instead of `fetch`, like a normal browser form post.

## Features

- Bootstrap 5 modal wrapper with clean API
- Inline or remote content loading
- Abortable fetch to avoid stale responses
- Lifecycle events for open, close, load, and error
- Optional tooltip initialization for loaded content

## Documentation

- API: [docs/api.md](docs/api.md)
- Options: [docs/options.md](docs/options.md)
- Events: [docs/events.md](docs/events.md)

## Demo

Demo: [https://foxedsystems.github.io/fxd-dynamicmodal/](https://foxedsystems.github.io/fxd-dynamicmodal/)
