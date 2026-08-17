import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {deepEqual,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const integration=suiteCase('integration');
const root=new URL('../../',import.meta.url);
const primaryPages=[
    'index.html',
    'guide/index.html',
    'api/index.html',
    'patterns/index.html',
    'browser/index.html',
    'examples/index.html',
    'playground/index.html',
    'queue/index.html',
    'migration/index.html',
    'testing/index.html'
];
const suitePages=[
    'testing/unit/index.html',
    'testing/functional/index.html',
    'testing/integration/index.html',
    'testing/regression/index.html'
];
const allPages=[...primaryPages,...suitePages];

function read(relativePath){
    return fs.readFileSync(new URL(relativePath,root),'utf8');
}

function localTargets(source){
    const targets=[];
    const pattern=/(?:href|src)="([^"]+)"/g;
    let match;
    while((match=pattern.exec(source))){
        if(!/^(?:https?:|mailto:|data:)/i.test(match[1])){
            targets.push(match[1]);
        }
    }
    return targets;
}

function targetExists(pageName,target){
    const base=new URL(pageName,root);
    const [pathPart,fragment]=target.split('#');
    let resolved=new URL(pathPart || base.href,base);
    if(resolved.pathname.endsWith('/')){
        resolved=new URL('index.html',resolved);
    }
    if(!fs.existsSync(resolved)){
        return false;
    }
    if(!fragment){
        return true;
    }
    return fs.readFileSync(resolved,'utf8').includes(`id="${decodeURIComponent(fragment)}"`);
}

let catalogCache;
function catalog(){
    if(!catalogCache){
        const result=spawnSync(process.execPath,['scripts/test-catalog.js','--json'],{
            cwd:new URL('../../',import.meta.url),
            encoding:'utf8'
        });
        equal(result.status,0,result.stderr);
        catalogCache=JSON.parse(result.stdout);
    }
    return catalogCache;
}

integration('I012','docs.pages.structure','ten primary pages and four suite catalogs exist',()=>{
    const missing=allPages.filter(name=>!fs.existsSync(new URL(name,root)));
    deepEqual(missing,[]);
    equal(primaryPages.length,10);
    equal(suitePages.length,4);
});

integration('I013','docs.pages.sections','every page exposes its focused section contract',()=>{
    const required={
        'index.html':['overview','guarantees','routes'],
        'guide/index.html':['start','install','first-stack','model'],
        'api/index.html':['api','methods','state'],
        'patterns/index.html':['patterns','priority','gates','errors'],
        'browser/index.html':['browser','esm','classic','serve'],
        'examples/index.html':['examples','try-playground','recipes'],
        'playground/index.html':['playground','controls','code','pending','trace'],
        'queue/index.html':['queue','comparison','choice'],
        'migration/index.html':['migration','changes','checklist'],
        'testing/index.html':['testing','suites','counting','coverage','ci'],
        'testing/unit/index.html':['suite','catalog','run'],
        'testing/functional/index.html':['suite','catalog','run'],
        'testing/integration/index.html':['suite','catalog','run'],
        'testing/regression/index.html':['suite','catalog','run']
    };

    for(const [name,ids] of Object.entries(required)){
        const source=read(name);
        deepEqual(ids.filter(id=>!source.includes(`id="${id}"`)),[],`${name} is missing a required section.`);
    }
});

integration('I014','docs.links.local','every local link, asset, and fragment resolves',()=>{
    const missing=[];
    for(const pageName of [...allPages,'playground/frame.html']){
        for(const target of localTargets(read(pageName))){
            if(!targetExists(pageName,target)){
                missing.push(`${pageName} -> ${target}`);
            }
        }
    }
    deepEqual(missing,[],'Missing local documentation targets.');
});

integration('I015','docs.navigation.routes','every page navigation links all ten primary routes',()=>{
    const expected=primaryPages.map(name=>new URL(name,root).href).sort();
    for(const pageName of allPages){
        const source=read(pageName);
        const navigation=source.match(/<nav[^>]+data-site-nav[^>]*>[\s\S]*?<\/nav>/);
        equal(Boolean(navigation),true,`${pageName} is missing primary navigation.`);
        const base=new URL(pageName,root);
        const targets=localTargets(navigation[0]).map(target=>{
            let resolved=new URL(target,base);
            if(resolved.pathname.endsWith('/')){
                resolved=new URL('index.html',resolved);
            }
            return resolved.href;
        }).sort();
        deepEqual(targets,expected,`${pageName} does not link every primary route.`);
    }
});

integration('I016','docs.navigation.current','every page navigation marks exactly one current route',()=>{
    for(const pageName of allPages){
        const navigation=read(pageName).match(/<nav[^>]+data-site-nav[^>]*>[\s\S]*?<\/nav>/);
        equal((navigation[0].match(/aria-current="page"/g) || []).length,1,`${pageName} must identify one current route.`);
    }
});

