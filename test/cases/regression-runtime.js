import fs from 'node:fs';
import {equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const regression=suiteCase('regression');
const root=new URL('../../',import.meta.url);

regression('R015','regression.runtime.weakmap-state','shipped modern runtimes keep private state off WeakMap',()=>{
    for(const file of ['stack.js','stack-vanilla.js']){
        const source=fs.readFileSync(new URL(file,root),'utf8');
        equal(source.includes('WeakMap'),false,`${file} restored WeakMap state.`);
        equal(source.includes('#stack'),true,`${file} lost private stack state.`);
        equal(source.includes('#running'),true,`${file} lost private runner state.`);
    }
});
