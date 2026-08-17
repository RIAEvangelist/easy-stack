const packageImport=/^(\s*)import\s+Stack\s+from\s+(['"])easy-stack\2\s*;/;

function prepareSource(source,stackModuleSource){
    if(typeof source !== 'string'){
        throw new TypeError('Playground source must be a string.');
    }
    if(typeof stackModuleSource !== 'string' || stackModuleSource.length === 0){
        throw new TypeError('The checked-in easy-stack module source is unavailable.');
    }
    if(!packageImport.test(source)){
        throw new SyntaxError("Source must begin with import Stack from 'easy-stack';");
    }

    const moduleUrl=`data:text/javascript;charset=utf-8,${encodeURIComponent(stackModuleSource)}`;
    return source.replace(packageImport,(match,spacing)=>`${spacing}import Stack from ${JSON.stringify(moduleUrl)};`);
}

export {prepareSource};
