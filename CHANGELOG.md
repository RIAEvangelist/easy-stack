# Changelog

All notable changes to easy-stack are documented here.

## Unreleased

- Correct the documentation hero image so responsive sizing preserves its intrinsic aspect ratio.
- Add a dedicated, dependency-free browser Playground backed by the real stack module and vanilla-test controller contracts.
- Expand the curated GitHub Pages documentation from nine focused pages to ten.

## 2.0.0 — 2026-08-16

- Add native ESM, CommonJS, modern classic-browser, and ES5 entry points with explicit package exports.
- Preserve synchronous cooperative LIFO execution, callback `this` binding, and the established `require('easy-stack')` path.
- Make `stack`, `contents()`, `size`, and read-only `running` consistent across every shipped build.
- Validate callback batches and replacement arrays before mutation.
- Return the stack from `add()` for chaining and return the live empty array from `clear()`.
- Recover the runner after a callback throws while rethrowing the original error.
- Repair the legacy browser build's CommonJS resolution and inherited-argument enqueue defects.
- Add shared Node and Chrome contract tests powered by `vanilla-test@2.1.1` with 100% coverage gates.
- Prove the dependency-free runtime on Node 12.22.12 and the test toolchain on Node 22.12 and 24.
- Add packed-package verification, a curated nine-page GitHub Pages site, and CI-gated deployment.

## 1.0.1 — 2020-11-11

- Update MIT license metadata and package version.
