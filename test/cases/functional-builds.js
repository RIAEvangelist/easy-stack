import fs from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {deepEqual,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const functional=suiteCase('functional');
const root=new URL('../../',import.meta.url);
const require=createRequire(import.meta.url);

function browserStack(file){
    const context={globalThis:null,self:null,window:null};
    context.globalThis=context;
    context.self=context;
    context.window=context;
    vm.runInNewContext(fs.readFileSync(new URL(file,root),'utf8'),context,{filename:file});
    return context.Stack;
}

function activeInsertion(Stack){
    const stack=new Stack();
    const order=[];
    stack.add(
        function(){ order.push('older'); this.next(); },
        function(){
            order.push('active');
            this.add(function(){ order.push('inserted'); this.next(); });
            this.next();
        }
    );
    return {order,running:stack.running,size:stack.size};
}

functional('F008','builds.flow.parity','non-ESM public builds preserve active-insertion priority',()=>{
    const builds=[
        ['CommonJS',require('../../stack.js')],
        ['classic browser',browserStack('stack-vanilla.js')],
        ['ES5 browser',browserStack('es5.js')]
    ];

    for(const [label,Stack] of builds){
        equal(typeof Stack,'function',`${label} did not expose Stack.`);
        const result=activeInsertion(Stack);
        deepEqual(result.order,['active','inserted','older'],`${label} changed priority.`);
        equal(result.size,0,`${label} left work pending.`);
        equal(result.running,false,`${label} did not become idle.`);
    }
});
