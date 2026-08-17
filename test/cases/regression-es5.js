import fs from 'node:fs';
import vm from 'node:vm';
import {deepEqual,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const regression=suiteCase('regression');
const source=fs.readFileSync(new URL('../../es5.js',import.meta.url),'utf8');

regression('R003','regression.es5.inherited-arguments','ES5 add ignores inherited enumerable argument properties',()=>{
    const context={order:[]};
    vm.createContext(context);
    vm.runInContext(source,context,{filename:'es5.js'});
    vm.runInContext(`
        Object.prototype.injectedTask=function(){ order.push('injected'); };
        var stack=new Stack();
        stack.autoRun=false;
        stack.add(function(){ order.push('real'); this.next(); });
        stack.next();
        delete Object.prototype.injectedTask;
    `,context);
    deepEqual(context.order,['real']);
});

regression('R004','regression.es5.without-new','ES5 Stack remains safe when called without new',()=>{
    const context={};
    vm.runInNewContext(source,context,{filename:'es5.js'});
    const stack=context.Stack();
    equal(stack instanceof context.Stack,true);
    equal(stack.size,0);
});
