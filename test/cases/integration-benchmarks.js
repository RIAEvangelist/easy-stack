import fs from 'node:fs';
import {equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const integration=suiteCase('integration');
const root=new URL('../../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');

integration('I029','benchmarks.version-evidence','benchmark evidence compares the tagged release with validated private-field runs',()=>{
    const packageData=JSON.parse(read('package.json'));
    const results=JSON.parse(read('benchmarks/results.json'));
    const script=read('scripts/benchmark.js');
    const ci=read('.github/workflows/ci.yml');
    const pages=read('.github/workflows/pages.yml');
    const readme=read('README.md');
    const chart=read('assets/benchmark-chart.svg');
    const benchmarkPage=read('benchmarks/index.html');

    equal(packageData.scripts.benchmark,'node --expose-gc ./scripts/benchmark.js');
    equal(script.includes("const baselineVersion='2.0.0'"),true);
    equal(script.includes('retained=new Array(count)'),true);
    equal(script.includes('measured.checksum !== iterations'),true);
    equal(script.includes('new Function'),false);
    equal(results.baseline,'2.0.0 WeakMap state');
    equal(results.candidate,'2.1.0 private fields');
    equal(results.runs.some(run=>run.runtime === 'v22.13.0'),true);
    equal(results.runs.some(run=>run.runtime === 'v24.18.0'),true);
    for(const run of results.runs){
        for(const metric of run.metrics){
            equal(metric.speedup > 1,true,`${run.runtime} ${metric.label} did not improve.`);
        }
    }
    equal(ci.includes('npm run benchmark'),true);
    equal(ci.includes('benchmark-results'),true);
    equal(readme.includes('assets/benchmark-chart.svg'),true);
    equal(chart.includes('<title id="title">easy-stack 2.1.0 performance compared with 2.0.0</title>'),true);
    equal(benchmarkPage.includes('class="benchmark-figure"'),true);
    equal(benchmarkPage.includes('class="benchmark-bar benchmark-bar--candidate"'),true);
    equal(pages.includes('benchmarks/results.json'),true);
    equal(pages.includes('_site/benchmarks/results.json'),true);
});
