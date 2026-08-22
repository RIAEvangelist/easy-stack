import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const selection=process.argv[2] || 'all';
const suites={
    all:['test/unit.js','test/functional.js','test/integration.js','test/regression.js'],
    browser:['test/regression-browser.js'],
    functional:['test/functional.js'],
    integration:['test/integration.js'],
    regression:['test/regression.js'],
    unit:['test/unit.js']
};

if(!Object.prototype.hasOwnProperty.call(suites,selection)){
    console.error(`Unknown test selection: ${selection}`);
    process.exitCode=2;
}else{
    for(const file of suites[selection]){
        const result=spawnSync(process.execPath,[file],{
            cwd:fileURLToPath(new URL('../',import.meta.url)),
            env:process.env,
            stdio:'inherit'
        });

        if(result.error){
            throw result.error;
        }

        if(result.status !== 0){
            process.exitCode=result.status || 1;
            break;
        }
    }
}
