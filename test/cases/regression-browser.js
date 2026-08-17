import {setTimeout as delay} from 'node:timers/promises';
import {createSiteServer} from '../../scripts/serve.js';
import {assert,equal} from '../harness.js';
import {suiteCase} from '../catalog.js';

const regression=suiteCase('regression');
const timeoutMs=30000;
const vanillaTestURL=new URL(import.meta.resolve('vanilla-test'));
const chromeSessionURL=new URL('./lib/coverage/chrome-session.js',vanillaTestURL);
const {launchChrome,PageSession}=await import(chromeSessionURL);

function listen(server){
    return new Promise((resolve,reject)=>{
        server.once('error',reject);
        server.listen(0,'127.0.0.1',()=>resolve(server.address().port));
    });
}

function close(server){
    return new Promise((resolve,reject)=>server.close(error=>error ? reject(error) : resolve()));
}

async function findFrame(browser,frameURL){
    const deadline=Date.now()+timeoutMs;

    while(Date.now() < deadline){
        const {targetInfos}=await browser.send('Target.getTargets');
        const target=targetInfos.find(info=>info.type === 'iframe' && info.url === frameURL);

        if(target){
            const {sessionId}=await browser.send('Target.attachToTarget',{
                flatten:true,
                targetId:target.targetId
            });
            const frame=new PageSession(browser,target.targetId,sessionId);
            await Promise.all([
                frame.send('Runtime.enable'),
                frame.send('Log.enable')
            ]);
            return frame;
        }

        await delay(50);
    }

    throw new Error(`Timed out waiting for the sandbox frame at ${frameURL}.`);
}

async function withPlayground(check){
    const server=createSiteServer();
    let browser;

    try{
        const port=await listen(server);
        const origin=`http://127.0.0.1:${port}`;
        browser=await launchChrome({
            executablePath:process.env.CHROME_PATH || null,
            headless:true,
            timeoutMs,
            viewport:{width:1440,height:1000}
        });
        const page=await browser.createPage({
            colorScheme:'dark',
            viewport:{width:1440,height:1000}
        });
        const errors=[];
        const recordException=event=>errors.push(
            event.exceptionDetails?.exception?.description || event.exceptionDetails?.text
        );
        const recordLog=({entry})=>{
            if(entry?.level === 'error' && !entry.url?.endsWith('/favicon.ico')){
                errors.push(entry.text);
            }
        };

        page.on('Runtime.exceptionThrown',recordException);
        await page.send('Log.enable');
        page.on('Log.entryAdded',recordLog);
        await page.goto(`${origin}/playground/`,{waitUntil:'load',timeoutMs});

        const frame=await findFrame(browser,`${origin}/playground/frame.html`);
        frame.on('Runtime.exceptionThrown',recordException);
        frame.on('Log.entryAdded',recordLog);
        await frame.waitForFunction(
            `document.querySelector('[data-runner-source]').value.includes('stack.add(')`,
            {timeoutMs}
        );

        await check({errors,frame,page});
        equal(errors.length,0,`Chrome reported errors: ${errors.join(' | ')}`);
    }finally{
        await browser?.close().catch(()=>{});
        if(server.listening){
            await close(server);
        }
    }
}

regression(
    'R015',
    'playground.worker.opaque-classic-bootstrap',
    'opaque editor sandbox runs synchronized LIFO source in a classic Worker',
    async()=>withPlayground(async({frame,page})=>{
        await page.evaluate(`document.querySelector('[data-playground-next]').click()`);
        await frame.waitForFunction(
            `document.querySelector('[data-runner-source]').value.includes('\\nstack.next();\\n')`,
            {timeoutMs}
        );
        await frame.evaluate(`document.querySelector('[data-runner-run]').click()`);
        await frame.waitForFunction(`(() => {
            const value=document.querySelector('[data-runner-status]').textContent;
            return value.startsWith('Module completed') || /failed|error|timed out/i.test(value);
        })()`,{timeoutMs});

        const result=await frame.evaluate(`(() => ({
            output:document.querySelector('[data-runner-output]').textContent,
            status:document.querySelector('[data-runner-status]').textContent,
            success:Boolean(document.querySelector('[data-runner-output] [data-level="success"]'))
        }))()`);

        equal(result.status.startsWith('Module completed'),true,result.status);
        equal(result.success,true,'The live console did not report module completion.');
        const newest=result.output.indexOf('newest');
        const second=result.output.indexOf('second');
        const first=result.output.indexOf('first');
        assert(newest !== -1 && newest < second && second < first,'The live console did not preserve LIFO trace order.');
        equal(result.output.includes('"pending": []'),true,'The synchronized replay left pending work.');
    })
);

regression(
    'R016',
    'playground.worker.completed-module-hard-lifetime',
    'completed async module is terminated at the hard Worker lifetime',
    async()=>withPlayground(async({frame})=>{
        const customSource=`import Stack from 'easy-stack';

const stack=new Stack();
let tick=0;

setInterval(()=>console.log(\`tick ${'${'}++tick}\`),50);
console.log({size:stack.size});
`;

        await frame.evaluate(`(() => {
            const source=document.querySelector('[data-runner-source]');
            source.value=${JSON.stringify(customSource)};
            source.dispatchEvent(new Event('input',{bubbles:true}));
            document.querySelector('[data-runner-run]').click();
        })()`);
        await frame.waitForFunction(
            `document.querySelector('[data-runner-status]').textContent.startsWith('Module completed')`,
            {timeoutMs}
        );
        await frame.waitForFunction(
            `document.querySelector('[data-runner-status]').textContent === 'Module completed; its isolated Worker closed after 4 seconds.'`,
            {timeoutMs}
        );

        const stopped=await frame.evaluate(`(() => ({
            count:document.querySelector('[data-runner-output]').children.length,
            disabled:document.querySelector('[data-runner-stop]').disabled,
            runEnabled:!document.querySelector('[data-runner-run]').disabled,
            output:document.querySelector('[data-runner-output]').textContent
        }))()`);
        equal(stopped.disabled,true,'Stop must disable after the hard lifetime closes.');
        equal(stopped.runEnabled,true,'Run must re-enable after the hard lifetime closes.');
        equal(stopped.output.includes('Isolated async window closed after 4 seconds.'),true);
        assert(stopped.output.includes('tick '),'The async fixture did not run before shutdown.');

        await delay(300);
        const finalCount=await frame.evaluate(
            `document.querySelector('[data-runner-output]').children.length`
        );
        equal(finalCount,stopped.count,'Console output continued after Worker termination.');
    })
);
