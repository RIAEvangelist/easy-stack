import fs from 'node:fs';
import {deepEqual,equal,run,test} from './harness.js';

const root=new URL('../',import.meta.url);
const pageNames=[
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

function read(relativePath){
    return fs.readFileSync(new URL(relativePath,root),'utf8');
}

function localTargets(source){
    const targets=[];
    const pattern=/(?:href|src)="([^"]+)"/g;
    let match;

    while((match=pattern.exec(source))){
        const target=match[1];
        if(/^(?:https?:|mailto:|data:)/i.test(target)){
            continue;
        }
        targets.push(target);
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

test('the documentation is split into ten focused pages',()=>{
    const missing=pageNames.filter(name=>!fs.existsSync(new URL(name,root)));
    deepEqual(missing,[]);
    equal(pageNames.length,10);
});

test('every page exposes its short, page-specific contract',()=>{
    const required={
        'index.html':['overview','guarantees','routes'],
        'guide/index.html':['start','install','first-stack','model'],
        'api/index.html':['api','methods','state'],
        'patterns/index.html':['patterns','priority','gates','errors'],
        'browser/index.html':['browser','esm','classic','serve'],
        'examples/index.html':['examples','try-playground','recipes'],
        'playground/index.html':['playground','controls','pending','trace'],
        'queue/index.html':['queue','comparison','choice'],
        'migration/index.html':['migration','changes','checklist'],
        'testing/index.html':['testing','suites','coverage','ci']
    };

    for(const [name,ids] of Object.entries(required)){
        const source=read(name);
        const missing=ids.filter(id=>!source.includes(`id="${id}"`));
        deepEqual(missing,[],`${name} is missing required sections.`);
    }
});

test('every local page link, script, stylesheet, image, and fragment resolves',()=>{
    const missing=[];

    for(const pageName of pageNames){
        const source=read(pageName);
        for(const target of localTargets(source)){
            if(!targetExists(pageName,target)){
                missing.push(`${pageName} -> ${target}`);
            }
        }
    }

    deepEqual(missing,[],'Missing local documentation targets.');
});

test('every page navigation exposes all ten routes and one current page',()=>{
    const expected=pageNames.map(name=>new URL(name,root).href).sort();

    for(const pageName of pageNames){
        const source=read(pageName);
        const navigation=source.match(/<nav[^>]+data-site-nav[^>]*>[\s\S]*?<\/nav>/);
        equal(Boolean(navigation),true,`${pageName} is missing the primary navigation.`);

        const base=new URL(pageName,root);
        const targets=localTargets(navigation[0]).map(target=>{
            let resolved=new URL(target,base);
            if(resolved.pathname.endsWith('/')){
                resolved=new URL('index.html',resolved);
            }
            return resolved.href;
        }).sort();

        deepEqual(targets,expected,`${pageName} does not link every documentation route.`);
        equal((navigation[0].match(/aria-current="page"/g) || []).length,1,`${pageName} must identify one current page.`);
    }
});

test('the site loads no remote script, stylesheet, font, or content image',()=>{
    for(const pageName of pageNames){
        const source=read(pageName);
        const remoteScript=/<script[^>]+src="https?:\/\//i.test(source);
        const remoteStylesheet=/<link[^>]+rel="stylesheet"[^>]+href="https?:\/\//i.test(source);
        const remoteImage=/<img[^>]+src="https?:\/\//i.test(source);
        equal(remoteScript || remoteStylesheet || remoteImage,false,`${pageName} loads a remote asset.`);
    }
    equal(/@import\s+url\(\s*['"]?https?:\/\//i.test(read('assets/site.css')),false);
});

test('README leads with the generated header and links the focused docs',()=>{
    const readme=read('README.md');
    equal(readme.startsWith('[![easy-stack — explicit LIFO flow control for JavaScript](https://raw.githubusercontent.com/RIAEvangelist/easy-stack/main/assets/easy-stack-header.png)](https://riaevangelist.github.io/easy-stack/)'),true);
    for(const path of ['guide/','api/','patterns/','browser/','examples/','playground/','testing/']){
        equal(readme.includes(`https://riaevangelist.github.io/easy-stack/${path}`),true,`README omits ${path}.`);
    }
    equal(/avatars\d*\.githubusercontent\.com/i.test(readme),false);
});

test('the repository header is a substantial panoramic PNG',()=>{
    const siteCss=read('assets/site.css');
    equal(/\.hero__visual img\s*\{[^}]*height:\s*auto;/s.test(siteCss),true,'The site header must preserve its intrinsic aspect ratio.');

    const image=fs.readFileSync(new URL('assets/easy-stack-header.png',root));
    equal(image.toString('ascii',1,4),'PNG');
    const width=image.readUInt32BE(16);
    const height=image.readUInt32BE(20);
    equal(width >= 1500,true);
    equal(width / height >= 2.2,true);
    equal(image.byteLength > 250000,true);

    const socialImage=fs.readFileSync(new URL('assets/og.png',root));
    equal(socialImage.toString('ascii',1,4),'PNG');
    equal(socialImage.readUInt32BE(16),2172);
    equal(socialImage.readUInt32BE(20),724);
});

test('the playground uses the canonical module without executable-text shortcuts',()=>{
    const page=read('playground/index.html');
    const source=read('assets/playground.js');
    equal(page.includes('<script type="module" src="../assets/playground.js"></script>'),true);
    equal(source.startsWith("import Stack from '../stack.js';"),true);
    equal(/\beval\s*\(|new\s+Function\b|\.innerHTML\s*=|set(?:Timeout|Interval)\s*\(/.test(source),false);
});

test('vanilla-test, coverage, package checks, and Pages deployment are wired',()=>{
    const packageData=JSON.parse(read('package.json'));
    equal(packageData.devDependencies['vanilla-test'],'2.1.1');
    equal(packageData.scripts.coverage,'vanilla-test coverage');
    equal(read('test/harness.js').includes("import('vanilla-test')"),true);
    const ci=read('.github/workflows/ci.yml');
    const pages=read('.github/workflows/pages.yml');
    equal(ci.includes('npm run coverage'),true);
    equal(ci.includes("'12.22.12'"),true);
    equal(ci.includes('npm pack'),true);
    equal(pages.includes('actions/deploy-pages'),true);
    equal(pages.includes('workflow_run'),true);
    equal(pages.includes("conclusion == 'success'"),true);
    for(const pageName of pageNames){
        equal(pages.includes(pageName.split('/')[0]),true,`Pages workflow omits ${pageName}.`);
    }
    equal(pages.includes('cp playground/index.html _site/playground/'),true);
    equal(pages.includes('assets/playground.js'),true);
    equal(pages.includes('_site/playground/index.html'),true);
    equal(pages.includes('_site/assets/playground.js'),true);
});

test('the project remains JavaScript-only',()=>{
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

await run();
