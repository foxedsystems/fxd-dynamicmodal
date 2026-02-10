# fxd-select

[![CI](https://github.com/foxedsystems/fxd-select/actions/workflows/ci.yml/badge.svg)](https://github.com/foxedsystems/fxd-select/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/fxd-select.svg)](https://www.npmjs.com/package/fxd-select)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A lightweight, Bootstrap-friendly select enhancer with local search and keyboard navigation.

## Overview

fxd-select is a lightweight, Bootstrap‑friendly select enhancer that adds search, keyboard navigation, multi‑select pills, and clearable UI without requiring Bootstrap JS. It keeps the original `<select>` in sync, emits useful events, and allows custom rendering hooks for advanced UI needs.

## Basic Usage

```html
<select id="city">
  <option value="">Choose...</option>
  <option value="nyc">New York</option>
  <option value="la">Los Angeles</option>
</select>

<link rel="stylesheet" href="./dist/fxd-select.css" />
<script type="module">
  import { FxdSelect } from './dist/fxd-select.esm.js';
  new FxdSelect(document.querySelector('#city'));
</script>
```

## Features

- Local search with clearable input
- Optgroups and disabled options
- Keyboard navigation
- Multi‑select with pills and count styles
- Custom render hooks
- Optional async data loading

## Documentation

- API: [docs/api.md](docs/api.md)
- Options: [docs/options.md](docs/options.md)
- Events: [docs/events.md](docs/events.md)
- Auto-init: [docs/auto-init.md](docs/auto-init.md)

## Demo

https://foxedsystems.github.io/fxd-select/
