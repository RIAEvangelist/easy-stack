(function exposeStack(global) {
    'use strict';

    const stacks = new WeakMap();
    const states = new WeakMap();

    function validateTasks(tasks) {
        const invalidIndex = tasks.findIndex((task) => typeof task !== 'function');

        if (invalidIndex !== -1) {
            throw new TypeError(`Stack task at index ${invalidIndex} must be a function.`);
        }
    }

    class Stack {
        constructor() {
            stacks.set(this, []);
            states.set(this, { running: false });
            this.autoRun = true;
            this.stop = false;
        }

        add(...tasks) {
            validateTasks(tasks);
            stacks.get(this).push(...tasks);

            if (!this.running && !this.stop && this.autoRun) {
                this.next();
            }

            return this;
        }

        next() {
            const stack = stacks.get(this);
            const state = states.get(this);

            if (this.stop || stack.length === 0) {
                state.running = false;
                return;
            }

            state.running = true;
            const task = stack.pop();

            if (typeof task !== 'function') {
                state.running = false;
                throw new TypeError('The next Stack task must be a function.');
            }

            try {
                task.call(this);
            } catch (error) {
                state.running = false;
                throw error;
            }
        }

        clear() {
            const stack = [];
            stacks.set(this, stack);
            return stack;
        }

        contents(tasks) {
            if (arguments.length > 0) {
                this.stack = tasks;
            }

            return stacks.get(this);
        }

        get stack() {
            return stacks.get(this);
        }

        set stack(tasks) {
            if (!Array.isArray(tasks)) {
                throw new TypeError('Stack contents must be an array of functions.');
            }

            validateTasks(tasks);
            stacks.set(this, tasks);
        }

        get running() {
            return states.get(this).running;
        }

        get size() {
            return stacks.get(this).length;
        }
    }

    global.Stack = Stack;
}(typeof globalThis === 'undefined' ? this : globalThis));
