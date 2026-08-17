import Stack from '../../stack.js';
import {deepEqual,equal,throws} from '../harness.js';
import {suiteCase} from '../catalog.js';

const regression=suiteCase('regression');

regression('R001','regression.live-array.invalid','invalid live-array tasks throw and return the runner to idle',()=>{
    const stack=new Stack();
    stack.autoRun=false;
    stack.stack.push(null);
    throws(()=>stack.next(),TypeError,'must be a function');
    equal(stack.running,false);
    equal(stack.size,0);
});

regression('R002','regression.callback.recovery','thrown callbacks idle the runner and preserve lower work',()=>{
    const stack=new Stack();
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
