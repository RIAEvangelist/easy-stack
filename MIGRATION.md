# Migrating to easy-stack 2.1

Version 2 keeps the package's central behavior: callbacks execute synchronously in last-in, first-out order, each callback receives the stack as `this`, and a callback calls `this.next()` when the following item should run.

## Version 2.1 runtime boundary

easy-stack 2.1 requires Node.js 22.13 or newer. That exact floor lets native ESM `import` and CommonJS `require()` load the same synchronous `stack.js` file without Node's default experimental warning. `require('easy-stack')` still returns the constructor directly. See Node's [documented `require(esm)` version history](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).

Applications that must stay on an older Node release should remain on easy-stack 2.0.0. The separate `stack.cjs` implementation is no longer shipped in 2.1 because the two loaders now share one source of truth.

The native module and modern classic-browser build now use private class fields. Current browsers can use `stack.js` or `stack-vanilla.js`; older browser targets can continue using the unchanged ES5-syntax `es5.js` build.

## Runtime and imports

The shipped runtime and repository toolchain both run on Node.js 22.13 and newer. `vanilla-test` remains development-only and is not a runtime dependency.

CommonJS remains available:

```javascript
const Stack = require('easy-stack');
```

Native ESM is now a first-class entry point:

```javascript
import Stack, { Stack as NamedStack } from 'easy-stack';
```

The compatibility paths `easy-stack/stack.js` and `easy-stack/es5.js` remain exported. For browsers, `stack-vanilla.js` provides the modern classic-script global and `es5.js` provides the legacy-syntax global.

## Contents and state

`stack.stack` is the live callback array. `stack.contents()` remains the package-root-compatible method:

```javascript
const pending = stack.stack;
stack.stack = [firstTask, secondTask];

stack.contents();              // current live array
stack.contents([firstTask]);   // validate and replace the live array
```

The old browser file exposed `contents` as an array property while the package root exposed it as a method. Version 2 resolves that mismatch in favor of the established package-root method across all builds. Browser code that used `stack.contents` as an array should move to `stack.stack`.

`running` is now a read-only view of the runner's internal state. `autoRun` and `stop` remain public truthy/falsy control fields for compatibility.

## Validation and errors

`add()` and replacement arrays now accept functions only. Invalid batches fail before any item is added. Direct mutation remains possible through the live `stack` array, but `next()` rejects a nonfunction before invoking it.

When a callback throws, the same error still reaches the caller. The runner now also returns to an idle state, allowing a later `add()` or `next()` call to recover.

## Return values

`add()` now returns the stack for chaining. `clear()` now returns the new live empty array. `next()` continues to ignore callback return values and returns `undefined`.

## What intentionally did not change

- Execution is synchronous.
- The newest callback runs first.
- A callback must call `this.next()` to continue.
- Changing `stop` or `autoRun` does not automatically resume pending work; call `next()` explicitly.
- The live callback array remains intentionally mutable for advanced scheduling.

## Upgrade checklist

1. Confirm production and development environments run Node 22.13 or newer; otherwise pin easy-stack 2.0.0.
2. Keep existing `require('easy-stack')` imports or use the native ESM default export; both now load `stack.js`.
3. Replace browser code that treated `contents` as an array with the `stack` property.
4. Ensure every enqueued value is a function.
5. Check code that depended on `add()` returning `undefined`.
6. Remove direct assignments to `stack.running`; it is now a read-only status view.
7. Use `es5.js` for browser targets that cannot parse private class fields.
