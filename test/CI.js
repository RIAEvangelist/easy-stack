import Stack, {Stack as NamedStack} from '../stack.js';
import {deepEqual,equal,run,test,throws} from './harness.js';

test('exports the same Stack class by default and by name',()=>{
    equal(Stack,NamedStack);

    const stack=new Stack;
    equal(stack.autoRun,true);
    equal(stack.stop,false);
    equal(stack.running,false);
    equal(stack.size,0);
    deepEqual(stack.contents(),[]);
    deepEqual(stack.stack,[]);
});

test('runs added tasks in last-in-first-out order',()=>{
    const stack=new Stack;
    const order=[];

    stack.add(
        function(){ order.push('first added'); this.next(); },
        function(){ order.push('second added'); this.next(); },
        function(){ order.push('last added'); this.next(); }
    );

    deepEqual(order,['last added','second added','first added']);
    equal(stack.running,false);
    equal(stack.size,0);
});

test('supports manual flow when autoRun is disabled',()=>{
    const stack=new Stack;
    const order=[];
    stack.autoRun=false;

    const returned=stack.add(
        function(){ order.push(1); this.next(); },
        function(){ order.push(2); this.next(); }
    );

    equal(returned,stack);
    equal(stack.running,false);
    equal(stack.size,2);
    stack.next();
    deepEqual(order,[2,1]);
    equal(stack.running,false);
});

test('holds work behind stop and resumes explicitly',()=>{
    const stack=new Stack;
    const order=[];
    stack.stop=true;

    stack.add(
        function(){ order.push('bottom'); this.next(); },
        function(){ order.push('top'); this.next(); }
    );

    deepEqual(order,[]);
    equal(stack.size,2);
    stack.next();
    equal(stack.running,false);

    stack.stop=false;
    stack.next();
    deepEqual(order,['top','bottom']);
});

test('can pause from inside a task without losing lower work',()=>{
    const stack=new Stack;
    const order=[];

    stack.add(
        function(){ order.push('resume'); this.next(); },
        function(){
            order.push('pause');
            this.stop=true;
            this.next();
        }
    );

    deepEqual(order,['pause']);
    equal(stack.running,false);
    equal(stack.size,1);
    stack.stop=false;
    stack.next();
    deepEqual(order,['pause','resume']);
});

test('binds tasks to the stack and prioritizes additions made while active',()=>{
    const stack=new Stack;
    const order=[];

    stack.add(
        function(){ order.push('bottom'); this.next(); },
        function(){
            equal(this,stack);
            order.push('active');
            this.add(function(){ order.push('new top'); this.next(); });
            equal(this.size,2);
            this.next();
        }
    );

    deepEqual(order,['active','new top','bottom']);
    equal(stack.running,false);
});

test('clears pending work without interrupting the active task',()=>{
    const stack=new Stack;
    const order=[];
    let cleared;

    stack.add(
        function(){ order.push('removed'); this.next(); },
        function(){
            order.push('active');
            cleared=this.clear();
            this.next();
        }
    );

    deepEqual(cleared,[]);
    deepEqual(order,['active']);
    equal(stack.size,0);
    equal(stack.running,false);
});

test('reads and replaces contents through the method and stack alias',()=>{
    const stack=new Stack;
    const order=[];
    stack.autoRun=false;
    const replacement=[function(){ order.push('replacement'); this.next(); }];

    equal(stack.contents(replacement),replacement);
    equal(stack.contents(),replacement);
    equal(stack.stack,replacement);
    equal(stack.size,1);
    stack.next();
    deepEqual(order,['replacement']);

    const alias=[function(){ order.push('alias'); this.next(); }];
    stack.stack=alias;
    stack.next();
    deepEqual(order,['replacement','alias']);
    throws(()=>stack.contents({}),TypeError,'array of functions');
    throws(()=>{ stack.stack=[()=>{},null]; },TypeError,'index 1');
});

test('rejects invalid tasks atomically',()=>{
    const stack=new Stack;
    throws(()=>stack.add(()=>{},42),TypeError,'index 1');
    equal(stack.size,0);
    equal(stack.running,false);
});

test('rejects invalid tasks introduced through the live stack array',()=>{
    const stack=new Stack;
    stack.autoRun=false;
    stack.stack.push(null);

    throws(()=>stack.next(),TypeError,'must be a function');
    equal(stack.running,false);
    equal(stack.size,0);
});

test('returns to an idle recoverable state when a task throws',()=>{
    const stack=new Stack;
    const expected=new Error('task failed');
    const order=[];
    stack.autoRun=false;
    stack.add(
        function(){ order.push('recovered'); this.next(); },
        function(){ throw expected; }
    );

    equal(throws(()=>stack.next()),expected);
    equal(stack.running,false);
    equal(stack.size,1);
    stack.next();
    deepEqual(order,['recovered']);
});

test('preserves LIFO priority across asynchronous hand-offs',async()=>{
    const stack=new Stack;
    const order=[];

    await new Promise(resolve=>{
        stack.add(
            function(){
                order.push('lower task');
                this.next();
                resolve();
            },
            function(){
                order.push('top started');
                setTimeout(()=>{
                    order.push('top finished');
                    this.next();
                },0);
            }
        );
    });

    deepEqual(order,['top started','top finished','lower task']);
    equal(stack.running,false);
});

test('treats next on an empty stack as an idle no-op',()=>{
    const stack=new Stack;
    equal(stack.next(),undefined);
    equal(stack.running,false);
    equal(stack.size,0);
});

test('keeps instances isolated and accepts an empty add batch',()=>{
    const first=new Stack;
    const second=new Stack;
    first.autoRun=false;
    second.autoRun=false;

    equal(first.add(),first);
    first.add(function(){});

    equal(first.size,1);
    equal(second.size,0);
    equal(first.stack === second.stack,false);
});

test('ignores task return values and keeps cooperative control explicit',()=>{
    const stack=new Stack;
    stack.autoRun=false;
    stack.add(function(){ return 'ignored'; });

    equal(stack.next(),undefined);
    equal(stack.running,true);
    stack.next();
    equal(stack.running,false);
});

export default run;
