import './cases/unit-stack.js';
import './cases/unit-stack-operations.js';
import './cases/functional-stack.js';
import './cases/regression-stack.js';
import {run} from './harness.js';
import {validateCatalog} from './catalog.js';

function coverage(){
    validateCatalog(['unit','functional','regression'],{complete:false});
    return run();
}

export default coverage;
