import Stack from '../../stack.js';
import {deepEqual,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const functional=suiteCase('functional');

functional('F001','stack.flow.lifo','cooperative batches run strict LIFO and drain',()=>{
    const stack=new Stack();
    const order=[];
    stack.add(
        function(){ order.push('first'); this.next(); },
        function(){ order.push('second'); this.next(); },
        function(){ order.push('newest'); this.next(); }
    );
    deepEqual(order,['newest','second','first']);
    equal(stack.size,0);
    equal(stack.running,false);
});

functional('F002','stack.flow.manual','autoRun false waits for an explicit hand-off',()=>{
    const stack=new Stack();
    const order=[];
    stack.autoRun=false;
    stack.add(
        function(){ order.push('older'); this.next(); },
        function(){ order.push('newest'); this.next(); }
    );
    deepEqual(order,[]);
    equal(stack.size,2);
    stack.next();
    deepEqual(order,['newest','older']);
    equal(stack.running,false);
});

functional('F003','stack.flow.stop','stop holds work until release and explicit Next',()=>{
    const stack=new Stack();
    const order=[];
    stack.stop=true;
    stack.add(function(){ order.push('ran'); this.next(); });
    stack.next();
    deepEqual(order,[]);
    equal(stack.size,1);
    stack.stop=false;
    deepEqual(order,[]);
    stack.next();
    deepEqual(order,['ran']);
});

functional('F004','stack.flow.pause','a task can pause and later resume downstream work',()=>{
    const stack=new Stack();
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
    equal(stack.size,1);
    stack.stop=false;
    stack.next();
    deepEqual(order,['pause','resume']);
});

functional('F005','stack.flow.active-insertion','active insertion runs before older pending work',()=>{
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
    deepEqual(order,['active','inserted','older']);
    equal(stack.running,false);
});

functional('F006','stack.flow.clear-active','clear removes pending work without interrupting the active task',()=>{
    const stack=new Stack();
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
    deepEqual(order,['active']);
    equal(cleared,stack.stack);
    deepEqual(cleared,[]);
    equal(stack.running,false);
});

functional('F007','stack.flow.async','asynchronous hand-offs preserve pending priority',async()=>{
    const stack=new Stack();
    const order=[];
    await new Promise(resolve=>{
        stack.add(
            function(){
                order.push('lower');
                this.next();
                resolve();
            },
            function(){
                order.push('started');
                setTimeout(()=>{
                    order.push('finished');
                    this.next();
                },0);
            }
        );
    });
    deepEqual(order,['started','finished','lower']);
    equal(stack.running,false);
});
