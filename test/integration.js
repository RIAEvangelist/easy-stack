import './cases/integration-package.js';
import './cases/integration-docs.js';
import './cases/integration-server.js';
import './cases/integration-replay.js';
import {run} from './harness.js';
import {validateCatalog} from './catalog.js';

validateCatalog(['integration']);
run().then(result=>{
    if(!result.ok){
        process.exitCode=1;
    }
});
