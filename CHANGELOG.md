# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.2.0] - 2026-02-11
- Add `showConfirm(options)` for declarative confirmation dialogs.
- Add `confirmAction` support for async requests with AJAX lifecycle hooks:
  `onBeforeSend`, `onSuccess`, `onError`, and `onComplete`.
- Add non-async confirm action mode (`async: false`) to submit hidden forms
  using standard browser post behavior.
- Add tests for confirm cancel flow, async confirm flow, and form submit flow.
- Update demo and docs for confirmation dialog usage.
