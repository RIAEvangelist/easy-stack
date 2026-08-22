import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import Stack from '../stack.js';

const baselineVersion='2.0.0';
const root=fileURLToPath(new URL('../',import.meta.url));
const packageData=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const iterations=Number(process.env.BENCHMARK_ITERATIONS || 100000);
const samples=Number(process.env.BENCHMARK_SAMPLES || 21);
let retained;

if(typeof global.gc !== 'function'){
    throw new Error('Run this benchmark with --expose-gc.');
}

if(!Number.isSafeInteger(iterations) || iterations < 1){
    throw new TypeError('BENCHMARK_ITERATIONS must be a positive integer.');
}

if(!Number.isSafeInteger(samples) || samples < 3){
    throw new TypeError('BENCHMARK_SAMPLES must be an integer of at least 3.');
}

function loadBaseline(){
    const source=execFileSync('git',['show',`${baselineVersion}:stack.cjs`],{
        cwd:root,
        encoding:'utf8'
    });
    const directory=fs.mkdtempSync(path.join(os.tmpdir(),'easy-stack-benchmark-'));
    const baselinePath=path.join(directory,`easy-stack-${baselineVersion}.cjs`);

    try{
        fs.writeFileSync(baselinePath,source);
        return createRequire(import.meta.url)(baselinePath);
    }finally{
        fs.rmSync(directory,{force:true,recursive:true});
    }
}

function construct(Type,count){
    retained=new Array(count);
    for(let index=0;index<count;index+=1){
        retained[index]=new Type();
    }
    let checksum=0;
    for(const stack of retained){
        checksum+=Number(stack.autoRun)+stack.size;
    }
    return checksum;
}

function scheduleAndDrain(Type,count){
    const stack=new Type();
    let completed=0;
    function task(){
        completed+=1;
        this.next();
    }
    for(let index=0;index<count;index+=1){
        stack.add(task);
    }
    return completed + stack.size + Number(stack.running);
}

function duration(action){
    global.gc();
    const started=performance.now();
    const checksum=action();
    const milliseconds=performance.now()-started;
    retained=undefined;
    return {checksum,milliseconds};
}

function median(values){
    const ordered=[...values].sort((left,right)=>left-right);
    const midpoint=Math.floor(ordered.length/2);
    return ordered.length % 2 ? ordered[midpoint] : (ordered[midpoint-1]+ordered[midpoint])/2;
}

function compare(label,action){
    const baseline=[];
    const candidate=[];
    const warmupIterations=Math.max(1000,Math.floor(iterations/10));

    for(let index=0;index<3;index+=1){
        action(BaselineStack,warmupIterations);
        action(Stack,warmupIterations);
    }

    for(let index=0;index<samples;index+=1){
        const order=index % 2 ? [[Stack,candidate],[BaselineStack,baseline]] : [[BaselineStack,baseline],[Stack,candidate]];
        for(const [Type,results] of order){
            const measured=duration(()=>action(Type,iterations));
            if(measured.checksum !== iterations){
                throw new Error(`${label} produced an invalid checksum.`);
            }
            results.push(measured.milliseconds);
        }
    }

    const baselineMedian=median(baseline);
    const candidateMedian=median(candidate);
    return {
        label,
        iterations,
        unit:'milliseconds',
        baseline:Number(baselineMedian.toFixed(2)),
        candidate:Number(candidateMedian.toFixed(2)),
        speedup:Number((baselineMedian/candidateMedian).toFixed(2))
    };
}

const BaselineStack=loadBaseline();
const results={
    package:packageData.name,
    baseline:`${baselineVersion} WeakMap state`,
    candidate:`${packageData.version} private fields`,
    methodology:`Median of ${samples} alternating samples; lower is faster.`,
    runtime:process.version,
    v8:process.versions.v8,
    platform:`${process.platform} ${process.arch}`,
    processor:os.cpus()[0]?.model || 'unknown',
    metrics:[
        compare('Construct instances',construct),
        compare('Schedule and run task turns',scheduleAndDrain)
    ]
};

process.stdout.write(`${JSON.stringify(results,null,2)}\n`);
