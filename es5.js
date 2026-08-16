(function exposeStack(global) {
    'use strict';

    function validateTasks(tasks) {
        var index;

        if (!Array.isArray(tasks)) {
            throw new TypeError('Stack contents must be an array of functions.');
        }

        for (index = 0; index < tasks.length; index += 1) {
            if (typeof tasks[index] !== 'function') {
                throw new TypeError('Stack task at index ' + index + ' must be a function.');
            }
        }
    }

    function Stack() {
        var callbacks = [];
        var running = false;
        var self;

        if (!(this instanceof Stack)) {
            return new Stack();
        }

        self = this;
        this.autoRun = true;
        this.stop = false;

        Object.defineProperties(this, {
            add: {
                enumerable: true,
                writable: false,
                value: function add() {
                    var tasks = [];
                    var index;

                    for (index = 0; index < arguments.length; index += 1) {
                        tasks.push(arguments[index]);
                    }

                    validateTasks(tasks);

                    for (index = 0; index < tasks.length; index += 1) {
                        callbacks.push(tasks[index]);
                    }

                    if (!running && !self.stop && self.autoRun) {
                        self.next();
                    }

                    return self;
                }
            },
            next: {
                enumerable: true,
                writable: false,
                value: function next() {
                    var task;

                    if (self.stop || callbacks.length === 0) {
                        running = false;
                        return;
                    }

                    running = true;
                    task = callbacks.pop();

                    if (typeof task !== 'function') {
                        running = false;
                        throw new TypeError('The next Stack task must be a function.');
                    }

                    try {
                        task.call(self);
                    } catch (error) {
                        running = false;
                        throw error;
                    }
                }
            },
            clear: {
                enumerable: true,
                writable: false,
                value: function clear() {
                    callbacks = [];
                    return callbacks;
                }
            },
            contents: {
                enumerable: true,
                writable: false,
                value: function contents(tasks) {
                    if (arguments.length > 0) {
                        self.stack = tasks;
                    }

                    return callbacks;
                }
            },
            stack: {
                enumerable: true,
                get: function getStack() {
                    return callbacks;
                },
                set: function setStack(tasks) {
                    validateTasks(tasks);
                    callbacks = tasks;
                }
            },
            running: {
                enumerable: true,
                get: function getRunning() {
                    return running;
                }
            },
            size: {
                enumerable: true,
                get: function getSize() {
                    return callbacks.length;
                }
            }
        });
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = Stack;
        module.exports.Stack = Stack;
    } else {
        global.Stack = Stack;
    }
}(typeof globalThis === 'undefined' ? this : globalThis));
