import {prepareSource} from './runtime.js';

const defaultSource=`import Stack from 'easy-stack';

const stack=new Stack();
const trace=[];

stack.autoRun=false;
stack.add(
    function first(){
        trace.push('first');
        this.next();
    },
    function newest(){
        trace.push('newest');
        this.next();
    }
);
stack.next();

console.log({trace,size:stack.size,running:stack.running});
`;

const source=document.querySelector('[data-runner-source]');
const output=document.querySelector('[data-runner-output]');
const runButton=document.querySelector('[data-runner-run]');
const stopButton=document.querySelector('[data-runner-stop]');
const mode=document.querySelector('[data-runner-mode]');
const status=document.querySelector('[data-runner-status]');
let activitySource=defaultSource;
let currentWorker=null;
let followingActivity=true;
let runCount=0;
let stackModuleSource='';
let watchdog=null;
let workerModuleSource='';

function write(level,message){
    if(output.children.length >= 200){
        if(output.lastElementChild?.dataset.level !== 'limit'){
            const limit=document.createElement('li');
            limit.className='warn';
            limit.dataset.level='limit';
            limit.textContent='Output capped at 200 entries. The isolated Worker was stopped.';
            output.lastElementChild.replaceWith(limit);
            stopRun('Execution stopped after reaching the 200-entry output limit.');
        }
        return;
    }

    const item=document.createElement('li');
    item.className=level;
    item.dataset.level=level;
    item.textContent=String(message);
    output.append(item);
    output.scrollTop=output.scrollHeight;
}

function setFollowing(value,message){
    followingActivity=value;
    mode.textContent=value ? 'Following activity' : 'Custom code';
    mode.dataset.mode=value ? 'following' : 'custom';
    status.textContent=message;
}

function loadActivity(nextSource,{force=false}={}){
    activitySource=nextSource;

    if(followingActivity || force){
        stopRun('Synchronizing the editor.');
        source.value=activitySource;
        output.replaceChildren();
        setFollowing(true,'Editor synchronized with the visible stack activity.');
    }else{
        status.textContent='Activity changed; custom code was preserved. Choose Sync activity to replace it.';
    }
}

function stopRun(message='Execution stopped.'){
    if(currentWorker){
        currentWorker.terminate();
        currentWorker=null;
    }
    if(watchdog){
        clearTimeout(watchdog);
        watchdog=null;
    }
    runButton.disabled=false;
    runButton.textContent='Run';
    stopButton.disabled=true;
    status.textContent=message;
}

function run(){
    if(!stackModuleSource || !workerModuleSource){
        write('error','The checked-in module is not ready. Reload the Playground and try again.');
        return;
    }

    stopRun('Preparing a fresh isolated run.');
    output.replaceChildren();

    let prepared;
    try{
        prepared=prepareSource(source.value,stackModuleSource);
    }catch(error){
        write('error',`${error.name}: ${error.message}`);
        status.textContent='Source preparation failed.';
        return;
    }

    const workerUrl=URL.createObjectURL(new Blob([workerModuleSource],{type:'text/javascript'}));
    let worker;
    try{
        worker=new Worker(workerUrl);
    }catch(error){
        URL.revokeObjectURL(workerUrl);
        write('error',`${error.name}: ${error.message}`);
        status.textContent='The isolated Worker could not start.';
        return;
    }
    URL.revokeObjectURL(workerUrl);
    const random=crypto.getRandomValues(new Uint32Array(2)).join('-');
    const token=`run-${++runCount}-${random}`;
    let moduleCompleted=false;
    currentWorker=worker;
    runButton.disabled=true;
    runButton.textContent='Running…';
    stopButton.disabled=false;
    status.textContent='Running the visible source in an isolated Worker.';

    worker.addEventListener('message',event=>{
        if(worker !== currentWorker || !event.data || event.data.token !== token){
            return;
        }

        if(event.data.type === 'console'){
            write(event.data.level,event.data.message);
        }else if(event.data.type === 'error'){
            write('error',event.data.message);
            stopRun('The module finished with an error.');
        }else if(event.data.type === 'done'){
            moduleCompleted=true;
            write('success','Module completed');
            runButton.disabled=false;
            runButton.textContent='Run';
            stopButton.disabled=false;
            status.textContent='Module completed. Async work may continue until this run’s 4-second limit.';
        }
    });

    worker.addEventListener('error',event=>{
        if(worker !== currentWorker){
            return;
        }
        write('error',event.message || 'The isolated Worker failed.');
        stopRun('The isolated Worker failed.');
    });

    watchdog=setTimeout(()=>{
        if(worker !== currentWorker){
            return;
        }
        if(moduleCompleted){
            write('info','Isolated async window closed after 4 seconds.');
            stopRun('Module completed; its isolated Worker closed after 4 seconds.');
        }else{
            write('error','Execution exceeded 4 seconds and was stopped.');
            stopRun('Execution timed out after 4 seconds.');
        }
    },4000);

    worker.postMessage({source:prepared,token,type:'run'});
}

source.value=defaultSource;
mode.dataset.mode='following';

source.addEventListener('input',()=>{
    if(followingActivity){
        setFollowing(false,'Custom code is preserved while the visual activity continues.');
    }
});

source.addEventListener('keydown',event=>{
    if(event.key === 'Enter' && (event.ctrlKey || event.metaKey)){
        event.preventDefault();
        run();
    }
});

runButton.addEventListener('click',run);
stopButton.addEventListener('click',()=>stopRun());
document.querySelector('[data-runner-sync]').addEventListener('click',()=>{
    loadActivity(activitySource,{force:true});
    source.focus();
});
document.querySelector('[data-runner-clear]').addEventListener('click',()=>{
    output.replaceChildren();
    status.textContent='Console cleared.';
});
document.querySelector('[data-runner-copy]').addEventListener('click',async()=>{
    try{
        await navigator.clipboard.writeText(source.value);
        status.textContent='Editor source copied to the clipboard.';
    }catch{
        source.focus();
        source.select();
        status.textContent='Clipboard access is unavailable; the source is selected for manual copying.';
    }
});

globalThis.addEventListener('message',event=>{
    const parentOrigin=document.referrer ? new URL(document.referrer).origin : '';
    if(event.source !== parent || event.origin !== parentOrigin || !event.data || event.data.type !== 'easy-stack:load'){
        return;
    }
    if(typeof event.data.source !== 'string' || event.data.source.length > 100000){
        return;
    }
    if(typeof event.data.stackModuleSource !== 'string' || typeof event.data.workerModuleSource !== 'string'){
        return;
    }

    stackModuleSource=event.data.stackModuleSource;
    workerModuleSource=event.data.workerModuleSource;
    loadActivity(event.data.source);
});

if(location.protocol === 'file:'){
    write('warn','Native module imports need HTTP. Run npm start, then open http://localhost:8000/playground/.');
}
