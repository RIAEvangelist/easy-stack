import './cases/unit-stack.js';
import './cases/unit-stack-operations.js';
import './cases/functional-stack.js';
import './cases/functional-builds.js';
import './cases/integration-package.js';
import './cases/regression-stack.js';
import './cases/regression-es5.js';
import {run} from './harness.js';
import {validateCatalog} from './catalog.js';

validateCatalog(['unit','functional','integration','regression'],{complete:false});
run().then(result=>{
    if(!result.ok){
        process.exitCode=1;
    }
});
