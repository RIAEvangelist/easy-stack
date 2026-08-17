import {createPlayground} from '../../assets/playground.js';
import {deepEqual,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const functional=suiteCase('functional');

functional('F009','playground.cooperative.pending','cooperative preset displays pending work newest-first',()=>{
    const state=createPlayground().load('cooperative');
    deepEqual(state.pending,['newest','second','first']);
    deepEqual(state.trace,[]);
    equal(state.autoRun,false);
});

functional('F010','playground.cooperative.drain','cooperative Next drains the complete LIFO batch',()=>{
    const playground=createPlayground();
    playground.load('cooperative');
    const state=playground.next();
    deepEqual(state.trace,['newest','second','first']);
    deepEqual(state.pending,[]);
    equal(state.running,false);
});

functional('F011','playground.manual.step','manual Next advances exactly one task',()=>{
    const playground=createPlayground();
    playground.load('manual');
    let state=playground.next();
    deepEqual(state.trace,['newest']);
    deepEqual(state.pending,['second','first']);
    equal(state.running,true);

    state=playground.next();
    deepEqual(state.trace,['newest','second']);
    deepEqual(state.pending,['first']);
    equal(state.running,true);

    state=playground.next();
    deepEqual(state.trace,['newest','second','first']);
    deepEqual(state.pending,[]);
    equal(state.running,true);
});

functional('F012','playground.manual.idle','an extra manual hand-off marks a completed stack idle',()=>{
    const playground=createPlayground();
    playground.load('manual');
    playground.next();
    playground.next();
    playground.next();
    const state=playground.next();
    deepEqual(state.trace,['newest','second','first']);
    equal(state.running,false);
    equal(state.lastAction,'An empty hand-off marked the stack idle.');
});

functional('F013','playground.stopped.block','stopped preset blocks explicit Next',()=>{
    const playground=createPlayground();
    playground.load('stopped');
    const state=playground.next();
    equal(state.autoRun,true);
    equal(state.stop,true);
    deepEqual(state.trace,[]);
    deepEqual(state.pending,['newest','second','first']);
});

functional('F014','playground.stopped.release','releasing stop alone does not execute pending work',()=>{
    const playground=createPlayground();
    playground.load('stopped');
    const state=playground.setStop(false);
    equal(state.stop,false);
    deepEqual(state.trace,[]);
    equal(state.size,3);
});

functional('F015','playground.stopped.resume','Next after release drains cooperative work',()=>{
    const playground=createPlayground();
    playground.load('stopped');
    playground.setStop(false);
    const state=playground.next();
    deepEqual(state.trace,['newest','second','first']);
    equal(state.size,0);
    equal(state.running,false);
});

functional('F016','playground.clear.state','clear preserves flags, activity, and trace',()=>{
    const playground=createPlayground();
    playground.load('manual');
    playground.next();
    playground.setAutoRun(true);
    playground.setStop(true);
    const state=playground.clear();
    equal(state.size,0);
    equal(state.running,true);
    equal(state.autoRun,true);
    equal(state.stop,true);
    deepEqual(state.trace,['newest']);
});

functional('F017','playground.reset.state','reset restores constructor defaults',()=>{
    const playground=createPlayground();
    playground.load('manual');
    playground.next();
    playground.setStop(true);
    const state=playground.reset();
    equal(state.size,0);
    equal(state.running,false);
    equal(state.autoRun,true);
    equal(state.stop,false);
    deepEqual(state.trace,[]);
});

functional('F018','playground.custom.order','custom tasks display newest-first',()=>{
    const playground=createPlayground();
    playground.setAutoRun(false);
    playground.add('older',{autoHandoff:false});
    const state=playground.add('newest',{autoHandoff:false});
    deepEqual(state.pending,['newest','older']);
});

functional('F019','playground.autorun.existing','enabling autoRun does not start an existing batch',()=>{
    const playground=createPlayground();
    playground.load('manual');
    const state=playground.setAutoRun(true);
    deepEqual(state.trace,[]);
    deepEqual(state.pending,['newest','second','first']);
});

functional('F020','playground.autorun.cooperative','new cooperative work auto-runs to idle',()=>{
    const playground=createPlayground();
    const state=playground.add('cooperative',{autoHandoff:true});
    deepEqual(state.trace,['cooperative']);
    equal(state.size,0);
    equal(state.running,false);
});

functional('F021','playground.autorun.manual','new manual work auto-runs and remains active',()=>{
    const playground=createPlayground();
    const state=playground.add('manual',{autoHandoff:false});
    deepEqual(state.trace,['manual']);
    equal(state.size,0);
    equal(state.running,true);
});

functional('F022','playground.source.preset','generated source records preset flags before additions',()=>{
    const source=createPlayground().load('stopped').source;
    equal(source.indexOf('stack.autoRun=true;') < source.indexOf('stack.add('),true);
    equal(source.indexOf('stack.stop=true;') < source.indexOf('stack.add('),true);
    equal((source.match(/stack\.add\(/g) || []).length,3);
    equal(source.includes('makeTask("newest", true)'),true);
});

functional('F023','playground.source.actions','generated source appends control actions in order',()=>{
    const playground=createPlayground();
    playground.load('stopped');
    playground.setStop(false);
    playground.next();
    const source=playground.clear().source;
    equal(source.lastIndexOf('stack.stop=false;') > source.lastIndexOf('stack.add('),true);
    equal(source.lastIndexOf('stack.next();') > source.lastIndexOf('stack.stop=false;'),true);
    equal(source.lastIndexOf('stack.clear();') > source.lastIndexOf('stack.next();'),true);
});

functional('F024','playground.source.reset','reset discards generated operation history',()=>{
    const playground=createPlayground();
    playground.load('cooperative');
    playground.next();
    playground.clear();
    const source=playground.reset().source;
    equal(source.includes('stack.clear();'),false);
    equal(source.includes('makeTask("newest"'),false);
    equal(source.includes('resetPlayground();'),true);
});
