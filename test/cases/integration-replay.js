import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createPlayground} from '../../assets/playground.js';
import {prepareSource} from '../../playground/runtime.js';
import {deepEqual,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const integration=suiteCase('integration');
const root=new URL('../../',import.meta.url);
const stackModuleSource=fs.readFileSync(new URL('stack.js',root),'utf8');

integration('I028','playground.replay.execution','prepared source executes to the same visible snapshot',()=>{
    const playground=createPlayground();
    playground.load('manual');
    playground.next();
    playground.setStop(true);
    playground.add('new task',{autoHandoff:false});
    const state=playground.snapshot();
    const prepared=prepareSource(state.source,stackModuleSource);
    const replay=spawnSync(process.execPath,['--input-type=module','--eval',prepared],{
        cwd:fileURLToPath(root),
        encoding:'utf8'
    });

    equal(replay.status,0,replay.stderr);
    deepEqual(JSON.parse(replay.stdout),{
        autoRun:state.autoRun,
        pending:state.pending,
        running:state.running,
        size:state.size,
        stop:state.stop,
        trace:state.trace
    });
});
