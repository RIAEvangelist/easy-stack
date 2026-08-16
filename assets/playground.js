import Stack from '../stack.js';

const presets=Object.freeze({
    cooperative:Object.freeze({
        autoHandoff:true,
        autoRun:false,
        label:'Cooperative LIFO batch',
        stop:false,
        tasks:Object.freeze(['first','second','newest'])
    }),
    manual:Object.freeze({
        autoHandoff:false,
        autoRun:false,
        label:'Manual hand-off',
        stop:false,
        tasks:Object.freeze(['first','second','newest'])
    }),
    stopped:Object.freeze({
        autoHandoff:true,
        autoRun:true,
        label:'Stopped cooperative batch',
        stop:true,
        tasks:Object.freeze(['first','second','newest'])
    })
});

function createPlayground(){
    let labels;
    let lastAction;
    let stack;
    let trace;

    function createFreshStack(){
        labels=new WeakMap();
        stack=new Stack();
        trace=[];
        lastAction='Created a new stack with constructor defaults.';
    }

    function makeTask(label,autoHandoff){
        const task=function playgroundTask(){
            trace.push(label);
            lastAction=autoHandoff
                ? `Ran “${label}” and yielded with next().`
                : `Ran “${label}” and paused for a manual hand-off.`;

            if(autoHandoff){
                this.next();
            }
        };

        labels.set(task,label);
        return task;
    }

    function snapshot(){
        const pending=[...stack.stack]
            .reverse()
            .map(task=>labels.get(task) || task.name || 'anonymous task');

        return Object.freeze({
            autoRun:Boolean(stack.autoRun),
            lastAction,
            pending:Object.freeze(pending),
            running:stack.running,
            size:stack.size,
            stop:Boolean(stack.stop),
            trace:Object.freeze([...trace])
        });
    }

    function load(presetName){
        const preset=presets[presetName];

        if(!preset){
            throw new RangeError(`Unknown playground preset: ${presetName}.`);
        }

        createFreshStack();
        stack.autoRun=preset.autoRun;
        stack.stop=preset.stop;

        for(const label of preset.tasks){
            stack.add(makeTask(label,preset.autoHandoff));
        }

        lastAction=`Loaded “${preset.label}” with ${stack.size} pending tasks.`;
        return snapshot();
    }

    function add(label,{autoHandoff=true}={}){
        if(typeof label !== 'string'){
            throw new TypeError('Task label must be a string.');
        }

        const normalized=label.trim();
        if(normalized.length === 0){
            throw new TypeError('Task label must not be empty.');
        }
        if(normalized.length > 60){
            throw new RangeError('Task label must be 60 characters or fewer.');
        }

        const traceLength=trace.length;
        stack.add(makeTask(normalized,Boolean(autoHandoff)));

        if(trace.length === traceLength){
            lastAction=`Added “${normalized}” to the top of the stack.`;
        }

        return snapshot();
    }

    function next(){
        const sizeBefore=stack.size;
        const traceLength=trace.length;
        stack.next();

        if(trace.length === traceLength){
            if(stack.stop){
                lastAction='Next was blocked because stop is true.';
            }else if(sizeBefore === 0){
                lastAction='An empty hand-off marked the stack idle.';
            }else{
                lastAction='No pending task ran.';
            }
        }

        return snapshot();
    }

    function setAutoRun(value){
        stack.autoRun=Boolean(value);
        lastAction=stack.size === 0
            ? `Set autoRun to ${stack.autoRun}. No work is pending.`
            : `Set autoRun to ${stack.autoRun}. Existing work still waits for next().`;
        return snapshot();
    }

    function setStop(value){
        stack.stop=Boolean(value);
        if(stack.size === 0){
            lastAction=`Set stop to ${stack.stop}. No work is pending.`;
        }else{
            lastAction=stack.stop
                ? 'Set stop to true. Work remains pending.'
                : 'Released stop. Select Next to resume pending work.';
        }
        return snapshot();
    }

    function clear(){
        const removed=stack.size;
        stack.clear();
        lastAction=`Cleared ${removed} pending ${removed === 1 ? 'task' : 'tasks'} without changing state flags.`;
        return snapshot();
    }

    function reset(){
        createFreshStack();
        return snapshot();
    }

    createFreshStack();

    return Object.freeze({add,clear,load,next,reset,setAutoRun,setStop,snapshot});
}

