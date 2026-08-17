import {resolveRequest} from '../../scripts/serve.js';
import {equal} from '../harness.js';
import {suiteCase} from '../catalog.js';
import {request,withServer} from '../helpers/server.js';

const regression=suiteCase('regression');

regression('R009','regression.server.resolve-traversal','resolver blocks encoded traversal outside the site root',()=>{
    equal(resolveRequest('/%2e%2e%2foutside.txt'),null);
});

regression('R010','regression.server.http-traversal','HTTP traversal returns 403',async()=>{
    await withServer(async port=>equal((await request(port,'/%2e%2e%2foutside.txt')).status,403));
});

regression('R011','regression.server.malformed-uri','malformed encoded paths return 400',async()=>{
    await withServer(async port=>equal((await request(port,'/%E0%A4%A')).status,400));
});

regression('R012','regression.server.missing-file','missing files return 404',async()=>{
    await withServer(async port=>equal((await request(port,'/not-here')).status,404));
});
