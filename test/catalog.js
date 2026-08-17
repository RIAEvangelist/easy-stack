import {test} from './harness.js';

const suites=Object.freeze({
    unit:Object.freeze({label:'Unit',prefix:'U'}),
    functional:Object.freeze({label:'Functional',prefix:'F'}),
    integration:Object.freeze({label:'Integration',prefix:'I'}),
    regression:Object.freeze({label:'Regression',prefix:'R'})
});
const catalog=[];

function defineCase(suite,id,contract,name,check){
    const definition=suites[suite];
    if(!definition){
        throw new RangeError(`Unknown test suite: ${suite}.`);
    }
    if(!new RegExp(`^${definition.prefix}\\d{3}$`).test(id)){
        throw new TypeError(`${suite} case id must use ${definition.prefix} followed by three digits.`);
    }
    if(typeof contract !== 'string' || contract.trim() === ''){
        throw new TypeError(`${id} contract key must be a nonempty string.`);
    }
    if(typeof name !== 'string' || name.trim() === ''){
        throw new TypeError(`${id} name must be a nonempty string.`);
    }
    if(typeof check !== 'function'){
        throw new TypeError(`${id} check must be a function.`);
    }
    if(catalog.some(entry=>entry.id === id)){
        throw new Error(`Duplicate test case id: ${id}.`);
    }
    if(catalog.some(entry=>entry.contract === contract)){
        throw new Error(`Duplicate test contract key: ${contract}.`);
    }

    catalog.push(Object.freeze({contract,id,name,suite}));
    test(`[${id}] ${name}`,check);
}

function suiteCase(suite){
    return (id,contract,name,check)=>defineCase(suite,id,contract,name,check);
}

function validateCatalog(requiredSuites=[],options={}){
    const complete=options.complete !== false;
    for(const suite of requiredSuites){
        if(!suites[suite]){
            throw new RangeError(`Unknown required test suite: ${suite}.`);
        }
        if(!catalog.some(entry=>entry.suite === suite)){
            throw new Error(`The ${suite} suite has no registered cases.`);
        }
    }

    if(!complete){
        return catalogSnapshot();
    }

    for(const [suite,definition] of Object.entries(suites)){
        const ids=catalog
            .filter(entry=>entry.suite === suite)
            .map(entry=>Number(entry.id.slice(1)))
            .sort((left,right)=>left-right);

        ids.forEach((number,index)=>{
            if(number !== index+1){
                throw new Error(`${definition.label} case ids must be contiguous from ${definition.prefix}001.`);
            }
        });
    }

    return catalogSnapshot();
}

function catalogSnapshot(){
    return Object.freeze(catalog.map(entry=>Object.freeze({...entry})));
}

function catalogSummary(){
    const counts={};
    for(const [suite,definition] of Object.entries(suites)){
        counts[suite]=Object.freeze({
            cases:catalog.filter(entry=>entry.suite === suite).length,
            label:definition.label,
            prefix:definition.prefix
        });
    }

    return Object.freeze({
        suites:Object.freeze(counts),
        total:catalog.length
    });
}

export {catalogSnapshot,catalogSummary,defineCase,suiteCase,validateCatalog};
