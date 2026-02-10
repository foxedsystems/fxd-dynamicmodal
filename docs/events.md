# Events

[API](./api.md) | [Options](./options.md) | [Events](./events.md) | [Demo](./index.html)

fxd-dynamicmodal dispatches CustomEvents on the modal root element. Listen with `addEventListener`.

## Events

- `fxd:init`: After modal creation.
- `fxd:open`: After modal is shown.
- `fxd:close`: After modal is hidden.
- `fxd:loadstart`: Before content loads.
- `fxd:loadend`: After content loads.
- `fxd:error`: On errors during load or render.
- `fxd:destroy`: After teardown.

## Example

```js
const modal = new FxdDynamicModal();
modal.modalEl.addEventListener('fxd:open', () => {
  console.log('opened');
});
```