integration('I017','docs.readme.routing','README starts with the header and routes to focused docs',()=>{
    const readme=read('README.md');
    equal(readme.startsWith('[![easy-stack — explicit LIFO flow control for JavaScript](https://raw.githubusercontent.com/RIAEvangelist/easy-stack/main/assets/easy-stack-header.png)](https://riaevangelist.github.io/easy-stack/)'),true);
    for(const path of ['guide/','api/','patterns/','browser/','examples/','playground/','testing/']){
        equal(readme.includes(`https://riaevangelist.github.io/easy-stack/${path}`),true,`README omits ${path}.`);
    }
});

integration('I018','docs.header.geometry','hero CSS and repository header preserve panoramic geometry',()=>{
    equal(/\.hero__visual img\s*\{[^}]*height:\s*auto;/s.test(read('assets/site.css')),true);
    const image=fs.readFileSync(new URL('assets/easy-stack-header.png',root));
    equal(image.toString('ascii',1,4),'PNG');
    equal(image.byteLength > 250000,true,'Header artwork is unexpectedly small.');
    const width=image.readUInt32BE(16);
    const height=image.readUInt32BE(20);
    equal(width >= 1500,true);
    equal(width / height >= 2.2,true);
});

integration('I019','docs.social.geometry','social card PNG has the documented dimensions',()=>{
    const image=fs.readFileSync(new URL('assets/og.png',root));
    equal(image.toString('ascii',1,4),'PNG');
    equal(image.readUInt32BE(16),2172);
    equal(image.readUInt32BE(20),724);
});

integration('I020','docs.testing.catalog','test scripts and suite pages match the unique catalog',()=>{
    const packageData=JSON.parse(read('package.json'));
    const data=catalog();
    for(const suite of ['unit','functional','integration','regression']){
        equal(packageData.scripts[`test:${suite}`],`node ./scripts/test.js ${suite}`);
        const overview=read('testing/index.html');
        equal(overview.includes(`data-suite="${suite}" data-cases="${data.suites[suite].cases}"`),true);
        const page=read(`testing/${suite}/index.html`);
        const suiteCases=data.cases.filter(entry=>entry.suite === suite);
        for(const entry of suiteCases){
            equal(page.includes(`data-case-id="${entry.id}"`),true,`${entry.id} is missing from its suite page.`);
            equal(page.includes(`data-contract="${entry.contract}"`),true,`${entry.contract} is missing from its suite page.`);
        }
    }
    equal(data.total,data.cases.length);
    equal(read('test/harness.js').includes("import('vanilla-test')"),true);
    equal(JSON.parse(read('vanilla-test.config.json')).entry,'./test/coverage.js');
});

integration('I021','workflows.ci.gates','CI exposes suite, coverage, compatibility, browser, and package gates',()=>{
    const ci=read('.github/workflows/ci.yml');
    for(const suite of ['unit','functional','integration','regression']){
        equal(ci.includes(`npm run test:${suite}`),true,`CI omits ${suite}.`);
    }
    equal(ci.includes('npm run test:regression:chrome'),true);
    equal(ci.includes('npm run coverage'),true);
    equal(ci.includes("'12.22.12'"),true);
    equal(ci.includes('node ./scripts/test.js legacy'),true);
    equal(ci.includes('npm pack'),true);
    equal(ci.includes('node ./scripts/test-catalog.js --github-summary'),true);
});

integration('I022','workflows.pages.artifact','Pages is CI-gated and assembles every curated route and runner asset',()=>{
    const pages=read('.github/workflows/pages.yml');
    equal(pages.includes('workflow_run'),true);
    equal(pages.includes("conclusion == 'success'"),true);
    for(const pageName of allPages){
        equal(pages.includes(pageName.replace('/index.html','')),true,`Pages workflow omits ${pageName}.`);
    }
    for(const pageName of suitePages){
        equal(pages.includes(pageName),true,`Pages source copy omits ${pageName}.`);
        equal(pages.includes(`_site/${pageName}`),true,`Pages artifact omits ${pageName}.`);
    }
    for(const file of ['frame.html','playground.css','runner.js','runtime.js','worker.js']){
        equal(pages.includes(`playground/${file}`),true,`Pages workflow omits playground/${file}.`);
        equal(pages.includes(`_site/playground/${file}`),true,`Pages artifact omits playground/${file}.`);
    }
});

integration('I023','repository.javascript-only','repository remains JavaScript-only',()=>{
    const forbidden=[];
    function inspect(directory){
        for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
            if(['.git','coverage','node_modules'].includes(entry.name)){
                continue;
            }
            const target=new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`,directory);
            if(entry.isDirectory()){
                inspect(target);
            }else if(/\.(?:ts|tsx)$/i.test(entry.name)){
                forbidden.push(target.href);
            }
        }
    }
    inspect(root);
    deepEqual(forbidden,[]);
});

export {allPages,localTargets,primaryPages,read,root,suitePages,targetExists};
