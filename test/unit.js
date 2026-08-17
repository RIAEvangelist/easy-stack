import './cases/unit-stack.js';
import './cases/unit-playground.js';
import './cases/unit-stack-operations.js';
import {run} from './harness.js';
import {validateCatalog} from './catalog.js';

validateCatalog(['unit']);
run().then(result=>{
    if(!result.ok){
        process.exitCode=1;
    }
});
