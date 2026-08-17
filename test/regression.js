import './cases/regression-stack.js';
import './cases/regression-es5.js';
import './cases/regression-playground.js';
import './cases/regression-server.js';
import './cases/regression-site.js';
import {run} from './harness.js';
import {validateCatalog} from './catalog.js';

validateCatalog(['regression']);
run().then(result=>{
    if(!result.ok){
        process.exitCode=1;
    }
});
