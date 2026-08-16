import {createPlayground} from '../assets/playground.js';
import {deepEqual,equal,run,test,throws} from './harness.js';

test('the cooperative preset displays and drains strict LIFO order',()=>{
    const playground=createPlayground();
    let state=playground.load('cooperative');

    deepEqual(state.pending,['newest','second','first']);
    deepEqual(state.trace,[]);
    equal(state.autoRun,false);
    equal(state.running,false);

    state=playground.next();
    deepEqual(state.trace,['newest','second','first']);
    deepEqual(state.pending,[]);
    equal(state.size,0);
    equal(state.running,false);
});

test('manual tasks require one explicit hand-off per transition',()=>{
    const playground=createPlayground();
    playground.load('manual');

    let state=playground.next();
    deepEqual(state.trace,['newest']);
    deepEqual(state.pending,['second','first']);
    equal(state.running,true);

    state=playground.next();
    deepEqual(state.trace,['newest','second']);
    deepEqual(state.pending,['first']);

    state=playground.next();
    deepEqual(state.trace,['newest','second','first']);
    equal(state.size,0);
    equal(state.running,true);

    state=playground.next();
    equal(state.running,false);
    equal(state.lastAction,'An empty hand-off marked the stack idle.');
});

test('stopped work remains pending until stop is released and next is selected',()=>{
    const playground=createPlayground();
    let state=playground.load('stopped');

    equal(state.autoRun,true);
    state=playground.next();
    deepEqual(state.pending,['newest','second','first']);
    deepEqual(state.trace,[]);
    equal(state.stop,true);

    state=playground.setStop(false);
    deepEqual(state.trace,[]);
    equal(state.stop,false);

    state=playground.next();
    deepEqual(state.trace,['newest','second','first']);
    equal(state.running,false);
});

test('clear preserves flags and activity while reset restores constructor defaults',()=>{
    const playground=createPlayground();
    playground.load('manual');
    playground.next();
    playground.setAutoRun(true);
    playground.setStop(true);

    let state=playground.clear();
    equal(state.size,0);
    equal(state.running,true);
    equal(state.autoRun,true);
    equal(state.stop,true);
    deepEqual(state.trace,['newest']);

    state=playground.reset();
    equal(state.size,0);
    equal(state.running,false);
    equal(state.autoRun,true);
    equal(state.stop,false);
    deepEqual(state.trace,[]);
});

test('custom tasks are validated and displayed newest-first',()=>{
    const playground=createPlayground();
    playground.setAutoRun(false);
    playground.add('older',{autoHandoff:false});
    const state=playground.add('newest',{autoHandoff:false});

    deepEqual(state.pending,['newest','older']);
    throws(()=>playground.add('   '),TypeError,'must not be empty');
    throws(()=>playground.add('x'.repeat(61)),RangeError,'60 characters');
    throws(()=>playground.load('missing'),RangeError,'Unknown playground preset');
});

test('autoRun applies synchronously to new work without starting an existing batch',()=>{
    const playground=createPlayground();
    let state=playground.load('manual');

    state=playground.setAutoRun(true);
    deepEqual(state.trace,[]);
    deepEqual(state.pending,['newest','second','first']);

    state=playground.reset();
    state=playground.add('cooperative',{autoHandoff:true});
    deepEqual(state.trace,['cooperative']);
    equal(state.size,0);
    equal(state.running,false);

    state=playground.reset();
    state=playground.add('manual',{autoHandoff:false});
    deepEqual(state.trace,['manual']);
    equal(state.size,0);
    equal(state.running,true);
});

await run();
