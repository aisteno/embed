import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function validatePurge(response, expectedPath) {
    const providers = response.paths?.[expectedPath]?.providers;
    if (response.status !== 'finished' || !providers ||
        Object.keys(providers).length === 0 ||
        Object.values(providers).some(success => success !== true)) {
        throw new Error(`jsDelivr purge failed for ${expectedPath}: ${JSON.stringify(response)}`);
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    validatePurge(JSON.parse(await readFile(process.argv[2], 'utf8')), process.argv[3]);
}
