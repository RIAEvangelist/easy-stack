const send=globalThis.postMessage.bind(globalThis);
let activeToken='';

function serialize(value,seen=new WeakSet()){
    if(typeof value === 'bigint'){
        return `${value}n`;
    }
    if(typeof value === 'symbol' || typeof value === 'function'){
        return String(value);
    }
    if(value instanceof Error){
        return `${value.name}: ${value.message}`;
    }
    if(value === undefined){
        return 'undefined';
    }
    if(value === null || typeof value !== 'object'){
        return typeof value === 'string' ? value : String(value);
    }
    if(seen.has(value)){
        return '[Circular]';
    }

    seen.add(value);
    if(value instanceof Map){
        return `Map(${value.size}) ${serialize([...value],seen)}`;
    }
    if(value instanceof Set){
        return `Set(${value.size}) ${serialize([...value],seen)}`;
    }
    try{
        return JSON.stringify(value,(key,current)=>typeof current === 'bigint' ? `${current}n` : current,2);
    }catch{
        return Object.prototype.toString.call(value);
    }
}

for(const level of ['log','info','warn','error']){
    console[level]=(...values)=>send({
        level,
        message:values.map(value=>serialize(value)).join(' '),
        token:activeToken,
        type:'console'
    });
}

globalThis.addEventListener('message',async event=>{
    if(!event.data || event.data.type !== 'run' || typeof event.data.source !== 'string' || typeof event.data.token !== 'string'){
        return;
    }

    activeToken=event.data.token;
    const url=URL.createObjectURL(new Blob([event.data.source],{type:'text/javascript'}));

    try{
        await import(url);
        send({token:activeToken,type:'done'});
    }catch(error){
        send({message:serialize(error),token:activeToken,type:'error'});
    }finally{
        URL.revokeObjectURL(url);
    }
});
