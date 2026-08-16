import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import Stack from '../stack.js';
import {deepEqual,equal,run,test} from './harness.js';

const require=createRequire(import.meta.url);
const packageData=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const packageLock=JSON.parse(fs.readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));

function exerciseStack(StackType){
    const stack=new StackType;
    const order=[];
    stack.add(
        function(){ order.push('a'); this.next(); },
        function(){ order.push('b'); this.next(); }
    );
    return {order,running:stack.running,size:stack.size};
}

test('package self-reference resolves ESM and CommonJS consumers',async()=>{
    const imported=await import('easy-stack');
    const required=require('easy-stack');
    equal(imported.default,Stack);
    equal(imported.Stack,Stack);
    equal(required,required.Stack);
    deepEqual(exerciseStack(imported.default),exerciseStack(required));
});

test('documented stack deep paths preserve conditional compatibility',async()=>{
    const imported=await import('easy-stack/stack.js');
    const required=require('easy-stack/stack.js');
    const legacyRequired=require('easy-stack/es5.js');
    deepEqual(exerciseStack(imported.default),exerciseStack(required));
    deepEqual(exerciseStack(required),exerciseStack(legacyRequired));
});

test('classic browser paths publish a working global Stack',()=>{
    for(const file of ['stack-vanilla.js','es5.js']){
        const source=fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
        const context={};
        vm.runInNewContext(source,context,{filename:file});
        equal(typeof context.Stack,'function');
        deepEqual(exerciseStack(context.Stack),{order:['b','a'],running:false,size:0});
    }
});

test('the ES5 build ignores inherited enumerable argument properties',()=>{
    const source=fs.readFileSync(new URL('../es5.js',import.meta.url),'utf8');
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

test('the ES5 build remains safe when called without new',()=>{
    const source=fs.readFileSync(new URL('../es5.js',import.meta.url),'utf8');
    const context={};
    vm.runInNewContext(source,context,{filename:'es5.js'});
    const stack=context.Stack();

    equal(stack instanceof context.Stack,true);
    equal(stack.size,0);
});

test('every public build preserves active LIFO priority',async()=>{
    const imported=await import('easy-stack');
    const required=require('easy-stack');

    for(const StackType of [imported.default,required]){
        const stack=new StackType;
        const order=[];
        stack.add(
            function(){ order.push('bottom'); this.next(); },
            function(){
                order.push('active');
                this.add(function(){ order.push('new top'); this.next(); });
                this.next();
            }
        );
        deepEqual(order,['active','new top','bottom']);
    }
});

test('package metadata exposes only supported public contracts',()=>{
    equal(packageData.version,'2.0.0');
    equal(packageData.type,'module');
    deepEqual(packageData.sideEffects,['./stack-vanilla.js','./es5.js']);
    equal(packageData.devDependencies['vanilla-test'],'2.1.1');
    equal(packageData.engines.node,'>=12.22.0');
    equal(packageLock.packages[''].engines.node,packageData.engines.node);
    equal(packageData.exports['.'].import,'./stack.js');
    equal(packageData.exports['.'].require,'./stack.cjs');
    equal(packageData.exports['./es5.js'].require,'./stack.cjs');
    equal(packageData.homepage,'https://riaevangelist.github.io/easy-stack/');
    equal(packageData.dependencies,undefined);
    equal(packageData.directories,undefined);
    deepEqual(packageData.files,[
        'stack.js',
        'stack.cjs',
        'stack-vanilla.js',
        'es5.js',
        'CHANGELOG.md',
        'MIGRATION.md',
        'licence'
    ]);
});

run().then(result=>{
    if(!result.ok){
        process.exitCode=1;
    }
});
