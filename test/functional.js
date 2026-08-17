import './cases/functional-stack.js';
import './cases/functional-builds.js';
import './cases/functional-playground.js';
import {run} from './harness.js';
import {validateCatalog} from './catalog.js';

validateCatalog(['functional']);
run().then(result=>{
    if(!result.ok){
        process.exitCode=1;
    }
});
