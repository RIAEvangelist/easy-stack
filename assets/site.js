document.documentElement.classList.add('js');

const toggle = document.querySelector('[data-nav-toggle]');
const navigation = document.querySelector('[data-site-nav]');

if (toggle && navigation) {
    toggle.addEventListener('click', () => {
        const open = navigation.dataset.open !== 'true';
        navigation.dataset.open = String(open);
        toggle.setAttribute('aria-expanded', String(open));
    });

    navigation.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            navigation.dataset.open = 'false';
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

async function copyText(button, value) {
    const original = button.textContent;

    try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Copied';
    } catch {
        button.textContent = 'Select text';
    }

    window.setTimeout(() => {
        button.textContent = original;
    }, 1400);
}

for (const strip of document.querySelectorAll('[data-copy-text]')) {
    const button = strip.querySelector('.copy-button');

    if (button) {
        button.addEventListener('click', () => copyText(button, strip.dataset.copyText));
    }
}

for (const block of document.querySelectorAll('.code-block')) {
    const code = block.querySelector('code');

    if (!code || block.querySelector('.copy-button')) {
        continue;
    }

    const button = document.createElement('button');
    button.className = 'copy-button';
    button.type = 'button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code example');
    button.addEventListener('click', () => copyText(button, code.textContent));
    block.append(button);
}

const demoButton = document.querySelector('[data-demo-run]');
const demoOutput = document.querySelector('[data-demo-output]');

if (demoButton && demoOutput) {
    demoButton.addEventListener('click', async () => {
        demoButton.disabled = true;
        demoOutput.textContent = 'Loading the native ES module…';

        try {
            const { default: Stack } = await import(new URL('../stack.js', import.meta.url));
            const stack = new Stack();
            const order = [];
            stack.autoRun = false;

            for (const label of ['first', 'second', 'third', 'fourth']) {
                stack.add(function demoTask() {
                    order.push(label);
                    this.next();
                });
            }

            stack.next();
            demoOutput.textContent = `Execution order: ${order.join(' → ')}\nRemaining tasks: ${stack.size}`;
        } catch (error) {
            demoOutput.textContent = `Demo failed: ${error.message}`;
        } finally {
            demoButton.disabled = false;
        }
    });
}
