import fs from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import Stack from '../../stack.js';
import {deepEqual,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const integration=suiteCase('integration');
const require=createRequire(import.meta.url);
const root=new URL('../../',import.meta.url);
const packageData=JSON.parse(fs.readFileSync(new URL('package.json',root),'utf8'));
const packageLock=JSON.parse(fs.readFileSync(new URL('package-lock.json',root),'utf8'));

function browserStack(file){
    const context={};
    vm.runInNewContext(fs.readFileSync(new URL(file,root),'utf8'),context,{filename:file});
    return context.Stack;
}

integration('I001','package.entry.esm-root','package root resolves ESM default and named identity',async()=>{
    const imported=await import('easy-stack');
    equal(imported.default,Stack);
    equal(imported.Stack,Stack);
});

integration('I002','package.entry.cjs-root','package root resolves the CommonJS constructor identity',()=>{
    const required=require('easy-stack');
    equal(required,required.Stack);
    equal(required,require('../../stack.js'));
    equal(required,Stack);
});

integration('I003','package.entry.deep-stack','documented stack deep path maps to each root build',async()=>{
    const importedRoot=await import('easy-stack');
    const importedDeep=await import('easy-stack/stack.js');
    equal(importedDeep.default,importedRoot.default);
    equal(importedDeep.Stack,importedRoot.Stack);
    equal(require('easy-stack/stack.js'),require('easy-stack'));
});

integration('I004','package.entry.es5-require','ES5 require condition maps to the shared module build',()=>{
    equal(require('easy-stack/es5.js'),require('easy-stack'));
});

integration('I005','package.entry.classic-global','classic browser build exposes the Stack global',()=>{
    equal(typeof browserStack('stack-vanilla.js'),'function');
});

integration('I006','package.entry.es5-global','ES5 browser build exposes the Stack global',()=>{
    equal(typeof browserStack('es5.js'),'function');
});

integration('I007','package.metadata.runtime','manifest declares the shared runtime and Node floor',()=>{
    equal(packageData.version,'2.1.0');
    equal(packageData.type,'module');
    equal(packageData.main,'./stack.js');
    equal(packageData.module,'./stack.js');
    equal(packageData.engines.node,'>=22.13.0');
});

integration('I008','package.metadata.lock-engine','lockfile mirrors the manifest Node floor',()=>{
    equal(packageLock.packages[''].engines.node,packageData.engines.node);
});

integration('I009','package.metadata.exports','exports and side effects expose only supported builds',()=>{
    equal(packageData.exports['.'].import,'./stack.js');
    equal(packageData.exports['.'].require,'./stack.js');
    equal(packageData.exports['./stack.js'].import,'./stack.js');
    equal(packageData.exports['./es5.js'].require,'./stack.js');
    deepEqual(packageData.sideEffects,['./stack-vanilla.js','./es5.js']);
});

integration('I010','package.metadata.dependencies','vanilla-test is pinned dev-only with zero runtime dependencies',()=>{
    equal(packageData.devDependencies['vanilla-test'],'2.1.1');
    equal(packageData.dependencies,undefined);
});

integration('I011','package.metadata.publish','publish whitelist and Pages homepage are exact',()=>{
    deepEqual(packageData.files,[
        'stack.js',
        'stack-vanilla.js',
        'es5.js',
        'CHANGELOG.md',
        'MIGRATION.md',
        'licence'
    ]);
    equal(packageData.homepage,'https://riaevangelist.github.io/easy-stack/');
    equal(packageData.directories,undefined);
});
