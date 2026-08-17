import Stack from '../../stack.js';
import {deepEqual,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const unit=suiteCase('unit');

unit('U014','stack.add.nonempty-return','nonempty add returns the receiver',()=>{
    const stack=new Stack();
    stack.autoRun=false;
    equal(stack.add(function(){}),stack);
    equal(stack.size,1);
});

unit('U015','stack.contents.execution','contents replacement participates in the next hand-off',()=>{
    const stack=new Stack();
    const trace=[];
    stack.contents([function(){
        trace.push('contents');
        this.next();
    }]);
    stack.next();
    deepEqual(trace,['contents']);
    equal(stack.running,false);
});

unit('U016','stack.alias.execution','stack alias replacement participates in the next hand-off',()=>{
    const stack=new Stack();
    const trace=[];
    stack.stack=[function(){
        trace.push('alias');
        this.next();
    }];
    stack.next();
    deepEqual(trace,['alias']);
    equal(stack.running,false);
});
