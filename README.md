# fxd-dynamicmodal

A lightweight Bootstrap 5 modal manager for loading inline or remote content with a clean API and lifecycle events.

## Overview

fxd-dynamicmodal provides a small, modular wrapper around Bootstrap 5 modals. It can load content from DOM elements or fetch remote HTML, handle loading states, and emit useful events for integration and customization. It avoids jQuery and keeps the surface area minimal.

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
- Demo: [docs/index.html](docs/index.html)

## Demo

Open `docs/index.html` after building the dist files.