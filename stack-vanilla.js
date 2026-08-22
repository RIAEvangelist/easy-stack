(function exposeStack(global) {
    'use strict';

    function validateTasks(tasks) {
        const invalidIndex = tasks.findIndex((task) => typeof task !== 'function');

        if (invalidIndex !== -1) {
            throw new TypeError(`Stack task at index ${invalidIndex} must be a function.`);
        }
    }

    class Stack {
        #stack = [];
        #running = false;

        constructor() {
            this.autoRun = true;
            this.stop = false;
        }

        add(...tasks) {
            validateTasks(tasks);
            this.#stack.push(...tasks);

            if (!this.running && !this.stop && this.autoRun) {
                this.next();
            }

            return this;
        }

        next() {
            if (this.stop || this.#stack.length === 0) {
                this.#running = false;
                return;
            }

            this.#running = true;
            const task = this.#stack.pop();

            if (typeof task !== 'function') {
                this.#running = false;
                throw new TypeError('The next Stack task must be a function.');
            }

            try {
                task.call(this);
            } catch (error) {
                this.#running = false;
                throw error;
            }
        }

        clear() {
            this.#stack = [];
            return this.#stack;
        }

        contents(tasks) {
            if (arguments.length > 0) {
                this.stack = tasks;
            }

            return this.#stack;
        }

        get stack() {
            return this.#stack;
        }

        set stack(tasks) {
            if (!Array.isArray(tasks)) {
                throw new TypeError('Stack contents must be an array of functions.');
            }

            validateTasks(tasks);
            this.#stack = tasks;
        }

        get running() {
            return this.#running;
        }

        get size() {
            return this.#stack.length;
        }
    }

    global.Stack = Stack;
}(typeof globalThis === 'undefined' ? this : globalThis));
