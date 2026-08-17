import Stack, {Stack as NamedStack} from '../../stack.js';
import {deepEqual,equal,throws} from '../harness.js';
import {suiteCase} from '../catalog.js';

const unit=suiteCase('unit');

unit('U001','stack.constructor.defaults','constructor exposes the documented empty state',()=>{
    equal(Stack,NamedStack);
    const stack=new Stack();
    equal(stack.autoRun,true);
    equal(stack.stop,false);
    equal(stack.running,false);
    equal(stack.size,0);
    deepEqual(stack.contents(),[]);
    equal(stack.contents(),stack.stack);
});

unit('U002','stack.add.empty','empty add returns the receiver without scheduling',()=>{
    const stack=new Stack();
    equal(stack.add(),stack);
    equal(stack.running,false);
    equal(stack.size,0);
});

unit('U003','stack.next.empty','empty next is an idle no-op',()=>{
    const stack=new Stack();
    equal(stack.next(),undefined);
    equal(stack.running,false);
    equal(stack.size,0);
});

unit('U004','stack.task.binding','a selected task receives its Stack as this',()=>{
    const stack=new Stack();
    let receiver;
    stack.add(function(){
        receiver=this;
        this.next();
    });
    equal(receiver,stack);
});

unit('U005','stack.task.return','task return values do not perform a hand-off',()=>{
    const stack=new Stack();
    stack.autoRun=false;
    stack.add(function(){ return 'ignored'; });
    equal(stack.next(),undefined);
    equal(stack.running,true);
    stack.next();
    equal(stack.running,false);
});

unit('U006','stack.instance.isolation','instances keep separate live storage',()=>{
    const first=new Stack();
    const second=new Stack();
    first.autoRun=false;
    second.autoRun=false;
    first.add(function(){});
    equal(first.size,1);
    equal(second.size,0);
    equal(first.stack === second.stack,false);
});

unit('U007','stack.contents.reference','contents preserves a supplied replacement array',()=>{
    const stack=new Stack();
    const replacement=[function(){}];
    equal(stack.contents(replacement),replacement);
    equal(stack.contents(),replacement);
    equal(stack.size,1);
});

unit('U008','stack.alias.reference','stack alias preserves a supplied replacement array',()=>{
    const stack=new Stack();
    const replacement=[function(){}];
    stack.stack=replacement;
    equal(stack.stack,replacement);
    equal(stack.contents(),replacement);
});

unit('U009','stack.add.validation.atomic','invalid add batches are rejected atomically',()=>{
    const stack=new Stack();
    throws(()=>stack.add(()=>{},42),TypeError,'index 1');
    equal(stack.size,0);
    equal(stack.running,false);
});

unit('U010','stack.contents.validation.type','contents rejects non-array replacement values',()=>{
    const stack=new Stack();
    throws(()=>stack.contents({}),TypeError,'array of functions');
    equal(stack.size,0);
});

unit('U011','stack.alias.validation.member','stack setter rejects a nonfunction member',()=>{
    const stack=new Stack();
    const original=stack.stack;
    throws(()=>{ stack.stack=[()=>{},null]; },TypeError,'index 1');
    equal(stack.stack,original);
    equal(stack.size,0);
});