function bootPlayground(root){
    if(!root){
        return;
    }

    const controller=createPlayground();
    const preset=root.querySelector('[data-playground-preset]');
    const loadButton=root.querySelector('[data-playground-load]');
    const addForm=root.querySelector('[data-playground-add]');
    const labelInput=root.querySelector('[data-playground-label]');
    const handoff=root.querySelector('[data-playground-handoff]');
    const autoRun=root.querySelector('[data-playground-auto-run]');
    const stop=root.querySelector('[data-playground-stop]');
    const nextButton=root.querySelector('[data-playground-next]');
    const releaseButton=root.querySelector('[data-playground-release]');
    const clearButton=root.querySelector('[data-playground-clear]');
    const resetButton=root.querySelector('[data-playground-reset]');
    const pendingList=root.querySelector('[data-playground-pending]');
    const traceList=root.querySelector('[data-playground-trace]');
    const status=root.querySelector('[data-playground-status]');
    const size=root.querySelector('[data-playground-size]');
    const running=root.querySelector('[data-playground-running]');
    const autoRunValue=root.querySelector('[data-playground-auto-run-value]');
    const stopValue=root.querySelector('[data-playground-stop-value]');

    function replaceList(list,items,emptyMessage,{topLabel=false}={}){
        const children=[];

        if(items.length === 0){
            const item=document.createElement('li');
            item.className='playground-list__empty';
            item.textContent=emptyMessage;
            children.push(item);
        }else{
            items.forEach((value,index)=>{
                const item=document.createElement('li');
                const text=document.createElement('span');
                text.textContent=value;

                if(topLabel && index === 0){
                    const marker=document.createElement('strong');
                    marker.textContent='Top · newest';
                    item.append(marker);
                }

                item.append(text);
                children.push(item);
            });
        }

        list.replaceChildren(...children);
    }

    function render(state){
        autoRun.checked=state.autoRun;
        stop.checked=state.stop;
        size.textContent=String(state.size);
        running.textContent=String(state.running);
        autoRunValue.textContent=String(state.autoRun);
        stopValue.textContent=String(state.stop);
        releaseButton.disabled=!state.stop;
        clearButton.disabled=state.size === 0;
        status.textContent=`${state.lastAction} ${state.size} pending.`;
        replaceList(pendingList,state.pending,'No pending tasks.',{topLabel:true});
        replaceList(traceList,state.trace,'No task has run yet.');
    }

    loadButton.addEventListener('click',()=>render(controller.load(preset.value)));

    addForm.addEventListener('submit',event=>{
        event.preventDefault();
        const label=labelInput.value.trim();

        if(label.length === 0){
            labelInput.setCustomValidity('Enter a task label.');
            labelInput.reportValidity();
            return;
        }

        labelInput.setCustomValidity('');
        render(controller.add(label,{autoHandoff:handoff.value === 'cooperative'}));
        labelInput.value='';
        labelInput.focus();
    });

    labelInput.addEventListener('input',()=>labelInput.setCustomValidity(''));

    autoRun.addEventListener('change',()=>render(controller.setAutoRun(autoRun.checked)));
    stop.addEventListener('change',()=>render(controller.setStop(stop.checked)));
    nextButton.addEventListener('click',()=>render(controller.next()));
    releaseButton.addEventListener('click',()=>render(controller.setStop(false)));
    clearButton.addEventListener('click',()=>render(controller.clear()));
    resetButton.addEventListener('click',()=>{
        render(controller.reset());
        labelInput.focus();
    });

    render(controller.load(preset.value));
    return controller;
}

if(typeof document !== 'undefined'){
    bootPlayground(document.querySelector('[data-playground]'));
}

export {bootPlayground,createPlayground};
