[![easy-stack — explicit LIFO flow control for JavaScript](https://raw.githubusercontent.com/RIAEvangelist/easy-stack/main/assets/easy-stack-header.png)](https://riaevangelist.github.io/easy-stack/)

# easy-stack

Zero-dependency cooperative LIFO execution for Node.js and browsers.

[Overview](https://riaevangelist.github.io/easy-stack/) · [Why easy-stack](https://riaevangelist.github.io/easy-stack/why/) · [Guide](https://riaevangelist.github.io/easy-stack/guide/) · [API](https://riaevangelist.github.io/easy-stack/api/) · [Patterns](https://riaevangelist.github.io/easy-stack/patterns/) · [Browser](https://riaevangelist.github.io/easy-stack/browser/) · [Examples](https://riaevangelist.github.io/easy-stack/examples/) · [Playground](https://riaevangelist.github.io/easy-stack/playground/) · [Stack vs queue](https://riaevangelist.github.io/easy-stack/queue/) · [Benchmarks](https://riaevangelist.github.io/easy-stack/benchmarks/) · [Migration](https://riaevangelist.github.io/easy-stack/migration/) · [Testing](https://riaevangelist.github.io/easy-stack/testing/)

[![npm version](https://img.shields.io/npm/v/easy-stack?logo=npm)](https://www.npmjs.com/package/easy-stack)
[![npm downloads](https://img.shields.io/npm/dm/easy-stack?logo=npm)](https://www.npmjs.com/package/easy-stack)
[![Node.js support](https://img.shields.io/badge/node-%3E%3D22.13-339933?logo=nodedotjs&logoColor=white)](https://riaevangelist.github.io/easy-stack/testing/)
[![CI](https://github.com/RIAEvangelist/easy-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/RIAEvangelist/easy-stack/actions/workflows/ci.yml)
[![test cases](https://img.shields.io/badge/test_cases-86_unique-12d9c4)](https://riaevangelist.github.io/easy-stack/testing/)
[![test runner](https://img.shields.io/badge/test_runner-vanilla--test%202.1.1-12d9c4)](https://riaevangelist.github.io/easy-stack/testing/)
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

Both loaders resolve the same synchronous `stack.js` implementation on Node 22.13 and newer.

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

## Why choose it

Choose easy-stack when the newest pending intent should run first and the active task should control the hand-off. It has zero runtime dependencies, exposes pending work for inspection, works in Node and browsers, and keeps its behavior small enough to verify exhaustively. Use a FIFO queue, concurrency pool, or durable job broker when those are the actual requirements.

Read the focused [selection guide](https://riaevangelist.github.io/easy-stack/why/) and [version benchmarks](https://riaevangelist.github.io/easy-stack/benchmarks/).

[![easy-stack 2.1.0 benchmark chart showing about 18 times faster construction and 1.57 to 2.40 times faster task-turn scheduling](https://raw.githubusercontent.com/RIAEvangelist/easy-stack/main/assets/benchmark-chart.svg)](https://riaevangelist.github.io/easy-stack/benchmarks/)

Captured microbenchmarks compare the exact 2.0.0 WeakMap runtime with 2.1.0 private fields. See the linked page for the complete method, exact timings, machine data, and reproduction command.

## Browser entry points

Use `stack.js` as a native module, `stack-vanilla.js` as a modern classic script, or `es5.js` for legacy syntax:

```html
<script src="https://unpkg.com/easy-stack@2.1.0/stack-vanilla.js"></script>
<script>
    const stack = new Stack();
</script>
```

See the focused [browser guide](https://riaevangelist.github.io/easy-stack/browser/) for module and classic-script examples.

## Verification

The non-duplicated catalog contains 86 uniquely identified Unit, Functional, Integration, and Regression cases, all registered through `vanilla-test@2.1.1`. CI proves the exact Node 22.13 floor and Node 24 across Linux, macOS, and Windows; it also verifies same-constructor ESM/CommonJS interop, browser globals, the packed npm artifact, documentation links, the opaque Playground Worker, and 100% statement, branch, function, and line coverage.

```sh
npm test
npm run test:unit
npm run test:functional
npm run test:integration
npm run test:regression
npm run test:regression:chrome
npm run coverage
npm run benchmark
```

Read the [testing evidence](https://riaevangelist.github.io/easy-stack/testing/) or the [v2 migration guide](./MIGRATION.md).

## License

[MIT](./licence) © Brandon Nozaki Miller
