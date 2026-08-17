import {resolveRequest} from '../../scripts/serve.js';
import {equal} from '../harness.js';
import {suiteCase} from '../catalog.js';
import {request,withServer} from '../helpers/server.js';

const integration=suiteCase('integration');

integration('I024','server.resolve.valid','resolver maps valid root and nested site paths',()=>{
    equal(resolveRequest('/').endsWith('easy-stack'),true);
    equal(resolveRequest('/guide/').endsWith('guide'),true);
    equal(resolveRequest('/playground/').endsWith('playground'),true);
    equal(resolveRequest('/testing/unit/').endsWith('unit'),true);
});

integration('I025','server.serve.html','local server serves documentation and runner HTML',async()=>{
    await withServer(async port=>{
        for(const path of ['/','/guide/','/playground/','/playground/frame.html','/testing/unit/']){
            const response=await request(port,path);
            equal(response.status,200,`${path} did not return 200.`);
            equal(response.headers['content-type'],'text/html; charset=utf-8',`${path} has the wrong type.`);
        }
    });
});

integration('I026','server.serve.runner-assets','local server serves runner assets with MIME and CORS',async()=>{
    await withServer(async port=>{
        const assets={
            '/assets/playground.js':'text/javascript; charset=utf-8',
            '/playground/playground.css':'text/css; charset=utf-8',
            '/playground/runner.js':'text/javascript; charset=utf-8',
            '/playground/runtime.js':'text/javascript; charset=utf-8',
            '/playground/worker.js':'text/javascript; charset=utf-8',
            '/stack.js':'text/javascript; charset=utf-8'
        };

        for(const [path,type] of Object.entries(assets)){
            const response=await request(port,path);
            equal(response.status,200,`${path} did not return 200.`);
            equal(response.headers['content-type'],type,`${path} has the wrong type.`);
            equal(response.headers['access-control-allow-origin'],'*',`${path} is missing CORS.`);
        }
    });
});

integration('I027','server.serve.header-image','local server serves the generated header PNG',async()=>{
    await withServer(async port=>{
        const response=await request(port,'/assets/easy-stack-header.png');
        equal(response.status,200);
        equal(response.headers['content-type'],'image/png');
        equal(response.body.toString('ascii',1,4),'PNG');
    });
});
