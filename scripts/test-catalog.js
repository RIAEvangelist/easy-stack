import fs from 'node:fs';
import '../test/cases/all.js';
import {catalogSnapshot,catalogSummary,validateCatalog} from '../test/catalog.js';

validateCatalog(['unit','functional','integration','regression']);
const summary=catalogSummary();

if(process.argv.includes('--json')){
    console.log(JSON.stringify({cases:catalogSnapshot(),...summary}));
}else{
    const lines=[
        '| Suite | Unique cases |',
        '| --- | ---: |',
        ...Object.values(summary.suites).map(suite=>`| ${suite.label} | ${suite.cases} |`),
        `| **Total** | **${summary.total}** |`,
        '',
        'Each stable case ID and contract key is counted once. Runtime replays and CI gates are reported separately.'
    ];

    if(process.argv.includes('--github-summary')){
        const target=process.env.GITHUB_STEP_SUMMARY;
        if(!target){
            throw new Error('GITHUB_STEP_SUMMARY is required for --github-summary.');
        }
        fs.appendFileSync(target,`## Test catalog\n\n${lines.join('\n')}\n`,'utf8');
    }else{
        console.log(lines.join('\n'));
    }
}
