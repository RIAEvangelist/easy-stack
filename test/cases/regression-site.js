import fs from 'node:fs';
import {equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const regression=suiteCase('regression');
const root=new URL('../../',import.meta.url);
const pages=[
    'index.html','guide/index.html','api/index.html','patterns/index.html','browser/index.html',
    'examples/index.html','playground/index.html','queue/index.html','migration/index.html','testing/index.html',
    'testing/unit/index.html','testing/functional/index.html','testing/integration/index.html','testing/regression/index.html',
    'playground/frame.html'
];
const read=path=>fs.readFileSync(new URL(path,root),'utf8');

regression('R013','regression.site.remote-assets','site has no remote runtime asset or avatar dependency',()=>{
    for(const page of pages){
        const source=read(page);
        equal(/<script[^>]+src="https?:\/\//i.test(source),false,`${page} loads a remote script.`);
        equal(/<link[^>]+rel="stylesheet"[^>]+href="https?:\/\//i.test(source),false,`${page} loads a remote stylesheet.`);
        equal(/<img[^>]+src="https?:\/\//i.test(source),false,`${page} loads a remote image.`);
    }
    equal(/@import\s+url\(\s*['"]?https?:\/\//i.test(read('assets/site.css')),false);
    equal(/avatars\d*\.githubusercontent\.com/i.test(read('README.md')),false);
});

regression('R014','regression.playground.sandbox','editor runner remains opaque, CSP-bound, and free of text evaluation shortcuts',()=>{
    const page=read('playground/index.html');
    const frame=read('playground/frame.html');
    const bridge=read('assets/playground.js');
    const runner=read('playground/runner.js');
    const worker=read('playground/worker.js');
    equal(page.includes('sandbox="allow-scripts"'),true);
    equal(page.includes('allow-same-origin'),false);
    equal(page.includes('allow="clipboard-write"'),true);
    equal(frame.includes('Content-Security-Policy'),true);
    equal(frame.includes("default-src 'none'"),true);
    equal(frame.includes("connect-src 'none'"),true);
    equal(frame.includes('worker-src blob:'),true);
    equal(frame.includes('unsafe-eval'),false);
    equal(frame.includes('unsafe-inline'),false);
    equal(frame.includes('data-runner-source'),true);
    equal(frame.includes('data-runner-run'),true);
    equal(frame.includes('data-runner-stop'),true);
    equal(frame.includes('role="log" aria-live="polite"'),true);
    equal(bridge.startsWith("import Stack from '../stack.js';"),true);
    equal(/\beval\s*\(|new\s+Function\b|\.innerHTML\s*=/.test(`${bridge}\n${runner}\n${worker}`),false);
});
