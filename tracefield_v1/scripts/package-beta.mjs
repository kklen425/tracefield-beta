import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.scripts['test:quota']='node scripts/quota-test.mjs';p.scripts['benchmark:text']='node --experimental-strip-types scripts/text-benchmark.mjs';p.scripts.test='node scripts/run-tests.mjs';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
