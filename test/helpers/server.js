import http from 'node:http';
import {createSiteServer} from '../../scripts/serve.js';

function listen(server){
    return new Promise((resolve,reject)=>{
        server.once('error',reject);
        server.listen(0,'127.0.0.1',()=>resolve(server.address().port));
    });
}

function close(server){
    return new Promise((resolve,reject)=>server.close(error=>error ? reject(error) : resolve()));
}

function request(port,path){
    return new Promise((resolve,reject)=>{
        const outgoing=http.get({host:'127.0.0.1',port,path},response=>{
            const chunks=[];
            response.on('data',chunk=>chunks.push(chunk));
            response.on('end',()=>resolve({
                body:Buffer.concat(chunks),
                headers:response.headers,
                status:response.statusCode
            }));
        });
        outgoing.on('error',reject);
    });
}

async function withServer(check){
    const server=createSiteServer();
    const port=await listen(server);
    try{
        await check(port);
    }finally{
        await close(server);
    }
}

export {close,listen,request,withServer};
