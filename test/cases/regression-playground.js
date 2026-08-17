import {createPlayground} from '../../assets/playground.js';
import {equal,throws} from '../harness.js';
import {suiteCase} from '../catalog.js';

const regression=suiteCase('regression');

function unchangedAfter(playground,action,ErrorType,message){
    const before=playground.snapshot().source;
    throws(action,ErrorType,message);
    equal(playground.snapshot().source,before);
}

regression('R005','regression.playground.blank-label','blank custom labels are rejected without changing source',()=>{
    const playground=createPlayground();
    unchangedAfter(playground,()=>playground.add('   '),TypeError,'must not be empty');
});

regression('R006','regression.playground.long-label','overlong custom labels are rejected without changing source',()=>{
    const playground=createPlayground();
    unchangedAfter(playground,()=>playground.add('x'.repeat(61)),RangeError,'60 characters');
});

regression('R007','regression.playground.unknown-preset','unknown presets are rejected without changing source',()=>{
    const playground=createPlayground();
    unchangedAfter(playground,()=>playground.load('missing'),RangeError,'Unknown playground preset');
});

regression('R008','regression.playground.source-injection','hostile labels remain inert escaped string data',()=>{
    const playground=createPlayground();
    playground.setAutoRun(false);
    const hostile='\"); stack.clear(); // <script> \\ path\u2028next\u2029last';
    const state=playground.add(hostile,{autoHandoff:false});
    equal(state.source.includes('<script>'),false);
    equal(state.source.includes('\\u003cscript>'),true);
    equal(state.source.includes('\\u2028'),true);
    equal(state.source.includes('\\u2029'),true);
    equal(state.pending[0],hostile);
});
