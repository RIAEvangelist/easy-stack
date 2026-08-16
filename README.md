[![easy-stack — explicit LIFO flow control for JavaScript](https://raw.githubusercontent.com/RIAEvangelist/easy-stack/main/assets/easy-stack-header.png)](https://riaevangelist.github.io/easy-stack/)

# easy-stack

Zero-dependency cooperative LIFO execution for Node.js and browsers.

[Overview](https://riaevangelist.github.io/easy-stack/) · [Guide](https://riaevangelist.github.io/easy-stack/guide/) · [API](https://riaevangelist.github.io/easy-stack/api/) · [Patterns](https://riaevangelist.github.io/easy-stack/patterns/) · [Browser](https://riaevangelist.github.io/easy-stack/browser/) · [Examples](https://riaevangelist.github.io/easy-stack/examples/) · [Stack vs queue](https://riaevangelist.github.io/easy-stack/queue/) · [Migration](https://riaevangelist.github.io/easy-stack/migration/) · [Testing](https://riaevangelist.github.io/easy-stack/testing/)

[![npm version](https://img.shields.io/npm/v/easy-stack?logo=npm)](https://www.npmjs.com/package/easy-stack)
[![npm downloads](https://img.shields.io/npm/dm/easy-stack?logo=npm)](https://www.npmjs.com/package/easy-stack)
[![Node.js support](https://img.shields.io/badge/node-%3E%3D12.22-339933?logo=nodedotjs&logoColor=white)](https://riaevangelist.github.io/easy-stack/testing/)
[![CI](https://github.com/RIAEvangelist/easy-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/RIAEvangelist/easy-stack/actions/workflows/ci.yml)
[![tests](https://img.shields.io/badge/tests-vanilla--test%202.1.1-12d9c4)](https://riaevangelist.github.io/easy-stack/testing/)
[![coverage](https://img.shields.io/badge/coverage-100%25-12d9c4)](https://riaevangelist.github.io/easy-stack/testing/)
[![runtime dependencies](https://img.shields.io/badge/runtime_dependencies-0-12d9c4)](https://www.npmjs.com/package/easy-stack?activeTab=dependencies)
[![license](https://img.shields.io/npm/l/easy-stack)](./licence)

## Quick start

```sh
npm install easy-stack
```

```javascript
import Stack from 'easy-stack';

const stack = new Stack();
const order = [];

stack.autoRun = false;
stack.add(
    function first() {
        order.push('first');
        this.next();
    },
    function newest() {
        order.push('newest');
        this.next();
    }
);
stack.next();

console.log(order); // ['newest', 'first']
```

CommonJS remains supported:

```javascript
const Stack = require('easy-stack');
```

Each task receives the stack as `this` and explicitly continues the flow with `this.next()`. Execution begins synchronously when `autoRun` is truthy; set it to `false` while assembling a batch.

## Contract at a glance

| API | Result |
| --- | --- |
| `new Stack()` | Creates an isolated stack with `autoRun = true` and `stop = false`. |
| `add(...tasks)` | Validates and appends functions, starts eligible work, and returns the stack. |
| `next()` | Runs the newest pending task and returns `undefined`. |
| `clear()` | Removes pending work and returns the new empty live array. |
| `contents()` | Returns the live pending array. |
| `contents(tasks)` | Replaces pending work after validating the complete array. |
| `stack` | Gets or replaces the live pending array. |
| `size` | Reports the pending task count. |
| `running` | Reports whether a task has started and not yet yielded or drained. |

The runner is intentionally cooperative. A task that does not call `this.next()` keeps the stack active until another part of the program calls `next()`. New tasks added while active take priority over older pending work.

## Browser entry points

Use `stack.js` as a native module, `stack-vanilla.js` as a modern classic script, or `es5.js` for legacy syntax:

```html
<script src="https://unpkg.com/easy-stack@2.0.0/stack-vanilla.js"></script>
<script>
    const stack = new Stack();
</script>
```

See the focused [browser guide](https://riaevangelist.github.io/easy-stack/browser/) for module and classic-script examples.

## Verification

The shared behavior suite runs through `vanilla-test@2.1.1` in Node and headless Chrome. A dependency-free fallback proves the shipped runtime on the declared Node 12.22 floor. CI also verifies both module systems, browser globals, the packed npm artifact, documentation links, and 100% statement, branch, function, and line coverage.

```sh
npm test
npm run coverage
```

Read the [testing evidence](https://riaevangelist.github.io/easy-stack/testing/) or the [v2 migration guide](./MIGRATION.md).

## License

[MIT](./licence) © Brandon Nozaki Miller
