import Stack from '../stack.js';

const stack = new Stack();
const executionOrder = [];

stack.autoRun = false;

for (let index = 0; index < 5; index += 1) {
    stack.add(function runItem() {
        executionOrder.push(index);
        this.next();
    });
}

stack.next();

console.log('LIFO order:', executionOrder.join(' → '));
