import './cases/regression-browser.js';
import {run} from './harness.js';
import {validateCatalog} from './catalog.js';

validateCatalog(['regression'],{complete:false});
run().then(result=>{
    if(!result.ok){
        process.exitCode=1;
    }
});
