import {prepareSource} from '../../playground/runtime.js';
import {equal,throws} from '../harness.js';
import {suiteCase} from '../catalog.js';

const unit=suiteCase('unit');
const stackSource='export default class Stack {}';

unit('U012','playground.import.requirement','source preparation requires the canonical package import',()=>{
    throws(()=>prepareSource('console.log("missing import");',stackSource),SyntaxError,'must begin');
    throws(()=>prepareSource(null,stackSource),TypeError,'must be a string');
    throws(()=>prepareSource("import Stack from 'easy-stack';",''),TypeError,'unavailable');
});

unit('U013','playground.import.rewrite','source preparation maps the package import to checked-in source',()=>{
    const prepared=prepareSource("import Stack from 'easy-stack';\nconsole.log(Stack);",stackSource);
    equal(prepared.includes("from 'easy-stack'"),false);
    equal(prepared.includes('data:text/javascript;charset=utf-8,'),true);
    equal(prepared.includes(encodeURIComponent(stackSource)),true);
    equal(prepared.endsWith('console.log(Stack);'),true);
});
