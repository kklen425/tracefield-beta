import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
const scripts=['scripts/migration-plan.test.mjs','scripts/sign-out-plan.test.mjs','scripts/write-atomic.test.mjs'];
const a=spawnSync(process.execPath,['--test',...scripts],{stdio:'inherit'});if(a.status)process.exit(a.status);
const b=spawnSync(process.execPath,['--experimental-strip-types','--test','src/lib/auth/sign-in-gate.test.ts','src/lib/scan/text.test.ts','src/lib/scan/c2pa-state.test.ts','src/lib/billing/stripe-signature.test.ts','src/lib/scan/fft.test.ts','src/lib/scan/png.test.ts','src/lib/scan/signatures.test.ts'],{stdio:'inherit'});process.exit(b.status??1);
